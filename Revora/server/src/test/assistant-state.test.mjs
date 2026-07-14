import assert from "node:assert/strict";
import {
  STAGES,
  isCleanConfirmation,
  isCorrectionWithDetails,
  isRejection,
  hasEnoughCoreFacts,
  computeStage,
  validateStageTransition,
  mergeSafeFacts,
  detectLoopRepeat
} from "../services/assistant-state.service.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// isCleanConfirmation
// ═══════════════════════════════════════════════════════════════════════════

test("clean confirm: 'yes' during awaiting_confirmation", () => {
  assert.equal(isCleanConfirmation("yes", STAGES.AWAITING_CONFIRMATION), true);
});

test("clean confirm: 'correct' during awaiting_confirmation", () => {
  assert.equal(isCleanConfirmation("correct", STAGES.AWAITING_CONFIRMATION), true);
});

test("clean confirm: 'looks good' during awaiting_confirmation", () => {
  assert.equal(isCleanConfirmation("looks good", STAGES.AWAITING_CONFIRMATION), true);
});

test("clean confirm: 'yes milk is correct' allows known product name", () => {
  assert.equal(isCleanConfirmation("yes milk is correct", STAGES.AWAITING_CONFIRMATION, "milk"), true);
});

test("clean confirm: 'yes clothes, that's right' allows known product name", () => {
  assert.equal(isCleanConfirmation("yes clothes, that's right", STAGES.AWAITING_CONFIRMATION, "clothes"), true);
});

test("clean confirm: rejects 'yes' during collecting stage", () => {
  assert.equal(isCleanConfirmation("yes", STAGES.COLLECTING), false);
});

test("clean confirm: rejects 'yes but cost is 50' (has numbers)", () => {
  assert.equal(isCleanConfirmation("yes but cost is 50", STAGES.AWAITING_CONFIRMATION), false);
});

test("clean confirm: rejects 'yes from 100 to 120' (has numbers)", () => {
  assert.equal(isCleanConfirmation("yes from 100 to 120", STAGES.AWAITING_CONFIRMATION), false);
});

test("clean confirm: rejects 'no' (not affirmative)", () => {
  assert.equal(isCleanConfirmation("no", STAGES.AWAITING_CONFIRMATION), false);
});

test("clean confirm: rejects 'yes but demand went up' (has 'but')", () => {
  assert.equal(isCleanConfirmation("yes but demand went up", STAGES.AWAITING_CONFIRMATION), false);
});

