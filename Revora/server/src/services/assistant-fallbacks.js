/**
 * Assistant Fallbacks
 * 
 * Deterministic fallback replies used when:
 * - LLM is unavailable or returns invalid JSON after retry
 * - Greeting/small-talk/out-of-scope detected (no LLM call needed)
 * - Loop detected (Mistral is repeating itself)
 * 
 * These should feel natural enough that the user doesn't notice
 * they are not coming from the LLM.
 */

// ─── Opening ────────────────────────────────────────────────────────────────

export function getOpeningMessage() {
  return "Hey, good to see you. Tell me one price change you made recently, and I will help you think through whether it was a good move.";
}

// ─── Greeting / Small Talk / Out-of-Scope ───────────────────────────────────

export function buildGreetingReply() {
  return "Hey, good to see you. Tell me one price change you made recently, and I will help you think through whether it was a good move.";
}

export function buildSmallTalkReply() {
  return "I am here and ready to help. Tell me a recent price change when you want a second opinion on it.";
}

export function buildOutOfScopeReply() {
  return "I may be less useful on that than on pricing. Bring me a product price change, and I will help you reason through the move.";
}

export function buildCorrectionReply(hasDraft) {
  return hasDraft
    ? "Got it. Tell me what I got wrong, and I will update the draft instead of saving it."
    : "Got it. Send me the corrected pricing decision, and I will rebuild it carefully.";
}

// ─── LLM Failure Fallbacks ──────────────────────────────────────────────────

/**
 * Called when callLLMJsonWithRetry fails both attempts.
 * Returns a safe reply that keeps the conversation going.
 */
export function buildFallbackReply(draft, stage) {
  if (!draft || !draft.product || draft.product === "Unknown product") {
    return "I'm having a bit of trouble processing that. Could you tell me which product this is about?";
  }

  if (stage === "collecting") {
    const name = draft.product;
    if (draft.oldPrice === null && draft.newPrice === null) {
      return `I've got ${name}. Did you change its price recently? Tell me the old and new price.`;
    }
    if (draft.demandChange === "unknown") {
      return `Got the price for ${name}. What happened to sales or customer visits after the change?`;
    }
    if (draft.cost === null || draft.cost === undefined) {
      return `Almost there. What is your cost price for ${name}?`;
    }
    if (!draft.goal) {
      return `What is your goal here: protect profit, grow sales, clear stock, or match competition?`;
    }
  }

  if (stage === "summarizing" || stage === "awaiting_confirmation") {
    return "Let me try summarizing what I know. Could you check if the details look right and confirm?";
  }

  if (stage === "advising") {
    return "I'm putting together my recommendation. Give me one moment.";
  }

  return "Could you rephrase that? I want to make sure I understand your pricing situation correctly.";
}

// ─── Loop Break ─────────────────────────────────────────────────────────────

/**
 * When loop detection fires, use a different question to break out.
 */
export function buildLoopBreakReply(draft) {
  const name = draft?.product || "your product";
  return `Let me approach this differently. Can you tell me in one sentence what happened: what product, what price changed, and what happened to sales?`;
}
