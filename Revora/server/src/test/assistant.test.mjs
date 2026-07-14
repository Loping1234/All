import assert from "node:assert/strict";
import { parseAssistantDecision, mergeLlmExtraction, draftAssistantDecision, buildAdvice } from "../services/assistant.service.js";
import { AssistantDecision } from "../models/assistant-decision.model.js";
import { KnowledgeBase } from "../models/knowledge-base.model.js";
import { parseJsonFromText } from "../services/llm.service.js";
import { buildAdvicePrompt } from "../services/assistant-prompts.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`âœ“ ${name}`);
  } catch (error) {
    console.error(`âœ— ${name}`);
    throw error;
  }
}

const VALID_KB_TAGS = [
  "price_increase_demand_up",
  "price_increase_demand_down",
  "price_increase_demand_flat",
  "price_decrease_demand_up",
  "price_decrease_demand_down",
  "price_decrease_demand_flat",
  "price_flat_demand_down",
  "price_flat_demand_up"
];

test("extracts complete increase plus demand down", () => {
  const parsed = parseAssistantDecision("I increased shirt price from 800 to 950, cost is 500, sales dropped, and my goal is profit.");
  assert.equal(parsed.product, "shirt");
  assert.equal(parsed.oldPrice, 800);
  assert.equal(parsed.newPrice, 950);
  assert.equal(parsed.currentPrice, 950);
  assert.equal(parsed.cost, 500);
  assert.equal(parsed.goal, "protect profit");
  assert.equal(parsed.priceChangeType, "increase");
  assert.equal(parsed.demandChange, "down");
  assert.equal(parsed.missingFields.length, 0);
  assert.equal(parsed.readyForConfirmation, true);
});

test("extracts decrease plus demand up without treating profit as demand down", () => {
  const parsed = parseAssistantDecision("I reduced jeans from 1500 to 1200, cost is 850, sales improved but profit feels low.");
  assert.equal(parsed.product, "jeans");
  assert.equal(parsed.oldPrice, 1500);
  assert.equal(parsed.newPrice, 1200);
  assert.equal(parsed.cost, 850);
  assert.equal(parsed.goal, "protect profit");
  assert.equal(parsed.priceChangeType, "decrease");
  assert.equal(parsed.demandChange, "up");
});

test("handles greeting as a follow-up prompt", () => {
  const parsed = parseAssistantDecision("hello");
  assert.equal(parsed.product, "Unknown product");
  assert.equal(parsed.priceChangeType, "unknown");
  assert.equal(parsed.demandChange, "unknown");
  assert.ok(parsed.missingFields.length >= 5);
  assert.equal(parsed.conversationalResponse, "");
});



test("does not keep greeting as product across follow-up turns", () => {
  let draft = parseAssistantDecision("hi");
  draft = parseAssistantDecision("milk form 100 to 120", draft);
  draft = parseAssistantDecision("down, cost is 75, goal is profit", draft);

  assert.equal(draft.product, "milk");
  assert.equal(draft.oldPrice, 100);
  assert.equal(draft.newPrice, 120);
  assert.equal(draft.cost, 75);
  assert.equal(draft.goal, "protect profit");
  assert.equal(draft.priceChangeType, "increase");
  assert.equal(draft.demandChange, "down");
  assert.equal(draft.missingFields.length, 0);
});



test("unit phrase after product prompt does not overwrite product", () => {
  let draft = parseAssistantDecision("milk");
  draft = parseAssistantDecision("50 per kg", draft);

  assert.equal(draft.product, "milk");
  assert.notEqual(draft.product, "per kg");
});

test("LLM merge cannot overwrite confirmed product with unit phrase", () => {
  const fallback = parseAssistantDecision("milk old price 100 new price 120 sales went poor cost is 50");
  const merged = mergeLlmExtraction(fallback, {
    product: "per liter",
    oldPrice: 100,
    newPrice: 120,
    cost: 50,
    demandChange: "down"
  });

  assert.equal(merged.product, "milk");
});

test("price-only and demand-only follow-ups do not overwrite product", () => {
  let draft = parseAssistantDecision("milk");
  draft = parseAssistantDecision("100 to 120", draft);
  draft = parseAssistantDecision("sales went poor", draft);

  assert.equal(draft.product, "milk");
  assert.equal(draft.oldPrice, 100);
  assert.equal(draft.newPrice, 120);
  assert.equal(draft.demandChange, "down");
  assert.equal(draft.context.businessSignals.weakDemand, true);
});

test("cost-only follow-up keeps previous product and prices", () => {
  let draft = parseAssistantDecision("milk 100 to 120 sales went poor");
  draft = parseAssistantDecision("cost 80", draft);

  assert.equal(draft.product, "milk");
  assert.equal(draft.oldPrice, 100);
  assert.equal(draft.newPrice, 120);
  assert.equal(draft.cost, 80);
  assert.equal(draft.demandChange, "down");
});



