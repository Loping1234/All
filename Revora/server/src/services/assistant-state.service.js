/**
 * Assistant State Service
 * 
 * Owns all deterministic state logic for the Mistral-led conversation:
 * - Stage computation and validation
 * - Confirmation vs correction detection
 * - Safe fact merging (parser wins on labeled numbers, Mistral wins on intent/product)
 * - Loop detection
 * 
 * This file has ZERO LLM dependencies. Every function is fully testable without Ollama.
 */

// ─── Valid Stages ────────────────────────────────────────────────────────────

export const STAGES = Object.freeze({
  OPENING: "opening",
  COLLECTING: "collecting",
  SUMMARIZING: "summarizing",
  AWAITING_CONFIRMATION: "awaiting_confirmation",
  ADVISING: "advising",
  READY_TO_SAVE: "ready_to_save"
});

const VALID_STAGES = new Set(Object.values(STAGES));

// ─── Confirmation Detection ─────────────────────────────────────────────────

const AFFIRMATIVE_PHRASES = [
  "yes", "correct", "that's right", "thats right", "done", "nothing else",
  "continue", "looks good", "perfect", "yep", "yeah", "sure",
  "yes give advice", "yes continue", "go ahead"
];

const CORRECTION_WORDS = [
  "no", "wrong", "wait", "not correct", "incorrect", "but",
  "actually", "change", "update"
];

const PRICING_KEYWORDS = /\b(price|old|new|current|cost|bought|purchased|paid|sell|selling|sales|demand|stock|competitor|profit|margin|revenue|discount|increase|decrease|raised|reduced|dropped)\b/i;

/**
 * Returns true only for clean affirmative messages (no new numbers,
 * no correction words, no changed facts) during awaiting_confirmation.
 * 
 * Mentioning the ALREADY KNOWN product name is allowed.
 * e.g. "yes milk is correct" → true
 * e.g. "yes but cost is 50"  → false (has number)
 */
export function isCleanConfirmation(message, stage, knownProduct = "") {
  if (stage !== STAGES.AWAITING_CONFIRMATION) return false;

  const text = String(message || "").toLowerCase().trim();
  if (!text) return false;

  // Must contain at least one affirmative word
  const isAffirmative = AFFIRMATIVE_PHRASES.some(phrase => text.includes(phrase));
  if (!isAffirmative) return false;

  // Must not contain correction words
  const hasCorrection = CORRECTION_WORDS.some(word => text.includes(word));
  if (hasCorrection) return false;

  // Must not contain new numbers (pricing signals)
  if (/\d+/.test(text)) return false;

  // Strip known product name before checking for pricing keywords
  // so "yes milk is correct" doesn't trigger on "milk"
  const textWithoutProduct = knownProduct
    ? text.replace(new RegExp(`\\b${escapeRegex(knownProduct.toLowerCase())}\\b`, "g"), "")
    : text;

  // Must not contain pricing-domain keywords (beyond the product name)
  if (PRICING_KEYWORDS.test(textWithoutProduct)) return false;

  return true;
}

/**
 * Returns true when the user says something affirmative but also includes
 * new pricing data — meaning they want to correct a detail before confirming.
 * e.g. "yes but cost is 50"         → true
 * e.g. "correct but demand went up" → true
 * e.g. "yes"                        → false
 */
export function isCorrectionWithDetails(message, stage) {
  if (stage !== STAGES.AWAITING_CONFIRMATION) return false;

  const text = String(message || "").toLowerCase().trim();
  if (!text) return false;

  const isAffirmative = AFFIRMATIVE_PHRASES.some(phrase => text.includes(phrase));
  const hasNumbers = /\d+/.test(text);
  const hasCorrectionWord = CORRECTION_WORDS.some(word => text.includes(word));
  const hasPricingKeyword = PRICING_KEYWORDS.test(text);
  const hasPriceMovePattern = /\bfrom\s*\d+(?:,\d{3})*(?:\.\d+)?\s*(?:to|->|-)\s*\d+(?:,\d{3})*(?:\.\d+)?/i.test(text);

  // "yes but cost is 50" → affirmative + (numbers OR correction + pricing keyword)
  return (isAffirmative || hasCorrectionWord) && (hasPricingKeyword || hasPriceMovePattern) && (hasNumbers || hasCorrectionWord);
}

/**
 * Returns true when the user outright rejects the summary.
 * e.g. "no"      → true
 * e.g. "wrong"   → true
 * e.g. "wait"    → true
 * e.g. "yes"     → false
 */
