/**
 * Assistant Prompts
 * 
 * All prompt construction for Mistral conversation turns.
 * Owns the three prompt types:
 *   1. Collection prompt  — normal turn, asks follow-up questions
 *   2. Summarize prompt   — generates human-readable scenario summary
 *   3. Advice prompt      — writes final pricing advice using server-provided evidence
 */

// ─── Compact Helpers ────────────────────────────────────────────────────────

/**
 * Strips large/noisy fields from draft before embedding in prompt.
 * Keeps the prompt within Mistral 7B's token budget.
 */
export function compactDraftForPrompt(draft) {
  if (!draft) return {};
  return {
    product: draft.product || "",
    decisionMode: draft.decisionMode || "unknown",
    oldPrice: draft.oldPrice ?? null,
    newPrice: draft.newPrice ?? null,
    currentPrice: draft.currentPrice ?? null,
    proposedPrice: draft.proposedPrice ?? null,
    cost: draft.cost ?? null,
    competitorPrice: draft.competitorPrice ?? null,
    goal: draft.goal || "",
    priceChangeType: draft.priceChangeType || "unknown",
    demandChange: draft.demandChange || "unknown",
    stockContext: draft.stockContext || "unknown",
    competitorContext: draft.competitorContext || "unknown"
  };
}

function formatChatHistory(chatHistory) {
  if (!chatHistory || !chatHistory.length) return "(no prior turns)";
  return chatHistory
    .map(turn => `[${turn.role}]: ${String(turn.text || "").slice(0, 120)}`)
    .join("\n");
}

function formatUncertainFacts(uncertainFacts) {
  if (!uncertainFacts || !uncertainFacts.length) return "none";
  return JSON.stringify(uncertainFacts);
}

function formatMissingFields(draft) {
  const missing = [];
  if (!draft.product || draft.product === "Unknown product") missing.push("product name");
  if (draft.oldPrice === null && draft.newPrice === null && draft.currentPrice === null) missing.push("price info");
  if (draft.decisionMode !== "planning" && draft.demandChange === "unknown") missing.push("demand change");
  if (draft.cost === null || draft.cost === undefined) missing.push("cost (optional but improves confidence)");
  if (!draft.goal) missing.push("goal (optional if other business signals exist)");
  return missing.length ? JSON.stringify(missing) : "none";
}

// ─── Collection Prompt (1st call) ───────────────────────────────────────────

/**
 * Builds the main conversation prompt for the collection stage.
 * Mistral returns: { reply, intent, facts, readyToSummarize }
 */
export function buildConversationPrompt(message, chatHistory, draft, stage, uncertainFacts) {
  const compact = compactDraftForPrompt(draft);
  const history = formatChatHistory(chatHistory);
  const uncertain = formatUncertainFacts(uncertainFacts);
  const missing = formatMissingFields(compact);

  return `You are Revora, a pricing mentor for small shopkeepers.

STAGE: ${stage}
RECENT CHAT (last 6 turns):
${history}

USER MESSAGE: ${JSON.stringify(message)}

KNOWN FACTS: ${JSON.stringify(compact)}
UNCERTAIN: ${uncertain}
MISSING: ${missing}

RULES:
- Ask one natural follow-up question at a time.
- "thinking", "planning", "changed" = user state, NOT product names.
- Bare numbers with no label → remember as uncertain, ask what they mean.
- "bought for", "paid", "purchase price", "cost" mean product cost, not selling price.
- "from X to Y" means old price X, new price Y.
- Do not conclude until there is enough context for a useful next action.
- Cost is useful but not always required; if missing, mention that it limits confidence.
- If readyToSummarize, set it to true when product + price move/planned price + a business signal are known.
- Keep replies to two short sentences, natural and business-focused.
- Return valid JSON only, no markdown or extra text.

JSON shape:
{"reply":"","intent":"provide_info","intentGuesses":{"product":null,"decisionMode":"unknown","oldPrice":null,"newPrice":null,"currentPrice":null,"proposedPrice":null,"cost":null,"demandChange":"unknown","goal":""},"readyToSummarize":false}`;
}

// ─── Summarize Prompt (2nd call on collecting → summarizing) ─────────────────

/**
 * Builds the prompt for scenario summary generation.
 * Mistral returns: { reply, scenarioSummary, facts }
 */
export function buildSummarizePrompt(draft, chatHistory) {
  const compact = compactDraftForPrompt(draft);
  const history = formatChatHistory(chatHistory);

  return `You are Revora, a pricing mentor for small shopkeepers.

TASK: Summarize the user's pricing scenario and ask them to confirm or correct it.

RECENT CHAT:
${history}

KNOWN FACTS: ${JSON.stringify(compact)}

RULES:
- State clearly what you understood about their pricing situation.
- Include: product, prices, demand/customer/profit signal, and cost/goal if known.
- If cost is missing, say that exact margin confidence is limited but do not block confirmation.
- End by asking "Is this correct, or did I get something wrong?"
- Keep the summary to 3-4 short sentences.
- Return valid JSON only.

JSON shape:
{"reply":"","scenarioSummary":"","facts":{}}`;
}