test("identifies missing old price", () => {
  const parsed = parseAssistantDecision("I changed mango price to 120, cost is 80, sales improved, goal is grow sales.");
  assert.equal(parsed.product, "mango");
  assert.equal(parsed.oldPrice, null);
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.cost, 80);
  assert.equal(parsed.demandChange, "up");
  assert.ok(parsed.missingFields.includes("the old price"));
});

test("identifies missing demand outcome", () => {
  const parsed = parseAssistantDecision("I increased soap price from 40 to 45.");
  assert.equal(parsed.priceChangeType, "increase");
  assert.equal(parsed.demandChange, "unknown");
  assert.ok(parsed.missingFields.includes("if sales went up or down"));
});

test("does not treat cost as the previous price when only current price is given", () => {
  const parsed = parseAssistantDecision("I sell mangoes at 120, cost is 80, sales are slow.");
  assert.equal(parsed.product, "mangoes");
  assert.equal(parsed.oldPrice, null);
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.cost, 80);
  assert.equal(parsed.demandChange, "down");
  assert.ok(parsed.missingFields.includes("the old price"));
  assert.ok(parsed.missingFields.includes("your pricing goal"));
});

test("uses labeled old and new prices instead of demand counts", () => {
  const parsed = parseAssistantDecision("milk: old price-100, new price-120. demand decreased from 20 people to 15 and i want profit");
  assert.equal(parsed.product, "milk");
  assert.equal(parsed.oldPrice, 100);
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.demandChange, "down");
  assert.equal(parsed.goal, "protect profit");
  assert.deepEqual(parsed.missingFields, ["the product cost"]);
});

test("does not leak demand verbs into product names", () => {
  const parsed = parseAssistantDecision("milk old price 100 new price 120 demand fell goal profit");
  assert.equal(parsed.product, "milk");
  assert.equal(parsed.oldPrice, 100);
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.demandChange, "down");
  assert.deepEqual(parsed.missingFields, ["the product cost"]);
});

test("captures bought-for cost in a follow-up without losing existing prices", () => {
  const firstDraft = parseAssistantDecision("milk: old price-100, new price-120. demand decreased from 20 people to 15 and i want profit");
  const parsed = parseAssistantDecision("i am a shop vendor and i bought this for 80. old selling price was 100 and new one is 120", firstDraft);
  assert.equal(parsed.product, "milk");
  assert.equal(parsed.oldPrice, 100);
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.cost, 80);
  assert.equal(parsed.readyForConfirmation, true);
});

test("sufficient past-change signals allow confirmation without cost", () => {
  let draft = parseAssistantDecision("milk");
  draft = parseAssistantDecision("100 to 120", draft);
  draft = parseAssistantDecision("low but profit increase", draft);

  assert.equal(draft.product, "milk");
  assert.equal(draft.oldPrice, 100);
  assert.equal(draft.newPrice, 120);
  assert.equal(draft.demandChange, "down");
  assert.equal(draft.cost, null);
  assert.equal(draft.readyForConfirmation, true);
  assert.ok(draft.missingFields.includes("the product cost"));
});

test("planning mode advice uses current and proposed prices", () => {
  let draft = parseAssistantDecision("milk");
  draft = parseAssistantDecision("i sell it for 30, future planning is 40. supplier 22 per liter", draft);
  const advice = buildAdvice(draft);

  assert.equal(draft.context.decisionMode, "planning");
  assert.equal(draft.currentPrice, 30);
  assert.equal(draft.proposedPrice, 40);
  assert.equal(draft.cost, 22);
  assert.ok(advice.actionPlan);
  assert.match(advice.actionPlan.recommendedAction, /Rs 30|Rs 40|test/i);
  assert.equal(advice.actionPlan.missingData.length, 0);
  assert.match(advice.recommendation, /Rs 30 to Rs 40/);
  assert.match(advice.rationale, /controlled|Without demand history|33%/);
});

test("fallback advice action plan records missing cost as lower confidence", () => {
  const draft = parseAssistantDecision("milk 100 to 120 sales dropped");
  const advice = buildAdvice(draft);

  assert.ok(advice.actionPlan);
  assert.ok(advice.actionPlan.missingData.includes("cost"));
  assert.match(advice.actionPlan.confidence, /low|medium/i);
});

test("competitor anchored price is captured but unanchored selling price is not competitor price", () => {
  const ownPrice = parseAssistantDecision("selling for 110");
  assert.equal(ownPrice.competitorPrice, null);

  const competitorDraft = parseAssistantDecision("competitor has arrived and selling for 110 rupees per liter", {
    product: "milk",
    oldPrice: 100,
    newPrice: 120,
    currentPrice: 120,
    cost: 90,
    demandChange: "up",
    context: { businessSignals: { customerCountDown: true } }
  });

  assert.equal(competitorDraft.competitorPrice, 110);
});

