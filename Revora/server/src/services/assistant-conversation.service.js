/**
 * Assistant Conversation Service
 * 
 * The Mistral-led turn controller. Orchestrates each conversation turn:
 *   1. Detect greeting/small-talk/out-of-scope → handle without LLM
 *   2. Run parser for labeled number extraction
 *   3. Call Mistral for collection/extraction (1st call)
 *   4. Merge parser + Mistral facts safely
 *   5. Compute next stage
 *   6. If stage transitions to summarizing/advising → 2nd Mistral call
 *   7. Return { reply, draft, stage, diagnostics }
 * 
 * Server controls all stage transitions. Mistral controls wording.
 */

import { callLLMJsonWithRetry } from "./llm.service.js";
import { parseAssistantDecision, buildAdvice } from "./assistant.service.js";
import {
  STAGES,
  computeStage,
  hasEnoughCoreFacts,
  mergeSafeFacts,
  isCleanConfirmation,
  isCorrectionWithDetails,
  isRejection,
  detectLoopRepeat
} from "./assistant-state.service.js";
import {
  buildConversationPrompt,
  buildSummarizePrompt,
  buildAdvicePrompt,
  buildStrictRetryPrompt,
  compactDraftForPrompt
} from "./assistant-prompts.js";
import {
  buildFallbackReply,
  buildLoopBreakReply
} from "./assistant-fallbacks.js";
import { KnowledgeBase } from "../models/knowledge-base.model.js";

// ─── Test Hook ──────────────────────────────────────────────────────────────
let llmMock = null;
export function __setLLMMock(mockFn) {
  llmMock = mockFn;
}

// ─── Intent Detection (reused from assistant.service.js patterns) ───────────

function isGreeting(message) {
  return /^(hi|hello|hey|namaste|good morning|good evening|good afternoon)(\s+there)?[!.\s]*$/i.test(String(message || "").trim());
}