// ─── Advice Prompt (2nd call on awaiting_confirmation → advising) ────────────

/**
 * Builds the prompt for final pricing advice.
 * Server passes evidence (rule-based advice + KB data) as input.
 * Mistral writes the human-readable advice using that evidence.
 * Mistral returns: { reply, recommendation, rationale, nextStep, actionPlan }
 */
export function buildAdvicePrompt(draft, evidence, chatHistory) {
  const compact = compactDraftForPrompt(draft);
  const history = formatChatHistory(chatHistory);
  const signals = draft?.context?.businessSignals || {};
  const playbook = draft?.context?.selectedPlaybook || null;
  const numbers = playbook?.numbers || {};
  const locationContext = draft?.context?.locationContext || numbers.locationContext || "";

  const numbersBlock = `
COMPUTED NUMBERS (use these exactly, do not recalculate):
- Current price: Rs ${numbers.currentPrice ?? compact.newPrice ?? compact.currentPrice ?? "unknown"}
- Old price: Rs ${numbers.oldPrice ?? compact.oldPrice ?? "unknown"}
- Cost per unit: Rs ${numbers.cost ?? compact.cost ?? "unknown"}
- Competitor price: Rs ${numbers.competitorPrice ?? compact.competitorPrice ?? "unknown"}
- Price gap vs competitor: Rs ${numbers.competitorGap ?? signals.competitorGap ?? "unknown"}
- Margin at current price: ${numbers.marginAtCurrentPrice ?? signals.marginAtCurrentPrice ?? "unknown"}%
- Margin at competitor price: ${numbers.marginAtCompetitorPrice ?? signals.marginAtCompetitorPrice ?? "unknown"}%
- Price change: ${numbers.priceChangePercent ?? signals.priceChangePercent ?? "unknown"}%
- Customer count: ${(numbers.customerCountDown ?? signals.customerCountDown) ? "DOWN" : "stable/up/unknown"}
- Sales value: ${(numbers.salesValueUp ?? signals.salesValueUp) ? "UP" : "down/flat/unknown"}
${locationContext ? `- Location context: ${locationContext}` : ""}
  `.trim();

  const playbookBlock = playbook ? `
SELECTED PLAYBOOK: ${playbook.playbook}
PLAYBOOK PRIORITY: ${playbook.priority}
ADVISOR INSTRUCTION: ${playbook.instruction}
You MUST follow this playbook. Do not override it with generic pricing advice.
  `.trim() : "";

  const evidenceBlock = evidence ? `
SERVER EVIDENCE (use this as your foundation):
Rule-based recommendation: ${evidence.recommendation || "none"}
Rationale: ${evidence.rationale || "none"}
Severity: ${evidence.severity || "unknown"}
Action plan: ${JSON.stringify(evidence.actionPlan || {})}
${evidence.theoreticalRoot ? `Economic principle: ${evidence.theoreticalRoot.economicPrinciple || ""}
Explanation: ${evidence.theoreticalRoot.explanation || ""}` : ""}
${evidence.historicalPrecedent ? `Historical case: ${evidence.historicalPrecedent.market || ""} (${evidence.historicalPrecedent.year || ""}): ${evidence.historicalPrecedent.what_happened || evidence.historicalPrecedent.summary || ""}` : ""}
Next step: ${evidence.nextStep || "none"}` : "";

  return `You are Revora, a pricing mentor for small shopkeepers.

TASK: Give final pricing advice for the confirmed scenario.

RECENT CHAT:
${history}

CONFIRMED FACTS: ${JSON.stringify(compact)}
${numbersBlock}
${playbookBlock}
${evidenceBlock}

RULES:
- Act as an action planner, not a generic chatbot.
- Write practical, actionable advice in 3-5 sentences.
- Ground your advice in the server evidence above.
- Be specific: mention actual prices, margins, or percentages when possible.
- Use empathetic, professional tone. Currency: INR/Rs.
- Always produce a tactical test plan with action, risk, metric, and review timing.
- If the selected playbook is competitor_entry_customer_loss, recommend immediate defensive price match today. Frame it as act-then-measure, not test-then-decide.
- If location is provided, use it only as soft market-density context. Do not make specific claims about that location's consumer behavior unless the user's own data supports it.
- If cost is missing, include "cost" in missingData and lower confidence.
- Return valid JSON only.

JSON shape:
{"reply":"","recommendation":"","rationale":"","nextStep":"","actionPlan":{"recommendedAction":"","why":"","risk":"","whatToTest":"","metricToWatch":"","reviewDate":"","confidence":"low|medium|high","missingData":[]}}`;
}

// ─── Strict Retry Prompt ────────────────────────────────────────────────────

/**
 * Wraps an existing prompt with a stricter instruction for JSON-only output.
 * Used when the first call returned invalid JSON.
 */
export function buildStrictRetryPrompt(originalPrompt) {
  return `${originalPrompt}

CRITICAL: Your previous response was not valid JSON. Return ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON. Start with { and end with }.`;
}