test("competitor entry customer loss playbook overrides healthy price increase signal", () => {
  const draft = parseAssistantDecision(
    "100 was earlier price raised to 120 now. i buy it for 90. sales are up 20 percent with loss of customers of 20 percent. competitor has arrived and selling for 110 rupees per liter. what should i do",
    { product: "milk", context: {} }
  );

  assert.equal(draft.product, "milk");
  assert.equal(draft.oldPrice, 100);
  assert.equal(draft.newPrice, 120);
  assert.equal(draft.currentPrice, 120);
  assert.equal(draft.cost, 90);
  assert.equal(draft.competitorPrice, 110);
  assert.equal(draft.context.businessSignals.salesValueUp, true);
  assert.equal(draft.context.businessSignals.customerCountDown, true);
  assert.equal(draft.context.businessSignals.competitorCheaper, true);
  assert.equal(draft.context.businessSignals.competitorGap, 10);
  assert.equal(draft.context.businessSignals.marginAtCompetitorPrice, 18.2);
  assert.equal(draft.context.selectedPlaybook.playbook, "competitor_entry_customer_loss");
  assert.equal(draft.advice.title, "Competitor entry - defend footfall now");
  assert.match(draft.advice.recommendation, /Rs 110/);
  assert.match(draft.advice.rationale, /18\.2%/);
  assert.match(draft.advice.actionPlan.recommendedAction, /Match Rs 110 today/);
  assert.doesNotMatch(draft.advice.title, /healthy/i);
  assert.doesNotMatch(draft.advice.actionPlan.recommendedAction, /test a middle price/i);
});

test("competitor entry low margin playbook avoids matching when competitor margin is too thin", () => {
  const draft = parseAssistantDecision(
    "old price 100 new price 120 cost 105 sales are up but customers are down and competitor selling for 110",
    { product: "milk", context: {} }
  );

  assert.equal(draft.competitorPrice, 110);
  assert.equal(draft.context.businessSignals.marginAtCompetitorPrice, 4.5);
  assert.equal(draft.context.selectedPlaybook.playbook, "competitor_entry_low_margin");
  assert.match(draft.advice.recommendation, /Do not match/i);
});

test("advice prompt passes selected playbook and computed competitor numbers to Mistral", () => {
  const draft = parseAssistantDecision(
    "old price 100 new price 120 cost 90 sales are up but customers are down and competitor selling for 110",
    { product: "milk", context: {} }
  );
  const prompt = buildAdvicePrompt(draft, draft.advice, []);

  assert.match(prompt, /SELECTED PLAYBOOK: competitor_entry_customer_loss/);
  assert.match(prompt, /Competitor price: Rs 110/);
  assert.match(prompt, /Price gap vs competitor: Rs 10/);
  assert.match(prompt, /Margin at competitor price: 18\.2%/);
  assert.match(prompt, /act-then-measure/i);
});

test("merges Mistral-style extraction into the existing draft", () => {
  const fallback = parseAssistantDecision("I sell mangoes at 120, cost is 80, sales are slow.");
  const merged = mergeLlmExtraction(fallback, {
    product: "mangoes",
    oldPrice: 100,
    newPrice: 120,
    cost: 80,
    demandChange: "down",
    goal: "protect profit",
    stockContext: "normal",
    competitorContext: "unknown"
  });

  assert.equal(merged.oldPrice, 100);
  assert.equal(merged.newPrice, 120);
  assert.equal(merged.cost, 80);
  assert.equal(merged.readyForConfirmation, true);
});

test("parses JSON from fenced Mistral responses", () => {
  const parsed = parseJsonFromText("```json\n{\"reply\":\"ok\",\"readyForConfirmation\":false}\n```");
  assert.equal(parsed.reply, "ok");
  assert.equal(parsed.readyForConfirmation, false);
});

test("confirmed decision validates with canonical flat value", () => {
  const decision = new AssistantDecision({
    rawMessage: "Price stayed 100 and sales dropped.",
    product: "notebook",
    oldPrice: 100,
    newPrice: 100,
    currentPrice: 100,
    cost: 60,
    advice: {
      actionPlan: {
        recommendedAction: "Test Rs 95 for 3 days.",
        why: "Demand dropped.",
        risk: "Margin may fall.",
        whatToTest: "Daily sales.",
        metricToWatch: "Units sold.",
        reviewDate: "In 3 days.",
        confidence: "medium",
        missingData: []
      }
    },
    goal: "protect profit",
    priceChangeType: "flat",
    demandChange: "down"
  });

  const validation = decision.validateSync();
  assert.equal(validation, undefined);
});

test("knowledge-base schema contains every assistant tag", () => {
  const enumValues = KnowledgeBase.schema.path("tag").enumValues;
  assert.deepEqual([...enumValues].sort(), [...VALID_KB_TAGS].sort());
});

console.log("Assistant tests passed.");