function isSmallTalk(message) {
  const text = String(message || "").trim().toLowerCase();
  return /^(how are you|how r u|how are u|what's up|whats up|who are you|what can you do|thanks|thank you|ok|okay|cool|nice|great)[?!. ]*$/i.test(text);
}

function isOutOfScope(message) {
  const text = String(message || "").trim().toLowerCase();
  if (/\d/.test(text) || /\b(price|cost|sell|sales|demand|stock|profit)\b/i.test(text)) return false;
  return /\?$/.test(text) || /\b(weather|joke|capital|news|recipe|movie|song|cricket|football|game|homework)\b/i.test(text);
}

// ─── KB Evidence Builder (no LLM call) ──────────────────────────────────────

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function unitText(draft) {
  const unit = draft?.context?.unit;
  return unit ? ` per ${unit}` : "";
}

function isKnownProduct(draft) {
  return !!(draft?.product && draft.product !== "Unknown product");
}

function isPlanningReady(draft) {
  return isKnownProduct(draft)
    && hasValue(draft.currentPrice)
    && hasValue(draft.proposedPrice)
    && hasValue(draft.cost);
}

function buildDeterministicSummary(draft) {
  const unit = unitText(draft);

  if ((draft.decisionMode || draft.context?.decisionMode) === "planning") {
    return `Here is what I understood: ${draft.product} is currently selling at Rs ${draft.currentPrice}${unit}, you are planning Rs ${draft.proposedPrice}${unit}, and your buying cost is Rs ${draft.cost}${unit}. Is this correct, or did I get something wrong?`;
  }

  const priceText = hasValue(draft.oldPrice) && hasValue(draft.newPrice)
    ? `changed from Rs ${draft.oldPrice} to Rs ${draft.newPrice}${unit}`
    : `is priced at Rs ${draft.currentPrice ?? draft.newPrice}${unit}`;
  const demandText = draft.demandChange && draft.demandChange !== "unknown"
    ? ` Demand went ${draft.demandChange}.`
    : "";
  const costText = hasValue(draft.cost) ? ` Cost is Rs ${draft.cost}${unit}.` : "";
  return `Here is what I understood: ${draft.product} ${priceText}.${demandText}${costText} Is this correct, or did I get something wrong?`;
}

function buildNextQuestion(draft) {
  const name = isKnownProduct(draft) ? draft.product : "the product";
  const unit = unitText(draft);
  const pending = draft.context?.pendingField;

  if (pending === "product") return "Which product is this about?";
  if (pending === "priceMeaning") {
    const latest = draft.context?.uncertainFacts?.at(-1);
    const value = latest?.value ? `Rs ${latest.value}${unit}` : "that number";
    return `Is ${value} your current selling price, planned price, or buying cost?`;
  }
  if (pending === "currentPrice") return `What is the current selling price for ${name}${unit}?`;
  if (pending === "proposedPrice") return `What price are you planning for ${name}${unit}?`;
  if (pending === "cost") return `What supplier or buying cost do you pay for ${name}${unit}?`;
  if (pending === "oldPrice") return `What was the old price for ${name}${unit}?`;
  if (pending === "newPrice") return `What is the new or current selling price for ${name}${unit}?`;
  if (pending === "demandChange") return `What happened to sales or customer visits for ${name}?`;
  if (pending === "goal") return "What is your goal here: protect profit, grow sales, clear stock, or match competition?";

  return `What is the current selling price for ${name}${unit}? If you already changed it, you can say old to new.`;
}

function buildRepairQuestion(draft) {
  const name = isKnownProduct(draft) ? draft.product : "the product";
  const unit = unitText(draft);
  const pending = draft.context?.pendingField;

  if (pending === "product") return "I still need the product name. Can you just type the name of the product you are asking about?";
  if (pending === "priceMeaning") return "I didn't catch that. Please just say 'current price', 'planned price', or 'cost'.";
  if (pending === "currentPrice") return `Please type just the number for the current selling price of ${name}${unit}.`;
  if (pending === "proposedPrice") return `Please type just the number for your planned price for ${name}${unit}.`;
  if (pending === "cost") return `I need the cost to give good advice. How much do you pay to buy ${name}${unit}? Just the number is fine.`;
  if (pending === "oldPrice") return `Please give me just the old price number for ${name}${unit} before the change.`;
  if (pending === "newPrice") return `Please give me just the new price number for ${name}${unit} after the change.`;
  if (pending === "demandChange") return `Did sales go up, down, or stay the same?`;
  if (pending === "goal") return "Just pick one: profit, sales, stock, or competitor?";

  return buildLoopBreakReply(draft);
}

function hasDeterministicSignal(draft, existingDraft = null) {
  if (!draft) return false;
  if (draft.context?.pendingField === "priceMeaning") return true;
  if (isKnownProduct(draft) && !isKnownProduct(existingDraft)) return true;

  for (const field of ["oldPrice", "newPrice", "currentPrice", "proposedPrice", "cost", "competitorPrice"]) {
    if (hasValue(draft[field]) && draft[field] !== existingDraft?.[field]) return true;
  }

  if (draft.decisionMode && draft.decisionMode !== "unknown" && draft.decisionMode !== existingDraft?.decisionMode) return true;
  if (draft.demandChange && draft.demandChange !== "unknown" && draft.demandChange !== existingDraft?.demandChange) return true;
  if (draft.goal && draft.goal !== existingDraft?.goal) return true;
  return false;
}

function shouldUseMistralCollection(raw, draft, existingDraft = null) {
  const wordCount = String(raw || "").trim().split(/\s+/).filter(Boolean).length;
  const complexLowConfidenceTurn = wordCount >= 7
    && /\b(demand|festival|market|pricing|scenario|explain|confused|not sure|situation)\b/i.test(raw)
    && !draft.readyForConfirmation
    && !isPlanningReady(draft);

  if (complexLowConfidenceTurn) return true;
  if (hasDeterministicSignal(draft, existingDraft)) return false;
  return false;
}

function isFieldMissing(field, draft) {
  if (field === "cost") return draft.cost === null || draft.cost === undefined;
  if (field === "demandChange") return !draft.demandChange || draft.demandChange === "unknown";
  if (field === "goal") return !draft.goal;
  if (field === "oldPrice") return draft.oldPrice === null;
  if (field === "newPrice") return draft.newPrice === null;
  if (field === "product") return !draft.product || draft.product === "Unknown product";
  if (field === "currentPrice") return draft.currentPrice === null || draft.currentPrice === undefined;
  if (field === "proposedPrice") return draft.proposedPrice === null || draft.proposedPrice === undefined;
  if (field === "priceMove") return draft.oldPrice === null && draft.newPrice === null && draft.currentPrice === null && draft.proposedPrice === null;
  if (field === "priceMeaning") return draft.oldPrice === null && draft.newPrice === null && draft.currentPrice === null && draft.proposedPrice === null && draft.cost === null;
  return false;
}

function deterministicCollectionResult(raw, draft, existingDraft, currentStage, startedAt) {
  const lastAskedField = existingDraft?.context?.lastAskedField;
  let isStillMissing = false;
  if (lastAskedField) {
    isStillMissing = isFieldMissing(lastAskedField, draft);
  }

  const repairState = { ...(existingDraft?.context?.repairState || {}) };
  if (lastAskedField && isStillMissing) {
    repairState[lastAskedField] = (repairState[lastAskedField] || 0) + 1;
  } else if (lastAskedField) {
    repairState[lastAskedField] = 0;
  }

  const forceDeterministic = lastAskedField && repairState[lastAskedField] >= 2;

  if (!forceDeterministic && shouldUseMistralCollection(raw, draft, existingDraft)) {
    return null;
  }

  const nextDraft = {
    ...draft,
    context: {
      ...(draft.context || {}),
      stage: isPlanningReady(draft) || draft.readyForConfirmation ? STAGES.AWAITING_CONFIRMATION : currentStage,
      lastAskedField: draft.context?.pendingField || null,
      repairState
    }
  };
  const readyToSummarize = nextDraft.context.stage === STAGES.AWAITING_CONFIRMATION;
  const reply = forceDeterministic
    ? buildRepairQuestion(nextDraft)
    : readyToSummarize
    ? buildDeterministicSummary(nextDraft)
    : buildNextQuestion(nextDraft);
  nextDraft.context.lastAssistantReply = reply;
  if (readyToSummarize) {
    nextDraft.context.scenarioSummary = reply;
  }

  return {
    reply,
    draft: nextDraft,
    stage: nextDraft.context.stage,
    diagnostics: {
      replySource: forceDeterministic ? "repair_fallback" : (readyToSummarize ? "deterministic_summary" : "deterministic"),
      latencyMs: Date.now() - startedAt
    }
  };
}

async function buildEvidencePackage(draft) {
  const evidence = {
    recommendation: draft.advice?.recommendation || "",
    rationale: draft.advice?.rationale || "",
    severity: draft.advice?.severity || "unknown",
    nextStep: draft.advice?.nextStep || "",
    actionPlan: draft.advice?.actionPlan || null,
    selectedPlaybook: draft.context?.selectedPlaybook || null,
    businessSignals: draft.context?.businessSignals || null,
    theoreticalRoot: null,
    historicalPrecedent: null
  };

  // Attach KB if available
  if (draft.priceChangeType !== "unknown" && draft.demandChange !== "unknown") {
    try {
      if (KnowledgeBase.db?.readyState === 1) {
        const kbTag = `price_${draft.priceChangeType}_demand_${draft.demandChange}`;
        const principle = await KnowledgeBase.findOne({ tag: kbTag }).lean();
        if (principle) {
          evidence.theoreticalRoot = {
            economicPrinciple: principle.economicPrinciple,
            explanation: principle.explanation,
            recommendation: principle.recommendation,
            risk: principle.risk
          };
          evidence.historicalPrecedent = principle.historicalCase || null;
        }
      }
    } catch (err) {
      console.error("[Conversation] KB lookup failed:", err.message);
    }
  }

  return evidence;
}

async function summarizeWithMistralOrFallback(draft, chatHistory, startedAt) {
  try {
    let summaryResult;
    if (llmMock) {
      summaryResult = await llmMock("summary");
    } else {
      summaryResult = await callLLMJsonWithRetry(
        buildSummarizePrompt(draft, chatHistory),
        buildStrictRetryPrompt,
        { timeoutMs: 65000, options: { num_predict: 300, temperature: 0.2 } }
      );
    }

    if (summaryResult.data && !summaryResult.retryFailed) {
      const summaryData = summaryResult.data;
      draft.context = draft.context || {};
      draft.context.scenarioSummary = summaryData.scenarioSummary || summaryData.reply || "";
      draft.context.stage = STAGES.AWAITING_CONFIRMATION;

      return {
        reply: summaryData.reply || summaryData.scenarioSummary || "Here is what I understood. Is this correct, or did I get something wrong?",
        draft,
        stage: STAGES.AWAITING_CONFIRMATION,
        diagnostics: {
          replySource: "mistral_summary",
          retryUsed: summaryResult.retryUsed,
          secondCallUsed: true,
          latencyMs: Date.now() - startedAt
        }
      };
    }
  } catch (err) {
    console.error("[Conversation] Summary LLM call failed:", err.message);
  }

  const compact = compactDraftForPrompt(draft);
  const fallbackSummary = `Here is what I have: You ${compact.decisionMode === "planning" ? "are planning to change" : "changed"} the price of ${compact.product}. ${compact.oldPrice ? `Old price: ${compact.oldPrice}.` : ""} ${compact.newPrice ? `New price: ${compact.newPrice}.` : ""} ${compact.cost ? `Cost: ${compact.cost}.` : ""} ${compact.demandChange !== "unknown" ? `Demand went ${compact.demandChange}.` : ""} Is this correct?`;
  draft.context = draft.context || {};
  draft.context.scenarioSummary = fallbackSummary;
  draft.context.stage = STAGES.AWAITING_CONFIRMATION;

  return {
    reply: fallbackSummary,
    draft,
    stage: STAGES.AWAITING_CONFIRMATION,
    diagnostics: { replySource: "fallback_summary", secondCallUsed: false, latencyMs: Date.now() - startedAt }
  };
}

// ─── Main Turn Controller ───────────────────────────────────────────────────

/**
 * The main Mistral-led conversation turn.
 * 
 * @param {string} message - The user's message
 * @param {Array} chatHistory - Last 6 turns [{role, text}]
 * @param {Object} existingDraft - Current in-progress draft
 * @returns {{ reply, draft, stage, diagnostics }}
 */
async function collectionReplyWithMistralOrFallback(message, chatHistory, draft, stage, startedAt, intent = "collection") {
  try {
    let collectionResult;
    if (llmMock) {
      collectionResult = await llmMock("collection");
    } else {
      collectionResult = await callLLMJsonWithRetry(
        buildConversationPrompt(message, chatHistory, draft),
        buildStrictRetryPrompt,
        { timeoutMs: 65000, options: { num_predict: 220, temperature: 0.2 } }
      );
    }

    if (collectionResult.data && !collectionResult.retryFailed) {
      return {
        reply: collectionResult.data.reply || "Tell me what I should correct, and I will update the scenario.",
        draft,
        stage,
        diagnostics: {
          replySource: "mistral",
          intent,
          retryUsed: collectionResult.retryUsed,
          latencyMs: Date.now() - startedAt
        }
      };
    }
  } catch (err) {
    console.error("[Conversation] Collection LLM call failed:", err.message);
  }

  return {
    reply: "Tell me what I got wrong, and I will update the pricing scenario.",
    draft,
    stage,
    diagnostics: { replySource: "fallback", intent, latencyMs: Date.now() - startedAt }
  };
}

export async function runMistralConversationTurn(message, chatHistory = [], existingDraft = null) {
  const startedAt = Date.now();
  const raw = String(message || "").trim();
  const context = existingDraft?.context || {};
  const previousStage = context.stage || STAGES.OPENING;

  // ──────────────────────────────────────────────────────────────────────
  // Step 1: Handle non-pricing intents deterministically (no LLM call)
  // ──────────────────────────────────────────────────────────────────────

  if (isGreeting(raw) && previousStage === STAGES.OPENING) {
    return {
      reply: "Hey, good to see you. Tell me one price change you made recently, and I will help you think through whether it was a good move.",
      draft: {
        ...existingDraft,
        context: { ...context, stage: STAGES.COLLECTING }
      },
      stage: STAGES.COLLECTING,
      diagnostics: { replySource: "deterministic", intent: "greeting", latencyMs: Date.now() - startedAt }
    };
  }

  if (isGreeting(raw) && previousStage !== STAGES.OPENING) {
    return {
      reply: "Welcome back! We were working on your pricing decision. Where were we?",
      draft: existingDraft,
      stage: previousStage,
      diagnostics: { replySource: "deterministic", intent: "greeting_midflow", latencyMs: Date.now() - startedAt }
    };
  }

  if (isSmallTalk(raw)) {
    return {
      reply: "I am here and ready to help. Tell me a recent price change when you want a second opinion on it.",
      draft: existingDraft,
      stage: previousStage === STAGES.OPENING ? STAGES.COLLECTING : previousStage,
      diagnostics: { replySource: "deterministic", intent: "small_talk", latencyMs: Date.now() - startedAt }
    };
  }

  if (isOutOfScope(raw)) {
    return {
      reply: "I may be less useful on that than on pricing. Bring me a product price change, and I will help you reason through the move.",
      draft: existingDraft,
      stage: previousStage === STAGES.OPENING ? STAGES.COLLECTING : previousStage,
      diagnostics: { replySource: "deterministic", intent: "out_of_scope", latencyMs: Date.now() - startedAt }
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 2: Run parser for labeled number extraction
  // ──────────────────────────────────────────────────────────────────────

  let parserExtraction;
  try {
    parserExtraction = parseAssistantDecision(raw, existingDraft);
  } catch (err) {
    // Parser validation error (e.g. message too short)
    parserExtraction = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  }

  // Detect if parser found a single bare number with no context
  const bareNumberMatch = raw.match(/^(\d+(?:,\d{3})*(?:\.\d+)?)$/);
  if (bareNumberMatch && !parserExtraction.oldPrice && !parserExtraction.newPrice && !parserExtraction.cost) {
    parserExtraction._bareNumber = parseFloat(bareNumberMatch[1].replace(/,/g, ""));
  }

  const currentStage = previousStage === STAGES.OPENING ? STAGES.COLLECTING : previousStage;

  // ──────────────────────────────────────────────────────────────────────
  // Step 3: Handle awaiting_confirmation without LLM
  // ──────────────────────────────────────────────────────────────────────

  if (previousStage === STAGES.AWAITING_CONFIRMATION) {
    const knownProduct = existingDraft?.product || "";

    if (isCleanConfirmation(raw, previousStage, knownProduct)) {
      // User confirmed — set flag, compute stage → advising
      const confirmedDraft = {
        ...existingDraft,
        context: { ...context, userConfirmedSummary: true, stage: STAGES.ADVISING }
      };

      // Build server evidence and call Mistral for advice (2nd call)
      const ruleAdvice = buildAdvice(confirmedDraft);
      confirmedDraft.advice = ruleAdvice;
      const evidence = await buildEvidencePackage(confirmedDraft);

      try {
        let adviceResult;
        if (llmMock) {
          adviceResult = await llmMock("advice");
        } else {
          adviceResult = await callLLMJsonWithRetry(
            buildAdvicePrompt(confirmedDraft, evidence, chatHistory),
            buildStrictRetryPrompt,
            { timeoutMs: 65000, options: { num_predict: 420, temperature: 0.25 } }
          );
        }

        if (adviceResult.data && !adviceResult.retryFailed) {
          const adviceData = adviceResult.data;
          const actionPlan = adviceData.actionPlan || {
            recommendedAction: adviceData.recommendedAction || ruleAdvice.actionPlan?.recommendedAction || ruleAdvice.nextStep || ruleAdvice.recommendation,
            why: adviceData.why || ruleAdvice.actionPlan?.why || ruleAdvice.rationale,
            risk: adviceData.risk || ruleAdvice.actionPlan?.risk || "",
            whatToTest: adviceData.whatToTest || ruleAdvice.actionPlan?.whatToTest || ruleAdvice.nextStep,
            metricToWatch: adviceData.metricToWatch || ruleAdvice.actionPlan?.metricToWatch || "Daily units sold, gross profit, and repeat customers.",
            reviewDate: adviceData.reviewDate || ruleAdvice.actionPlan?.reviewDate || "In 3-5 days.",
            confidence: adviceData.confidence || ruleAdvice.actionPlan?.confidence || "medium",
            missingData: Array.isArray(adviceData.missingData) ? adviceData.missingData : (ruleAdvice.actionPlan?.missingData || [])
          };
          confirmedDraft.advice = {
            ...ruleAdvice,
            recommendation: adviceData.recommendation || ruleAdvice.recommendation,
            rationale: adviceData.rationale || ruleAdvice.rationale,
            aiJustification: adviceData.reply || "",
            nextStep: adviceData.nextStep || ruleAdvice.nextStep,
            actionPlan,
            theoreticalRoot: evidence.theoreticalRoot,
            historicalPrecedent: evidence.historicalPrecedent
          };
          confirmedDraft.context.stage = STAGES.READY_TO_SAVE;

          return {
            reply: adviceData.reply || adviceData.recommendation || ruleAdvice.recommendation,
            draft: confirmedDraft,
            stage: STAGES.READY_TO_SAVE,
            diagnostics: {
              replySource: "mistral_advice",
              retryUsed: adviceResult.retryUsed,
              latencyMs: Date.now() - startedAt
            }
          };
        }
      } catch (err) {
        console.error("[Conversation] Advice LLM call failed:", err.message);
      }

      // Fallback: use rule-based advice
      confirmedDraft.advice = {
        ...ruleAdvice,
        theoreticalRoot: evidence.theoreticalRoot,
        historicalPrecedent: evidence.historicalPrecedent
      };
      confirmedDraft.context.stage = STAGES.READY_TO_SAVE;

      return {
        reply: ruleAdvice.recommendation || "Based on my analysis, here is my recommendation. You can save this decision now.",
        draft: confirmedDraft,
        stage: STAGES.READY_TO_SAVE,
        diagnostics: { replySource: "rule_advice_fallback", latencyMs: Date.now() - startedAt }
      };
    }

    if (isRejection(raw, previousStage)) {
      // User rejected — go back to collecting
      const rejectedDraft = {
        ...existingDraft,
        context: { ...context, userConfirmedSummary: false, stage: STAGES.COLLECTING }
      };
      return collectionReplyWithMistralOrFallback(raw, chatHistory, rejectedDraft, STAGES.COLLECTING, startedAt, "rejection");
    }

    if (isCorrectionWithDetails(raw, previousStage)) {
      // User corrected with details — merge corrections and re-collect
      const correctedDraft = {
        ...existingDraft,
        context: { ...context, userConfirmedSummary: false, stage: STAGES.COLLECTING }
      };
      // The parser extraction already has the corrected data
      // Merge it into the draft so we don't lose it
      const mergedDraft = mergeSafeFacts(parserExtraction, {}, correctedDraft);
      mergedDraft.context.stage = STAGES.COLLECTING;

      if (hasEnoughCoreFacts(mergedDraft)) {
        const summarized = await summarizeWithMistralOrFallback(mergedDraft, chatHistory, startedAt);
        summarized.diagnostics = {
          ...summarized.diagnostics,
          intent: "correction_with_details"
        };
        return summarized;
      }

      return collectionReplyWithMistralOrFallback(raw, chatHistory, mergedDraft, STAGES.COLLECTING, startedAt, "correction_with_details");
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 4: Mistral collection call (1st call)
  // ──────────────────────────────────────────────────────────────────────

  if (currentStage === STAGES.COLLECTING && hasEnoughCoreFacts(parserExtraction)) {
    return summarizeWithMistralOrFallback(parserExtraction, chatHistory, startedAt);
  }

  const uncertainFacts = context.uncertainFacts || [];

  let mistralReply = "";
  let mistralFacts = {};
  let mistralHints = {};
  let replySource = "deterministic";
  let retryUsed = false;

  try {
    let result;
    if (llmMock) {
      result = await llmMock("collection");
    } else {
      const prompt = buildConversationPrompt(raw, chatHistory, existingDraft, currentStage, uncertainFacts);
      result = await callLLMJsonWithRetry(
        prompt,
        buildStrictRetryPrompt,
        { timeoutMs: 65000, options: { num_predict: 250, temperature: 0.2 } }
      );
    }

    if (result.data && !result.retryFailed) {
      mistralReply = result.data.reply || "";
      mistralFacts = result.data.intentGuesses || result.data.facts || {};
      mistralHints = { readyToSummarize: result.data.readyToSummarize === true };
      replySource = "mistral";
      retryUsed = result.retryUsed;
    } else {
      replySource = "fallback";
    }
  } catch (err) {
    console.error("[Conversation] Collection LLM call failed:", err.message);
    replySource = "fallback";
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 5: Merge parser + Mistral facts
  // ──────────────────────────────────────────────────────────────────────

  const mergedDraft = mergeSafeFacts(parserExtraction, mistralFacts, existingDraft || {});

  const lastAskedField = existingDraft?.context?.lastAskedField;
  if (lastAskedField) {
    const isStillMissing = isFieldMissing(lastAskedField, mergedDraft);

    mergedDraft.context = mergedDraft.context || {};
    mergedDraft.context.repairState = { ...(existingDraft.context.repairState || {}) };
    
    if (isStillMissing) {
      mergedDraft.context.repairState[lastAskedField] = (mergedDraft.context.repairState[lastAskedField] || 0) + 1;
    } else {
      mergedDraft.context.repairState[lastAskedField] = 0;
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 6: Compute next stage after merge
  // ──────────────────────────────────────────────────────────────────────

  const nextStage = computeStage(mergedDraft, mistralHints, currentStage, raw);
  mergedDraft.context = { ...(mergedDraft.context || {}), stage: nextStage };

  // ──────────────────────────────────────────────────────────────────────
  // Step 7: If stage transition → 2nd Mistral call
  // ──────────────────────────────────────────────────────────────────────

  // Transition: collecting → summarizing
  if (currentStage === STAGES.COLLECTING && nextStage === STAGES.SUMMARIZING) {
    try {
      let summaryResult;
      if (llmMock) {
        summaryResult = await llmMock("summary");
      } else {
        summaryResult = await callLLMJsonWithRetry(
          buildSummarizePrompt(mergedDraft, chatHistory),
          buildStrictRetryPrompt,
          { timeoutMs: 65000, options: { num_predict: 300, temperature: 0.2 } }
        );
      }

      if (summaryResult.data && !summaryResult.retryFailed) {
        const summaryData = summaryResult.data;
        mergedDraft.context.scenarioSummary = summaryData.scenarioSummary || summaryData.reply || "";
        mergedDraft.context.stage = STAGES.AWAITING_CONFIRMATION;

        return {
          reply: summaryData.reply || summaryData.scenarioSummary || "Here is what I understood. Please confirm or correct.",
          draft: mergedDraft,
          stage: STAGES.AWAITING_CONFIRMATION,
          diagnostics: {
            replySource: "mistral_summary",
            retryUsed: summaryResult.retryUsed,
            secondCallUsed: true,
            latencyMs: Date.now() - startedAt
          }
        };
      }
    } catch (err) {
      console.error("[Conversation] Summary LLM call failed:", err.message);
    }

    // Fallback: build summary from structured data
    const compact = compactDraftForPrompt(mergedDraft);
    const fallbackSummary = `Here is what I have: You ${compact.decisionMode === "planning" ? "are planning to change" : "changed"} the price of ${compact.product}. ${compact.oldPrice ? `Old price: ${compact.oldPrice}.` : ""} ${compact.newPrice ? `New price: ${compact.newPrice}.` : ""} ${compact.cost ? `Cost: ${compact.cost}.` : ""} ${compact.demandChange !== "unknown" ? `Demand went ${compact.demandChange}.` : ""} Is this correct?`;
    mergedDraft.context.scenarioSummary = fallbackSummary;
    mergedDraft.context.stage = STAGES.AWAITING_CONFIRMATION;

    return {
      reply: fallbackSummary,
      draft: mergedDraft,
      stage: STAGES.AWAITING_CONFIRMATION,
      diagnostics: { replySource: "fallback_summary", secondCallUsed: false, latencyMs: Date.now() - startedAt }
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Step 8: Normal collection reply (still collecting)
  // ──────────────────────────────────────────────────────────────────────

  // Loop detection
  const lastReply = context.lastAssistantReply || "";
  if (detectLoopRepeat(lastReply, mistralReply)) {
    const loopReply = buildLoopBreakReply(mergedDraft);
    mergedDraft.context.lastAssistantReply = loopReply;
    return {
      reply: loopReply,
      draft: mergedDraft,
      stage: nextStage,
      diagnostics: { replySource: "loop_break", latencyMs: Date.now() - startedAt }
    };
  }

  // Use Mistral reply or fallback
  const finalReply = (replySource === "mistral" && mistralReply.trim())
    ? mistralReply.trim()
    : buildFallbackReply(mergedDraft, nextStage);

  mergedDraft.context.lastAssistantReply = finalReply;

  return {
    reply: finalReply,
    draft: mergedDraft,
    stage: nextStage,
    diagnostics: {
      replySource,
      retryUsed,
      latencyMs: Date.now() - startedAt
    }
  };
}