test("clean confirm: rejects empty message", () => {
  assert.equal(isCleanConfirmation("", STAGES.AWAITING_CONFIRMATION), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// isCorrectionWithDetails
// ═══════════════════════════════════════════════════════════════════════════

test("correction: 'yes but cost is 50' is correction with details", () => {
  assert.equal(isCorrectionWithDetails("yes but cost is 50", STAGES.AWAITING_CONFIRMATION), true);
});

test("correction: 'correct but demand went up not down' is correction with details", () => {
  assert.equal(isCorrectionWithDetails("correct but demand went up not down", STAGES.AWAITING_CONFIRMATION), true);
});

test("correction: 'yes from 100 to 120' is correction with details", () => {
  assert.equal(isCorrectionWithDetails("yes from 100 to 120", STAGES.AWAITING_CONFIRMATION), true);
});

test("correction: 'yes' alone is NOT correction with details", () => {
  assert.equal(isCorrectionWithDetails("yes", STAGES.AWAITING_CONFIRMATION), false);
});

test("correction: rejects during collecting stage", () => {
  assert.equal(isCorrectionWithDetails("yes but cost is 50", STAGES.COLLECTING), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// isRejection
// ═══════════════════════════════════════════════════════════════════════════

test("rejection: 'no' is rejection", () => {
  assert.equal(isRejection("no", STAGES.AWAITING_CONFIRMATION), true);
});

test("rejection: 'wrong' is rejection", () => {
  assert.equal(isRejection("wrong", STAGES.AWAITING_CONFIRMATION), true);
});

test("rejection: 'wait' is rejection", () => {
  assert.equal(isRejection("wait", STAGES.AWAITING_CONFIRMATION), true);
});

test("rejection: 'not correct' is rejection", () => {
  assert.equal(isRejection("not correct", STAGES.AWAITING_CONFIRMATION), true);
});

test("rejection: 'yes' is NOT rejection", () => {
  assert.equal(isRejection("yes", STAGES.AWAITING_CONFIRMATION), false);
});

test("rejection: rejects during collecting stage", () => {
  assert.equal(isRejection("no", STAGES.COLLECTING), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// hasEnoughCoreFacts
// ═══════════════════════════════════════════════════════════════════════════

test("core facts: empty draft is not enough", () => {
  assert.equal(hasEnoughCoreFacts({}), false);
});

test("core facts: product only is not enough", () => {
  assert.equal(hasEnoughCoreFacts({ product: "milk" }), false);
});

test("core facts: product + price is not enough (no context signal)", () => {
  assert.equal(hasEnoughCoreFacts({ product: "milk", oldPrice: 100 }), false);
});

test("core facts: product + price + demand is enough", () => {
  assert.equal(hasEnoughCoreFacts({
    product: "milk", oldPrice: 100, newPrice: 120, demandChange: "down"
  }), true);
});

test("core facts: past change needs an outcome signal, cost alone is not enough", () => {
  assert.equal(hasEnoughCoreFacts({
    product: "milk", newPrice: 120, cost: 80
  }), false);
});

test("core facts: planning with current proposed price and goal is enough", () => {
  assert.equal(hasEnoughCoreFacts({
    product: "milk", currentPrice: 100, proposedPrice: 120, goal: "protect profit", decisionMode: "planning"
  }), true);
});

test("core facts: 'Unknown product' does not count", () => {
  assert.equal(hasEnoughCoreFacts({
    product: "Unknown product", oldPrice: 100, demandChange: "down"
  }), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// computeStage — basic transitions
// ═══════════════════════════════════════════════════════════════════════════

test("stage: opening → collecting on first message", () => {
  assert.equal(computeStage({}, {}, STAGES.OPENING, "hi"), STAGES.COLLECTING);
});

test("stage: collecting stays collecting without enough facts", () => {
  const draft = { product: "milk" };
  assert.equal(computeStage(draft, {}, STAGES.COLLECTING, "78"), STAGES.COLLECTING);
});

test("stage: collecting stays collecting even if Mistral says readyToSummarize but not enough facts", () => {
  const draft = { product: "milk" };
  assert.equal(computeStage(draft, { readyToSummarize: true }, STAGES.COLLECTING, "yes"), STAGES.COLLECTING);
});

test("stage: collecting → summarizing when enough facts + Mistral agrees", () => {
  const draft = { product: "milk", oldPrice: 100, newPrice: 120, demandChange: "down" };
  assert.equal(computeStage(draft, { readyToSummarize: true }, STAGES.COLLECTING, "goal is profit"), STAGES.SUMMARIZING);
});

test("stage: summarizing → awaiting_confirmation automatically", () => {
  const draft = { product: "milk" };
  assert.equal(computeStage(draft, {}, STAGES.SUMMARIZING, ""), STAGES.AWAITING_CONFIRMATION);
});

test("stage: awaiting_confirmation → advising on clean confirm", () => {
  const draft = { product: "milk", context: { userConfirmedSummary: true } };
  assert.equal(computeStage(draft, {}, STAGES.AWAITING_CONFIRMATION, "yes"), STAGES.ADVISING);
});

test("stage: awaiting_confirmation → summarizing on rejection", () => {
  const draft = { product: "milk", context: {} };
  assert.equal(computeStage(draft, {}, STAGES.AWAITING_CONFIRMATION, "no"), STAGES.SUMMARIZING);
});

test("stage: awaiting_confirmation → summarizing on correction with details", () => {
  const draft = { product: "milk", context: {} };
  assert.equal(computeStage(draft, {}, STAGES.AWAITING_CONFIRMATION, "yes but cost is 50"), STAGES.SUMMARIZING);
});

test("stage: advising → ready_to_save when advice exists", () => {
  const draft = { advice: { recommendation: "Hold the price." } };
  assert.equal(computeStage(draft, {}, STAGES.ADVISING, ""), STAGES.READY_TO_SAVE);
});

test("stage: ready_to_save → summarizing if user types something", () => {
  const draft = { advice: { recommendation: "Hold the price." } };
  assert.equal(computeStage(draft, {}, STAGES.READY_TO_SAVE, "actually cost is 60"), STAGES.SUMMARIZING);
});

// ═══════════════════════════════════════════════════════════════════════════
// validateStageTransition — guardrails
// ═══════════════════════════════════════════════════════════════════════════

test("guardrail: collecting → advising is blocked (forced to summarizing)", () => {
  assert.equal(validateStageTransition(STAGES.COLLECTING, STAGES.ADVISING, {}), STAGES.SUMMARIZING);
});

test("guardrail: advising without userConfirmedSummary is blocked", () => {
  const draft = { context: { userConfirmedSummary: false } };
  assert.equal(validateStageTransition(STAGES.AWAITING_CONFIRMATION, STAGES.ADVISING, draft), STAGES.SUMMARIZING);
});

test("guardrail: advising with userConfirmedSummary is allowed", () => {
  const draft = { context: { userConfirmedSummary: true } };
  assert.equal(validateStageTransition(STAGES.AWAITING_CONFIRMATION, STAGES.ADVISING, draft), STAGES.ADVISING);
});

test("guardrail: ready_to_save without advice is blocked (forced to advising)", () => {
  const draft = { advice: {} };
  assert.equal(validateStageTransition(STAGES.ADVISING, STAGES.READY_TO_SAVE, draft), STAGES.ADVISING);
});

test("guardrail: ready_to_save with advice is allowed", () => {
  const draft = { advice: { recommendation: "Hold the price." } };
  assert.equal(validateStageTransition(STAGES.ADVISING, STAGES.READY_TO_SAVE, draft), STAGES.READY_TO_SAVE);
});

// ═══════════════════════════════════════════════════════════════════════════
// mergeSafeFacts — labeled numbers vs bare numbers
// ═══════════════════════════════════════════════════════════════════════════

test("merge: parser labeled numbers fill draft fields", () => {
  const parser = { oldPrice: 100, newPrice: 120, cost: null, competitorPrice: null };
  const mistral = { product: "milk", facts: {} };
  const result = mergeSafeFacts(parser, mistral, {});
  assert.equal(result.oldPrice, 100);
  assert.equal(result.newPrice, 120);
});

test("merge: bare number goes to uncertainFacts", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null, _bareNumber: 78 };
  const mistral = { product: null };
  const result = mergeSafeFacts(parser, mistral, {});
  assert.equal(result.context.uncertainFacts.length, 1);
  assert.equal(result.context.uncertainFacts[0].value, 78);
  assert.equal(result.context.uncertainFacts[0].note, "no label or context");
});

test("merge: Mistral product wins over 'Unknown product'", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { product: "clothes" };
  const draft = { product: "Unknown product" };
  const result = mergeSafeFacts(parser, mistral, draft);
  assert.equal(result.product, "clothes");
});

test("merge: 'thinking' is never set as product", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { product: "thinking" };
  const draft = { product: "clothes" };
  const result = mergeSafeFacts(parser, mistral, draft);
  assert.equal(result.product, "clothes");
});

test("merge: 'planning' is never set as product", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { product: "planning" };
  const draft = { product: "Unknown product" };
  const result = mergeSafeFacts(parser, mistral, draft);
  assert.equal(result.product, "Unknown product");
});

test("merge: Mistral fills number gaps parser missed", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { oldPrice: 100, newPrice: 120 };
  const result = mergeSafeFacts(parser, mistral, {});
  assert.equal(result.oldPrice, 100);
  assert.equal(result.newPrice, 120);
});

test("merge: parser numbers override Mistral numbers (labeled wins)", () => {
  const parser = { oldPrice: 100, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { oldPrice: 90 };
  const result = mergeSafeFacts(parser, mistral, {});
  assert.equal(result.oldPrice, 100); // parser wins
});

test("merge: confirmed facts are protected after summary confirmation", () => {
  const parser = { oldPrice: 200, newPrice: null, cost: null, competitorPrice: null };
  const mistral = {};
  const draft = { oldPrice: 100, context: { userConfirmedSummary: true } };
  const result = mergeSafeFacts(parser, mistral, draft);
  assert.equal(result.oldPrice, 100); // confirmed, not overwritten
  assert.equal(result.context.uncertainFacts.length, 1); // 200 went to uncertain
  assert.equal(result.context.uncertainFacts[0].value, 200);
});

test("merge: Mistral demand change fills unknown", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { demandChange: "down" };
  const draft = { demandChange: "unknown" };
  const result = mergeSafeFacts(parser, mistral, draft);
  assert.equal(result.demandChange, "down");
});

test("merge: Mistral decisionMode is accepted", () => {
  const parser = { oldPrice: null, newPrice: null, cost: null, competitorPrice: null };
  const mistral = { decisionMode: "planning" };
  const result = mergeSafeFacts(parser, mistral, {});
  assert.equal(result.decisionMode, "planning");
});

// ═══════════════════════════════════════════════════════════════════════════
// The "hi → 78 → clothes → thinking" scenario
// ═══════════════════════════════════════════════════════════════════════════

test("scenario: hi → 78 → clothes → thinking stays in collecting, 78 is uncertain", () => {
  // Turn 1: "hi" → opening → collecting
  let stage = computeStage({}, {}, STAGES.OPENING, "hi");
  assert.equal(stage, STAGES.COLLECTING);

  // Turn 2: "78" → bare number → uncertain
  let draft = mergeSafeFacts(
    { oldPrice: null, newPrice: null, cost: null, competitorPrice: null, _bareNumber: 78 },
    { intent: "provide_info" },
    {}
  );
  stage = computeStage(draft, {}, STAGES.COLLECTING, "78");
  assert.equal(stage, STAGES.COLLECTING);
  assert.equal(draft.context.uncertainFacts.length, 1);
  assert.equal(draft.context.uncertainFacts[0].value, 78);

  // Turn 3: "clothes" → product set
  draft = mergeSafeFacts(
    { oldPrice: null, newPrice: null, cost: null, competitorPrice: null },
    { product: "clothes" },
    draft
  );
  stage = computeStage(draft, {}, STAGES.COLLECTING, "clothes");
  assert.equal(stage, STAGES.COLLECTING);
  assert.equal(draft.product, "clothes");

  // Turn 4: "thinking" → not a product
  draft = mergeSafeFacts(
    { oldPrice: null, newPrice: null, cost: null, competitorPrice: null },
    { product: "thinking", intent: "planning_mode", decisionMode: "planning" },
    draft
  );
  stage = computeStage(draft, {}, STAGES.COLLECTING, "thinking");
  assert.equal(stage, STAGES.COLLECTING);
  assert.equal(draft.product, "clothes"); // NOT overwritten
  assert.equal(draft.decisionMode, "planning");
});

// ═══════════════════════════════════════════════════════════════════════════
// detectLoopRepeat
// ═══════════════════════════════════════════════════════════════════════════

test("loop: detects exact same reply", () => {
  assert.equal(detectLoopRepeat(
    "What happened to sales after the change?",
    "What happened to sales after the change?"
  ), true);
});

test("loop: detects reply with minor punctuation differences", () => {
  assert.equal(detectLoopRepeat(
    "What happened to sales after the change?",
    "What happened to sales after the change"
  ), true);
});

test("loop: does not flag different replies", () => {
  assert.equal(detectLoopRepeat(
    "What happened to sales after the change?",
    "What is your cost price for milk?"
  ), false);
});

test("loop: does not flag null/undefined", () => {
  assert.equal(detectLoopRepeat(null, "hello"), false);
  assert.equal(detectLoopRepeat("hello", null), false);
});

test("loop: does not flag short replies", () => {
  assert.equal(detectLoopRepeat("ok", "ok"), false);
});

// ═══════════════════════════════════════════════════════════════════════════
// 'yes' during collecting stage is normal input, not confirmation
// ═══════════════════════════════════════════════════════════════════════════

test("stage: 'yes' during collecting does NOT trigger confirmation", () => {
  const draft = { product: "milk" };
  const stage = computeStage(draft, {}, STAGES.COLLECTING, "yes");
  assert.equal(stage, STAGES.COLLECTING);
});

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\nState service tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.error("STATE SERVICE TESTS FAILED.");
  process.exit(1);
} else {
  console.log("State service tests passed.\n");
}