export function isRejection(message, stage) {
  if (stage !== STAGES.AWAITING_CONFIRMATION) return false;

  const text = String(message || "").toLowerCase().trim();
  if (!text) return false;

  // Check for outright rejection without any affirmative
  const rejectionPhrases = ["no", "nah", "nope", "wrong", "incorrect", "not correct", "not right", "wait", "that's wrong", "thats wrong"];
  const startsWithRejection = rejectionPhrases.some(phrase => text.startsWith(phrase));
  // Must not also be affirmative — but use phrase-start matching to avoid
  // "not correct" matching "correct" in affirmative list
  const isAffirmative = AFFIRMATIVE_PHRASES.some(phrase => {
    // Only match affirmative if it appears at start, not inside a rejection phrase
    const idx = text.indexOf(phrase);
    if (idx < 0) return false;
    // If the affirmative word appears after a rejection word, it's part of the rejection
    // e.g. "not correct" — "correct" appears at index 4, after "not" at index 0
    return idx === 0;
  });

  if (PRICING_KEYWORDS.test(text) && /\d+/.test(text)) return false;

  return startsWithRejection && !isAffirmative;
}

// ─── Stage Computation ──────────────────────────────────────────────────────

/**
 * Determines whether the draft has enough core facts to potentially
 * move from collecting → summarizing.
 * 
 * Minimum: product + at least one price + one context signal (demand/cost/goal)
 */
export function hasEnoughCoreFacts(draft) {
  if (!draft) return false;

  const hasProduct = !!(draft.product && draft.product !== "Unknown product");
  const mode = draft.decisionMode || draft.context?.decisionMode;
  const signals = draft.context?.businessSignals || {};

  if (mode === "planning") {
    return !!(
      hasProduct &&
      draft.currentPrice !== null &&
      draft.currentPrice !== undefined &&
      draft.proposedPrice !== null &&
      draft.proposedPrice !== undefined &&
      (
        (draft.cost !== null && draft.cost !== undefined) ||
        (draft.goal && String(draft.goal).trim().length > 0) ||
        (draft.competitorPrice !== null && draft.competitorPrice !== undefined) ||
        (draft.stockContext && draft.stockContext !== "unknown") ||
        (draft.competitorContext && draft.competitorContext !== "unknown") ||
        signals.profitPressure ||
        signals.profitImproved ||
        signals.footfallRiskHint ||
        signals.footfallRisk ||
        signals.customerLoss ||
        signals.customerCountDown ||
        signals.competitorCheaper
      )
    );
  }

  const hasPrice = (
    (draft.oldPrice !== null && draft.oldPrice !== undefined) ||
    (draft.newPrice !== null && draft.newPrice !== undefined) ||
    (draft.currentPrice !== null && draft.currentPrice !== undefined) ||
    (draft.proposedPrice !== null && draft.proposedPrice !== undefined)
  );

  const hasPastPriceMove = draft.oldPrice !== null && draft.oldPrice !== undefined && draft.newPrice !== null && draft.newPrice !== undefined;
  const hasOutcomeSignal = (
    (draft.demandChange && draft.demandChange !== "unknown") ||
    signals.profitPressure ||
    signals.profitImproved ||
    signals.customerLoss ||
    signals.customerCountDown ||
    signals.salesValueUp ||
    signals.salesValueDown
  );

  return !!(hasProduct && hasPrice && (hasPastPriceMove ? hasOutcomeSignal : false));
}

/**
 * Computes the next stage based on current state, Mistral hints, and user message.
 * 
 * The server is the sole authority on stage transitions.
 * Mistral can PROPOSE readyToSummarize, but the server VALIDATES.
 */
export function computeStage(draft, mistralHints, previousStage, message) {
  const prev = VALID_STAGES.has(previousStage) ? previousStage : STAGES.OPENING;
  let next = prev;

  switch (prev) {
    case STAGES.OPENING:
      // Any user message moves from opening to collecting
      next = STAGES.COLLECTING;
      break;

    case STAGES.COLLECTING:
      // Move to summarizing only if we have enough facts AND Mistral agrees
      if (hasEnoughCoreFacts(draft) && mistralHints?.readyToSummarize) {
        next = STAGES.SUMMARIZING;
      }
      break;

    case STAGES.SUMMARIZING:
      // After generating a summary, automatically await confirmation
      next = STAGES.AWAITING_CONFIRMATION;
      break;

    case STAGES.AWAITING_CONFIRMATION: {
      const knownProduct = draft?.product || "";
      if (isCleanConfirmation(message, prev, knownProduct)) {
        next = STAGES.ADVISING;
      } else if (isCorrectionWithDetails(message, prev) || isRejection(message, prev)) {
        // Go back to summarizing — facts will be updated before re-summarizing
        next = STAGES.SUMMARIZING;
      }
      // If neither, stay in awaiting_confirmation (user said something ambiguous)
      break;
    }

    case STAGES.ADVISING:
      // After advice is generated, ready to save
      next = STAGES.READY_TO_SAVE;
      break;

    case STAGES.READY_TO_SAVE:
      // If user types instead of clicking save, they probably want to correct
      if (message && String(message).trim()) {
        next = STAGES.SUMMARIZING;
      }
      break;
  }

  return validateStageTransition(prev, next, draft);
}

