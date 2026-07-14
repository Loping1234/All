import assert from "node:assert/strict";
import { draftAssistantDecision } from "../services/assistant.service.js";
import { __setLLMMock } from "../services/assistant-conversation.service.js";

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

async function runTranscript(messages) {
  let draft = null;
  const chatHistory = [];
  const snapshots = [];
  let llmCalls = 0;

  __setLLMMock(async (stage) => {
    llmCalls++;
    if (stage === "summary") {
      return {
        data: {
          reply: "Here is what I understood from your pricing situation. Is this correct, or did I get something wrong?",
          scenarioSummary: "Structured scenario summary."
        },
        retryUsed: false,
        retryFailed: false
      };
    }
    return {
      data: {
        reply: `Thanks, I am following turn ${llmCalls}. Tell me the next pricing detail that matters most here.`,
        intentGuesses: {},
        readyToSummarize: false
      },
      retryUsed: false,
      retryFailed: false
    };
  });

  for (const text of messages) {
    chatHistory.push({ role: "user", text });
    draft = await draftAssistantDecision({}, text, draft, {
      chatHistory: chatHistory.slice(-6)
    });
    chatHistory.push({ role: "assistant", text: draft.conversationalResponse || "" });
    snapshots.push({ text, draft });
  }

  __setLLMMock(null);
  return { snapshots, llmCalls };
}

await testAsync("ambiguous unit number keeps structured uncertainty while Mistral writes reply", async () => {
  const { snapshots, llmCalls } = await runTranscript(["milk", "30 per liter"]);
  const second = snapshots[1].draft;

  assert.equal(llmCalls, 2);
  assert.equal(second.product, "milk");
  assert.equal(second.currentPrice, null);
  assert.equal(second.cost, null);
  assert.equal(second.context.unit, "liter");
  assert.equal(second.context.pendingField, "priceMeaning");
  assert.equal(second.context.uncertainFacts.at(-1).value, 30);
  assert.equal(second.replySource, "mistral");
});

await testAsync("planning transcript captures current proposed cost and unit without repeated questions", async () => {
  const { snapshots, llmCalls } = await runTranscript([
    "milk",
    "i sell it for 30",
    "future planning is 40",
    "When it comes to my shop i give supplier 22 per liter"
  ]);
  const currentPriceDraft = snapshots[1].draft;
  const finalDraft = snapshots.at(-1).draft;
  const replies = snapshots.map((snap) => snap.draft.conversationalResponse.toLowerCase());

  assert.equal(llmCalls, 4);
  assert.equal(currentPriceDraft.context.pendingField, "proposedPrice");
  assert.equal(currentPriceDraft.replySource, "mistral");
  assert.equal(finalDraft.product, "milk");
  assert.equal(finalDraft.currentPrice, 30);
  assert.equal(finalDraft.proposedPrice, 40);
  assert.equal(finalDraft.cost, 22);
  assert.equal(finalDraft.context.unit, "liter");
  assert.equal(finalDraft.context.decisionMode, "planning");
  assert.equal(finalDraft.context.stage, "awaiting_confirmation");
  assert.ok(!finalDraft.missingFields.includes("the old price"));
  assert.ok(!finalDraft.missingFields.includes("the new price"));
  assert.ok(!finalDraft.missingFields.includes("if sales went up or down"));
  assert.match(replies.at(-1), /is this correct/i);
  assert.doesNotMatch(replies.at(-1), /what (is|price)|tell me|purchase price|buying price|current price|proposed price/);
});

await testAsync("full user paragraph resolves planning fields and summarizes instantly", async () => {
  const { snapshots, llmCalls } = await runTranscript([
    "milk",
    "i sell it for 30, future planning is 40. From producer i buy it for 22. Units are in cost/liter"
  ]);
  const finalDraft = snapshots.at(-1).draft;

  assert.equal(llmCalls, 2);
  assert.equal(finalDraft.product, "milk");
  assert.equal(finalDraft.currentPrice, 30);
  assert.equal(finalDraft.proposedPrice, 40);
  assert.equal(finalDraft.cost, 22);
  assert.equal(finalDraft.context.unit, "liter");
  assert.equal(finalDraft.context.decisionMode, "planning");
  assert.equal(finalDraft.replySource, "mistral_summary");
  assert.match(finalDraft.conversationalResponse, /is this correct/i);
});

await testAsync("pending demand answer low but profit increase does not repeat demand question", async () => {
  const { snapshots, llmCalls } = await runTranscript([
    "milk",
    "100 to 120",
    "low but profit increase"
  ]);
  const finalDraft = snapshots.at(-1).draft;

  assert.equal(llmCalls, 3);
  assert.equal(finalDraft.product, "milk");
  assert.equal(finalDraft.oldPrice, 100);
  assert.equal(finalDraft.newPrice, 120);
  assert.equal(finalDraft.demandChange, "down");
  assert.notEqual(finalDraft.context.pendingField, "demandChange");
  assert.equal(finalDraft.replySource, "mistral_summary");
  assert.doesNotMatch(finalDraft.conversationalResponse, /what happened to sales or customer visits/i);
});

console.log(`\nMilk flow tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
