import assert from "node:assert/strict";
import { runMistralConversationTurn, __setLLMMock } from "../services/assistant-conversation.service.js";
import { STAGES } from "../services/assistant-state.service.js";

let passed = 0;
let failed = 0;

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

// Global hook to track mock calls
let llmCalls = [];
let mockImplementation = () => {};

__setLLMMock(async (stage) => {
  llmCalls.push(stage);
  return mockImplementation(stage);
});

async function runTests() {
  console.log("Running conversation controller tests...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // Deterministic Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  await testAsync("controller: greeting handled deterministically", async () => {
    llmCalls = [];
    const result = await runMistralConversationTurn("hi", [], {});
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "deterministic");
    assert.equal(result.diagnostics.intent, "greeting");
    assert.ok(result.reply.includes("Tell me one price change"));
    assert.equal(llmCalls.length, 0);
  });

  await testAsync("controller: small talk handled deterministically", async () => {
    llmCalls = [];
    const result = await runMistralConversationTurn("thanks", [], {});
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "deterministic");
    assert.equal(result.diagnostics.intent, "small_talk");
    assert.ok(result.reply.includes("I am here and ready"));
    assert.equal(llmCalls.length, 0);
  });

  await testAsync("controller: out of scope handled deterministically", async () => {
    llmCalls = [];
    const result = await runMistralConversationTurn("what is the weather?", [], {});
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "deterministic");
    assert.equal(result.diagnostics.intent, "out_of_scope");
    assert.equal(llmCalls.length, 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM Collection
  // ═══════════════════════════════════════════════════════════════════════════

  await testAsync("controller: complex ambiguous paragraph can call LLM for collection", async () => {
    llmCalls = [];
    mockImplementation = () => ({
      data: { reply: "What is the old price?", facts: { product: "mixed groceries" } },
      retryUsed: false, retryFailed: false
    });

    const result = await runMistralConversationTurn("I adjusted things after festival demand but I am not sure how to explain it", [], {});
    
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "mistral");
    assert.equal(result.draft.product, "mixed groceries");
    assert.equal(result.reply, "What is the old price?");
    assert.deepEqual(llmCalls, ["collection"]);
  });

  await testAsync("controller: slot-filling product turn uses Mistral wording while preserving parsed product", async () => {
    llmCalls = [];
    mockImplementation = () => ({
      data: {
        reply: "Milk, got it. Are you changing the price, or planning a new price?",
        intentGuesses: {}
      },
      retryUsed: false,
      retryFailed: false
    });

    const result = await runMistralConversationTurn("milk", [], {});

    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "mistral");
    assert.equal(result.draft.product, "milk");
    assert.match(result.reply, /Milk, got it/i);
    assert.deepEqual(llmCalls, ["collection"]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM Summarizing (2nd call transition)
  // ═══════════════════════════════════════════════════════════════════════════

  await testAsync("controller: sufficient historical facts summarize with Mistral even when cost is missing", async () => {
    llmCalls = [];
    mockImplementation = (stage) => {
      if (stage === "summary") {
        return {
          data: {
            reply: "You raised milk from Rs 100 to Rs 120, and demand went down while profit improved. Is this correct, or did I get something wrong?",
            scenarioSummary: "Milk moved from 100 to 120; demand is down and profit improved."
          },
          retryUsed: false,
          retryFailed: false
        };
      }
      throw new Error(`Unexpected ${stage} call`);
    };

    const existingDraft = { product: "milk", oldPrice: 100, newPrice: 120, cost: null };
    const result = await runMistralConversationTurn("low but profit increase", [], existingDraft);
    
    assert.equal(result.stage, STAGES.AWAITING_CONFIRMATION);
    assert.equal(result.diagnostics.replySource, "mistral_summary");
    assert.equal(result.draft.cost, null);
    assert.equal(result.draft.demandChange, "down");
    assert.match(result.reply, /profit improved/i);
    assert.deepEqual(llmCalls, ["summary"]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Awaiting Confirmation Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  await testAsync("controller: clean confirm triggers advising and 2nd LLM call", async () => {
    llmCalls = [];
    mockImplementation = () => ({
      data: {
        recommendation: "Hold price",
        reply: "Here is your action plan.",
        actionPlan: {
          recommendedAction: "Test Rs 110 for 5 days.",
          why: "Profit improved, but demand weakened.",
          risk: "Footfall may drop if Rs 120 stays too high.",
          whatToTest: "Compare Rs 110 against Rs 120.",
          metricToWatch: "Daily units and repeat customers.",
          reviewDate: "In 5 days.",
          confidence: "medium",
          missingData: ["cost"]
        }
      },
      retryUsed: false, retryFailed: false
    });

    const existingDraft = { product: "milk", context: { stage: STAGES.AWAITING_CONFIRMATION } };
    const result = await runMistralConversationTurn("yes", [], existingDraft);
    
    assert.equal(result.stage, STAGES.READY_TO_SAVE);
    assert.equal(result.diagnostics.replySource, "mistral_advice");
    assert.ok(result.draft.context.userConfirmedSummary);
    assert.equal(result.reply, "Here is your action plan.");
    assert.equal(result.draft.advice.actionPlan.recommendedAction, "Test Rs 110 for 5 days.");
    assert.deepEqual(result.draft.advice.actionPlan.missingData, ["cost"]);
    assert.deepEqual(llmCalls, ["advice"]);
  });

  await testAsync("controller: rejection goes back to collecting with Mistral wording", async () => {
    llmCalls = [];
    mockImplementation = (stage) => {
      assert.equal(stage, "collection");
      return {
        data: {
          reply: "Got it. Tell me the detail I misunderstood, and I will revise the scenario."
        },
        retryUsed: false,
        retryFailed: false
      };
    };
    
    const existingDraft = { product: "milk", context: { stage: STAGES.AWAITING_CONFIRMATION } };
    const result = await runMistralConversationTurn("no", [], existingDraft);
    
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "mistral");
    assert.equal(result.diagnostics.intent, "rejection");
    assert.deepEqual(llmCalls, ["collection"]);
  });

  await testAsync("controller: no my mistake with prices updates the draft instead of plain rejection", async () => {
    llmCalls = [];
    mockImplementation = (stage) => {
      assert.equal(stage, "summary");
      return {
        data: {
          reply: "Thanks, I have the corrected milk move as Rs 100 to Rs 110 with demand down. Is that right now?",
          scenarioSummary: "Milk moved from Rs 100 to Rs 110, demand is down, and cost is Rs 50."
        },
        retryUsed: false,
        retryFailed: false
      };
    };

    const existingDraft = {
      product: "milk",
      oldPrice: 100,
      newPrice: 120,
      currentPrice: 120,
      cost: 50,
      demandChange: "down",
      context: { stage: STAGES.AWAITING_CONFIRMATION }
    };
    const result = await runMistralConversationTurn("no my mistake price was 100 to 110", [], existingDraft);

    assert.equal(result.diagnostics.intent, "correction_with_details");
    assert.equal(result.diagnostics.replySource, "mistral_summary");
    assert.equal(result.stage, STAGES.AWAITING_CONFIRMATION);
    assert.equal(result.draft.product, "milk");
    assert.equal(result.draft.oldPrice, 100);
    assert.equal(result.draft.newPrice, 110);
    assert.equal(result.draft.cost, 50);
    assert.deepEqual(llmCalls, ["summary"]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Fallbacks
  // ═══════════════════════════════════════════════════════════════════════════

  await testAsync("controller: LLM failure uses fallback", async () => {
    llmCalls = [];
    mockImplementation = () => { throw new Error("Network Error"); };

    const existingDraft = { product: "milk", oldPrice: 100, newPrice: null };
    const result = await runMistralConversationTurn("I am confused about this demand situation after festival", [], existingDraft);
    
    assert.equal(result.stage, STAGES.COLLECTING);
    assert.equal(result.diagnostics.replySource, "fallback");
    assert.ok(result.reply.includes("cost price")); // From fallback logic
  });

  await testAsync("controller: advice LLM failure returns structured fallback action plan", async () => {
    llmCalls = [];
    mockImplementation = () => { throw new Error("Advice Error"); };

    const existingDraft = {
      product: "milk",
      oldPrice: 100,
      newPrice: 120,
      demandChange: "down",
      cost: null,
      context: { stage: STAGES.AWAITING_CONFIRMATION }
    };
    const result = await runMistralConversationTurn("yes", [], existingDraft);

    assert.equal(result.stage, STAGES.READY_TO_SAVE);
    assert.equal(result.diagnostics.replySource, "rule_advice_fallback");
    assert.ok(result.draft.advice.actionPlan);
    assert.ok(result.draft.advice.actionPlan.missingData.includes("cost"));
    assert.match(result.draft.advice.actionPlan.recommendedAction, /test|rollback|price/i);
    assert.deepEqual(llmCalls, ["advice"]);
  });

  console.log(`\nController tests: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