/**
 * Guardrail: prevents illegal stage jumps.
 * 
 * - Cannot skip collecting → advising (must go through summarizing)
 * - Cannot enter advising without userConfirmedSummary
 */
export function validateStageTransition(from, to, draft) {
  // Cannot skip from collecting directly to advising
  if (from === STAGES.COLLECTING && to === STAGES.ADVISING) {
    return STAGES.SUMMARIZING;
  }

  // Cannot enter advising without user having confirmed the summary
  if (to === STAGES.ADVISING && !draft?.context?.userConfirmedSummary) {
    return STAGES.SUMMARIZING;
  }

  // Cannot enter ready_to_save without advice existing
  if (to === STAGES.READY_TO_SAVE) {
    const hasAdvice = draft?.advice?.recommendation && draft.advice.recommendation.trim();
    if (!hasAdvice) {
      return STAGES.ADVISING;
    }
  }

  return to;
}

// ─── Safe Fact Merging ──────────────────────────────────────────────────────

/**
 * Words that should NEVER be treated as product names.
 * These are user states, filler, or conversational responses.
 */
const NON_PRODUCT_WORDS = new Set([
  "thinking", "planning", "changed", "per liter", "per litre",
  "per kg", "per unit", "per piece", "per box", "per bottle",
  "liter", "litre", "kg", "unit", "piece", "box", "bottle",
  "yes", "no", "maybe", "ok", "okay", "sure", "done",
  "hi", "hello", "hey", "thanks", "thank you"
]);

/**
 * Merges parser extraction and Mistral extraction into the existing draft,
 * following strict ownership rules:
 * 
 * - Parser wins on LABELED/CONTEXTUAL numbers (cost is 50, from 100 to 120)
 * - Mistral wins on product name, intent, decisionMode, goal
 * - Unlabeled bare numbers go to uncertainFacts
 * - Confirmed facts cannot be silently overwritten
 */
export function mergeSafeFacts(parserExtraction, mistralFacts, existingDraft) {
  const draft = existingDraft ? { ...existingDraft } : {};
  const context = { ...(draft.context || {}) };
  const uncertainFacts = [...(context.uncertainFacts || [])];
  const confirmedSummary = context.userConfirmedSummary === true;

  // ── Parser wins on labeled numbers ──
  // Only apply parser numbers if they have clear context (not bare single numbers)
  if (parserExtraction.oldPrice !== null && parserExtraction.oldPrice !== undefined) {
    if (!confirmedSummary || draft.oldPrice === null) {
      draft.oldPrice = parserExtraction.oldPrice;
    } else if (parserExtraction.oldPrice !== draft.oldPrice) {
      uncertainFacts.push({ value: parserExtraction.oldPrice, field: "oldPrice", note: "contradicts confirmed" });
    }
  }

  if (parserExtraction.newPrice !== null && parserExtraction.newPrice !== undefined) {
    if (!confirmedSummary || draft.newPrice === null) {
      draft.newPrice = parserExtraction.newPrice;
    } else if (parserExtraction.newPrice !== draft.newPrice) {
      uncertainFacts.push({ value: parserExtraction.newPrice, field: "newPrice", note: "contradicts confirmed" });
    }
  }

  if (parserExtraction.cost !== null && parserExtraction.cost !== undefined) {
    if (!confirmedSummary || draft.cost === null || draft.cost === undefined) {
      draft.cost = parserExtraction.cost;
    } else if (parserExtraction.cost !== draft.cost) {
      uncertainFacts.push({ value: parserExtraction.cost, field: "cost", note: "contradicts confirmed" });
    }
  }

  if (parserExtraction.currentPrice !== null && parserExtraction.currentPrice !== undefined) {
    if (!confirmedSummary || draft.currentPrice === null || draft.currentPrice === undefined) {
      draft.currentPrice = parserExtraction.currentPrice;
    } else if (parserExtraction.currentPrice !== draft.currentPrice) {
      uncertainFacts.push({ value: parserExtraction.currentPrice, field: "currentPrice", note: "contradicts confirmed" });
    }
  }

  if (parserExtraction.proposedPrice !== null && parserExtraction.proposedPrice !== undefined) {
    if (!confirmedSummary || draft.proposedPrice === null || draft.proposedPrice === undefined) {
      draft.proposedPrice = parserExtraction.proposedPrice;
    } else if (parserExtraction.proposedPrice !== draft.proposedPrice) {
      uncertainFacts.push({ value: parserExtraction.proposedPrice, field: "proposedPrice", note: "contradicts confirmed" });
    }
  }

  if (parserExtraction.competitorPrice !== null && parserExtraction.competitorPrice !== undefined) {
    if (!confirmedSummary || draft.competitorPrice === null) {
      draft.competitorPrice = parserExtraction.competitorPrice;
    }
  }

  // ── Handle bare/unlabeled numbers from parser ──
  // If parser found a single number but couldn't assign it to any field
  if (parserExtraction._bareNumber !== null && parserExtraction._bareNumber !== undefined) {
    uncertainFacts.push({ value: parserExtraction._bareNumber, note: "no label or context" });
  }

  if (parserExtraction.context?.unit) {
    context.unit = parserExtraction.context.unit;
  }

  if (parserExtraction.context?.locationContext) {
    context.locationContext = parserExtraction.context.locationContext;
  }

  if (parserExtraction.context?.businessSignals) {
    context.businessSignals = {
      ...(context.businessSignals || {}),
      ...parserExtraction.context.businessSignals
    };
  }

  if (parserExtraction.context?.selectedPlaybook) {
    context.selectedPlaybook = parserExtraction.context.selectedPlaybook;
  }

  if (parserExtraction.context?.uncertainFacts?.length) {
    for (const fact of parserExtraction.context.uncertainFacts) {
      uncertainFacts.push(fact);
    }
  }

  if (parserExtraction.decisionMode && parserExtraction.decisionMode !== "unknown") {
    draft.decisionMode = parserExtraction.decisionMode;
    context.decisionMode = parserExtraction.decisionMode;
  }

  // ── Mistral wins on product / intent / decisionMode / goal ──
  if (parserExtraction.product && parserExtraction.context?.turnKind === "product_only") {
    const parsedProduct = String(parserExtraction.product).trim().toLowerCase();
    if (!NON_PRODUCT_WORDS.has(parsedProduct) && parsedProduct !== "unknown product" && parsedProduct.length > 1) {
      if (!confirmedSummary || !draft.product || draft.product === "Unknown product") {
        draft.product = parserExtraction.product;
      }
    }
  }

  if (mistralFacts.product) {
    const proposedProduct = String(mistralFacts.product).trim().toLowerCase();
    if (!NON_PRODUCT_WORDS.has(proposedProduct) && proposedProduct.length > 1) {
      if (!confirmedSummary || !draft.product || draft.product === "Unknown product") {
        draft.product = mistralFacts.product;
      }
    }
  }

  if (mistralFacts.decisionMode) {
    draft.decisionMode = mistralFacts.decisionMode;
    context.decisionMode = mistralFacts.decisionMode;
  }

  if (mistralFacts.goal && mistralFacts.goal.trim()) {
    if (!confirmedSummary || !draft.goal) {
      draft.goal = mistralFacts.goal;
    }
  }

  // ── Mistral can fill number gaps if parser didn't extract them ──
  // (Mistral may have understood context the parser missed)
  const isNull = (v) => v === null || v === undefined;
  if (isNull(draft.oldPrice) && !isNull(mistralFacts.oldPrice)) {
    draft.oldPrice = mistralFacts.oldPrice;
  }
  if (isNull(draft.newPrice) && !isNull(mistralFacts.newPrice)) {
    draft.newPrice = mistralFacts.newPrice;
  }
  if (isNull(draft.cost) && !isNull(mistralFacts.cost)) {
    draft.cost = mistralFacts.cost;
  }
  if (isNull(draft.currentPrice) && !isNull(mistralFacts.currentPrice)) {
    draft.currentPrice = mistralFacts.currentPrice;
  }
  if (isNull(draft.proposedPrice) && !isNull(mistralFacts.proposedPrice)) {
    draft.proposedPrice = mistralFacts.proposedPrice;
  }

  // ── Mistral wins on demand change if it's more specific ──
  if (mistralFacts.demandChange && mistralFacts.demandChange !== "unknown") {
    if (!confirmedSummary || !draft.demandChange || draft.demandChange === "unknown") {
      draft.demandChange = mistralFacts.demandChange;
    }
  }

  // ── Write back context ──
  context.uncertainFacts = uncertainFacts;
  draft.context = context;

  return draft;
}

// ─── Loop Detection ─────────────────────────────────────────────────────────

/**
 * Returns true if the new reply is substantially the same as the last reply,
 * indicating the conversation is looping with no progress.
 */
export function detectLoopRepeat(lastReply, newReply) {
  if (!lastReply || !newReply) return false;

  const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const lastNorm = normalize(lastReply);
  const newNorm = normalize(newReply);

  // Exact match after normalization
  if (lastNorm === newNorm && lastNorm.length > 10) return true;

  // High similarity (first 60 chars match) — catches minor wording variations
  if (lastNorm.length > 30 && newNorm.length > 30) {
    const lastHead = lastNorm.slice(0, 60);
    const newHead = newNorm.slice(0, 60);
    if (lastHead === newHead) return true;
  }

  return false;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
