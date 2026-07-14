# Revora Data Integrity Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Revora from generating or showing pricing advice from corrupted, guessed, or unconfirmed facts.

**Architecture:** Split the system into parse-time hygiene and an advice-time integrity gate. Parse-time hygiene runs every turn and prevents bad facts from entering draft state; the advice gate runs only before summary/advice and blocks dirty drafts with compact repair questions. Final advice is generated only after a fact-locked summary has been confirmed.

**Tech Stack:** Node.js ES modules, Express service layer, React client, existing assistant tests under `server/src/test`, Vite build.

---

## Non-Negotiable Invariants

- No noisy product ever enters `draft.product`.
- Parse-time hygiene always runs.
- Advice gate runs only near summary/advice.
- No final `advice.actionPlan` exists before confirmed summary.
- Correction beats topic switch, confirmation, and save.
- Topic switch resets the draft and never merges old facts.
- Confirmation summaries are server-grounded and fact-locked.

---

## File Structure

- Create `server/src/services/assistant-integrity.service.js`
  - Owns product rescue, number classification, competitor rescue, parse-time hygiene, topic switch detection, integrity gate, and deterministic summary helpers.
- Modify `server/src/services/assistant.service.js`
  - Calls parse-time hygiene before completing draft; stops early advice creation; exposes draft fields required by the gate.
- Modify `server/src/services/assistant-state.service.js`
  - Applies safe suspected facts, strengthens confirmation/correction precedence, and preserves unit/integrity context.
- Modify `server/src/services/assistant-conversation.service.js`
  - Runs topic-switch detection, repair flow, gate-before-summary, universal yes+correction parsing, and confirmed-only advice generation.
- Modify `server/src/services/assistant-prompts.js`
  - Keeps Mistral advice prompts grounded in server-confirmed facts only.
- Modify `client/src/components/authenticated-app.jsx` and `client/src/components/assistant-workspace.jsx`
  - Hides draft/advice during repair, gates Action Plan rendering, handles `saveDeclined`, clears stale context on reset.
- Add/extend tests in `server/src/test/assistant.test.mjs`, `server/src/test/assistant-state.test.mjs`, `server/src/test/assistant-controller.test.mjs`, and `server/src/test/assistant-milk-flow.test.mjs`.

---

## Task 1: Add Integrity Service Skeleton And RED Tests

**Files:**
- Create: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/test/assistant.test.mjs`

- [ ] **Step 1: Add failing tests for product rescue and noisy-product rejection**

Add tests that call the new service directly:

```js
import {
  sanitizeProductCandidate,
  rescueProduct,
  checkIntegrity
} from "../services/assistant-integrity.service.js";

test("integrity: noisy product is rejected and rescued as suspected product", () => {
  const noisy = "Denim jeans per piece bought competitor has After doing percent percent";
  const cleaned = sanitizeProductCandidate(noisy);
  const rescued = rescueProduct("Denim jeans i raised from 500 to 600 per piece.");

  assert.equal(cleaned.safeProduct, null);
  assert.equal(cleaned.issue, "noisy_product");
  assert.equal(rescued.product, "Denim jeans");
  assert.equal(rescued.confidence, "high");
});

test("integrity: noisy product stays out of draft product", () => {
  const draft = {
    product: "Denim jeans per piece bought competitor has After doing percent percent",
    oldPrice: 500,
    newPrice: 600,
    context: {}
  };

  const gate = checkIntegrity(draft, "Denim jeans i raised from 500 to 600 per piece.", {
    phase: "pre_summary"
  });

  assert.equal(gate.status, "repair_required");
  assert.ok(gate.hardIssues.includes("noisy_product"));
  assert.equal(gate.suspectedFacts.product, "Denim jeans");
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: fail because `assistant-integrity.service.js` does not exist or exports are missing.

- [ ] **Step 3: Add minimal integrity service skeleton**

Implement:

```js
const PRODUCT_TRIGGER_WORDS = /\b(price|cost|competitor|rival|sales|customers?|percent|raised|bought|selling|after|doing)\b/i;
const UNIT_SUFFIX = /\s+(?:per\s+)?(?:kg|kilogram|gram|g|liter|litre|l|piece|pieces|unit|units|each|packet|pack|bag|box)$/i;
const GENERIC_PRODUCTS = new Set(["item", "product", "thing", "stuff", "it", "this", "that"]);

export function sanitizeProductCandidate(value) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  const withoutUnit = raw.replace(UNIT_SUFFIX, "").trim();
  const words = withoutUnit.split(/\s+/).filter(Boolean);
  const hasStandaloneNumber = /(^|\s)\d+(?:[,.]\d+)*(\s|$)/.test(withoutUnit);
  const generic = GENERIC_PRODUCTS.has(withoutUnit.toLowerCase());

  if (!withoutUnit || generic || words.length > 4 || PRODUCT_TRIGGER_WORDS.test(withoutUnit) || hasStandaloneNumber) {
    return { safeProduct: null, issue: "noisy_product" };
  }

  return { safeProduct: withoutUnit, issue: null };
}

export function rescueProduct(rawMessage = "") {
  const text = String(rawMessage || "").replace(/\s+/g, " ").trim();
  const head = text.split(/\b(?:i\s+)?(?:raised|changed|increase|increased|reduce|reduced|from|old|new|cost|bought|competitor|sales|customers?)\b/i)[0]
    .replace(UNIT_SUFFIX, "")
    .trim();
  const sanitized = sanitizeProductCandidate(head);
  return sanitized.safeProduct
    ? { product: sanitized.safeProduct, confidence: "high" }
    : { product: null, confidence: "low" };
}

export function checkIntegrity(draft = {}, rawMessage = "", options = {}) {
  const hardIssues = [];
  const softIssues = [];
  const suspectedFacts = {};

  const productCheck = sanitizeProductCandidate(draft.product);
  if (draft.product && draft.product !== "Unknown product" && !productCheck.safeProduct) {
    hardIssues.push("noisy_product");
    const rescued = rescueProduct(rawMessage || draft.rawMessage || "");
    if (rescued.product) suspectedFacts.product = rescued.product;
  }

  return {
    status: hardIssues.length ? "repair_required" : (softIssues.length ? "warning" : "pass"),
    confidence: hardIssues.length ? "low" : (softIssues.length ? "medium" : "high"),
    canSummarize: hardIssues.length === 0,
    hardIssues,
    softIssues,
    repairQuestion: "",
    safeFacts: {},
    suspectedFacts,
    phase: options.phase || "unknown"
  };
}
```

- [ ] **Step 4: Run test and verify GREEN for new tests**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: all existing tests still pass or only later planned tests fail after being added.

---

## Task 2: Add Number Classification And Competitor Rescue

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/test/assistant.test.mjs`

- [ ] **Step 1: Add failing tests**

```js
import {
  classifyNumbers,
  rescueCompetitorPrice
} from "../services/assistant-integrity.service.js";

test("integrity: classifies money percentages quantities durations and model numbers", () => {
  const numbers = classifyNumbers("Samsung Galaxy S24 Ultra 256GB went 89999 to 94999, sales up 25 percent in 3 days, 20 pieces sold.");
  assert.ok(numbers.some(n => n.value === 89999 && n.type === "moneyLikeNumber"));
  assert.ok(numbers.some(n => n.value === 94999 && n.type === "moneyLikeNumber"));
  assert.ok(numbers.some(n => n.raw === "25" && n.type === "percentageNumber"));
  assert.ok(numbers.some(n => n.raw === "3" && n.type === "durationNumber"));
  assert.ok(numbers.some(n => n.raw === "20" && n.type === "quantityNumber"));
  assert.ok(numbers.some(n => n.raw === "S24" && n.type === "modelNumber"));
  assert.ok(numbers.some(n => n.raw === "256GB" && n.type === "modelNumber"));
});

test("integrity: rescues anchored competitor prices and ignores unanchored selling price", () => {
  assert.equal(rescueCompetitorPrice("competitor has 550").value, 550);
  assert.equal(rescueCompetitorPrice("rival selling for 550").value, 550);
  assert.equal(rescueCompetitorPrice("other shop at 550").value, 550);
  assert.equal(rescueCompetitorPrice("they charge 550").value, 550);
  assert.equal(rescueCompetitorPrice("selling for 550").value, null);
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: fail because exports are missing.

- [ ] **Step 3: Implement classifier and competitor rescue**

Add:

```js
const NUMBER_PATTERN = /[A-Za-z]*\d[\d,]*(?:\.\d+)?[A-Za-z]*/g;
const INDIAN_NUMBER = /^\d{1,3}(?:,\d{2})+(?:,\d{3})?(?:\.\d+)?$/;

function parseLooseNumber(raw) {
  const numeric = String(raw || "").replace(/[^0-9.]/g, "");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : null;
}

export function classifyNumbers(rawMessage = "") {
  const text = String(rawMessage || "");
  const matches = [...text.matchAll(NUMBER_PATTERN)];
  return matches.map(match => {
    const raw = match[0];
    const index = match.index ?? 0;
    const after = text.slice(index + raw.length, index + raw.length + 16).toLowerCase();
    const before = text.slice(Math.max(0, index - 8), index).toLowerCase();
    const lower = raw.toLowerCase();
    const value = parseLooseNumber(raw);

    let type = "moneyLikeNumber";
    if (/[a-z]/i.test(raw) && /\d/.test(raw)) type = "modelNumber";
    if (after.match(/^\s*(%|percent|percentage)/)) type = "percentageNumber";
    if (after.match(/^\s*(pieces?|pcs?|units?|items?|liters?|litres?|kg|grams?|bags?|boxes?)/)) type = "quantityNumber";
    if (after.match(/^\s*(days?|weeks?|months?)/)) type = "durationNumber";
    if (before.match(/[a-z]$/i) && /\d/.test(raw)) type = "modelNumber";

    return { raw, value, index, end: index + raw.length, type, indianFormat: INDIAN_NUMBER.test(raw) };
  });
}

export function rescueCompetitorPrice(rawMessage = "") {
  const text = String(rawMessage || "");
  const clauses = text.split(/[.!?;\n]+/).map(part => part.trim()).filter(Boolean);
  const anchor = /\b(competitor|rival|other shop|nearby shop|market price|other seller)\b/i;
  const pronoun = /\b(he|she|they)\b/i;
  const valuePattern = /\b(?:has|have|at|for|selling|sell|sells|charge|charges|charging|price|priced)\b\s*(?:is|was|at|for|=|:)?\s*(?:rs\.?|\u20b9|inr)?\s*([0-9][0-9,]*(?:\.\d+)?)/i;

  for (const clause of clauses) {
    const anchorMatch = clause.match(anchor);
    if (anchorMatch) {
      const scoped = clause.slice(anchorMatch.index);
      const match = scoped.match(valuePattern);
      if (match) return { value: parseLooseNumber(match[1]), confidence: "high" };
    }

    const pronounMatch = clause.match(pronoun);
    if (pronounMatch && /\b(sell|sells|selling|charge|charges|charging)\b/i.test(clause)) {
      const scoped = clause.slice(pronounMatch.index);
      const match = scoped.match(valuePattern);
      if (match) return { value: parseLooseNumber(match[1]), confidence: "medium" };
    }
  }

  return { value: null, confidence: "none" };
}
```

- [ ] **Step 4: Run test and verify GREEN**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: classifier and rescue tests pass.

---

## Task 3: Add Parse-Time Hygiene And Stop Product Contamination

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/services/assistant.service.js`
- Modify: `server/src/test/assistant.test.mjs`

- [ ] **Step 1: Add failing parser hygiene tests**

```js
test("parser hygiene: denim one-shot input does not save word salad product", () => {
  const parsed = parseAssistantDecision("Denim jeans i raised from 500 to 600 per piece. I bought it for 400 and competitor has 550. After doing 600 sales went up 25 percent but customers went down 10 percent.");
  assert.notEqual(parsed.product, "Denim jeans per piece bought competitor has After doing percent percent");
  assert.equal(parsed.product, "Unknown product");
  assert.equal(parsed.context.integrity.suspectedFacts.product, "Denim jeans");
  assert.equal(parsed.oldPrice, 500);
  assert.equal(parsed.newPrice, 600);
  assert.equal(parsed.cost, 400);
  assert.equal(parsed.competitorPrice, 550);
});

test("parser hygiene: competitor price does not become current selling price", () => {
  const parsed = parseAssistantDecision("milk from 100 to 120. competitor has 110.");
  assert.equal(parsed.newPrice, 120);
  assert.equal(parsed.currentPrice, 120);
  assert.equal(parsed.competitorPrice, 110);
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: fail if product contamination or competitor current-price pollution still exists.

- [ ] **Step 3: Implement parse-time hygiene**

Add `applyParseTimeHygiene(draft, rawMessage, existingDraft)` in `assistant-integrity.service.js`:

```js
export function applyParseTimeHygiene(draft = {}, rawMessage = "", existingDraft = null) {
  const context = { ...(draft.context || {}) };
  const integrity = {
    ...(context.integrity || {}),
    suspectedFacts: { ...(context.integrity?.suspectedFacts || {}) },
    hardIssues: [...(context.integrity?.hardIssues || [])],
    softIssues: [...(context.integrity?.softIssues || [])]
  };

  const productCheck = sanitizeProductCandidate(draft.product);
  if (draft.product && draft.product !== "Unknown product" && !productCheck.safeProduct) {
    const rescued = rescueProduct(rawMessage);
    draft.product = existingDraft?.product && existingDraft.product !== "Unknown product"
      ? existingDraft.product
      : "Unknown product";
    integrity.hardIssues = [...new Set([...integrity.hardIssues, "noisy_product"])];
    if (rescued.product) integrity.suspectedFacts.product = rescued.product;
  }

  const rescuedCompetitor = rescueCompetitorPrice(rawMessage);
  if ((draft.competitorPrice === null || draft.competitorPrice === undefined) && rescuedCompetitor.value !== null) {
    draft.competitorPrice = rescuedCompetitor.value;
    integrity.suspectedFacts.competitorPrice = rescuedCompetitor.value;
  }

  context.integrity = integrity;
  draft.context = context;
  return draft;
}
```

Then call it in `parseAssistantDecision` after `draftData.context` is created and before `completeParsed(draftData, ...)`.

- [ ] **Step 4: Run parser tests**

Run:

```bash
node server/src/test/assistant.test.mjs
```

Expected: parser hygiene tests pass.

---

## Task 4: Stop Early Final Advice Creation

**Files:**
- Modify: `server/src/services/assistant.service.js`
- Modify: `server/src/services/assistant-conversation.service.js`
- Modify: `server/src/test/assistant.test.mjs`
- Modify: `server/src/test/assistant-controller.test.mjs`

- [ ] **Step 1: Add failing tests**

```js
test("draft before confirmation has no final action plan", () => {
  const parsed = parseAssistantDecision("milk from 100 to 120 cost 90 sales up but customers down competitor has 110");
  assert.equal(parsed.context.userConfirmedSummary === true, false);
  assert.equal(parsed.advice, null);
  assert.equal(parsed.advicePreviewBlocked, true);
});
```

Add controller test:

```js
await testAsync("controller: advice is generated only after confirmed summary", async () => {
  llmCalls = [];
  const draft = parseAssistantDecision("milk from 100 to 120 cost 90 sales up but customers down competitor has 110", { product: "milk", context: {} });
  assert.equal(draft.advice, null);

  mockImplementation = (stage) => {
    if (stage === "advice") {
      return {
        data: {
          reply: "Match Rs 110 today and review after 3 days.",
          recommendation: "Match competitor at Rs 110 today.",
          rationale: "Competitor is cheaper and customer count is down.",
          nextStep: "Review customer count after 3 days.",
          actionPlan: {
            recommendedAction: "Match Rs 110 today.",
            why: "Competitor is cheaper and customer count is down.",
            risk: "Customer loss can become permanent.",
            whatToTest: "Act then measure.",
            metricToWatch: "Customer count and gross profit.",
            reviewDate: "In 3 days.",
            confidence: "high",
            missingData: []
          }
        },
        retryUsed: false,
        retryFailed: false
      };
    }
    throw new Error(`Unexpected ${stage}`);
  };

  const result = await runMistralConversationTurn("yes", [], {
    ...draft,
    context: { ...draft.context, stage: STAGES.AWAITING_CONFIRMATION, userConfirmedSummary: false }
  });

  assert.equal(result.stage, STAGES.READY_TO_SAVE);
  assert.ok(result.draft.advice.actionPlan);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm run test:assistant
```

Expected: fail because current `completeParsed` creates advice early.

- [ ] **Step 3: Implement confirmed-only advice**

In `completeParsed`, replace early advice assignment with:

```js
const confirmed = extracted.context?.userConfirmedSummary === true;
extracted.advicePreviewBlocked = !confirmed;
extracted.advice = confirmed ? buildAdvice(extracted) : null;
```

In `assistant-conversation.service.js`, when clean confirmation is received, call `buildAdvice(confirmedDraft)` after setting:

```js
confirmedDraft.context.userConfirmedSummary = true;
confirmedDraft.advicePreviewBlocked = false;
```

- [ ] **Step 4: Run assistant tests**

Run:

```bash
npm run test:assistant
```

Expected: all assistant tests pass after updating expectations that previously assumed draft advice existed early.

---

## Task 5: Add Advice Gate And Repair Flow

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/services/assistant-conversation.service.js`
- Modify: `server/src/test/assistant-controller.test.mjs`

- [ ] **Step 1: Add failing controller tests**

```js
await testAsync("controller: repair required blocks summary and advice", async () => {
  llmCalls = [];
  const result = await runMistralConversationTurn(
    "Denim jeans i raised from 500 to 600 per piece. I bought it for 400 and competitor has 550. After doing 600 sales went up 25 percent but customers went down 10 percent.",
    [],
    {}
  );

  assert.equal(result.stage, STAGES.COLLECTING);
  assert.equal(result.draft.context.integrity.status, "repair_required");
  assert.match(result.reply, /Denim jeans/i);
  assert.match(result.reply, /550/i);
  assert.equal(result.draft.advice, null);
  assert.deepEqual(llmCalls, []);
});
```

- [ ] **Step 2: Run controller tests and verify RED**

Run:

```bash
node server/src/test/assistant-controller.test.mjs
```

Expected: fail because the controller summarizes/advises instead of repairing.

- [ ] **Step 3: Complete `checkIntegrity`**

Extend `checkIntegrity`:

```js
function buildRepairQuestion(hardIssues, suspectedFacts) {
  const parts = [];
  if (suspectedFacts.product) parts.push(`the item is ${suspectedFacts.product}`);
  if (suspectedFacts.competitorPrice !== undefined) parts.push(`Rs ${suspectedFacts.competitorPrice} is the competitor price`);
  if (!parts.length) return "I caught the numbers, but one detail is unclear. Can you confirm the product and price details?";
  return `Quick check: I think ${parts.join(", and ")}. Is that right?`;
}
```

Set:

```js
status = hardIssues.length ? "repair_required" : softIssues.length ? "warning" : "pass";
canSummarize = status !== "repair_required";
repairQuestion = status === "repair_required" ? buildRepairQuestion(hardIssues, suspectedFacts) : "";
```

- [ ] **Step 4: Integrate gate before summary/advice**

In `runMistralConversationTurn`, before `summarizeWithMistralOrFallback`, run:

```js
const integrity = checkIntegrity(parserExtraction, raw, { phase: "pre_summary" });
parserExtraction.context = {
  ...(parserExtraction.context || {}),
  integrity
};

if (integrity.status === "repair_required") {
  parserExtraction.advice = null;
  parserExtraction.advicePreviewBlocked = true;
  parserExtraction.context.stage = STAGES.COLLECTING;
  return {
    reply: integrity.repairQuestion,
    draft: parserExtraction,
    stage: STAGES.COLLECTING,
    diagnostics: { replySource: "integrity_repair", latencyMs: Date.now() - startedAt }
  };
}
```

- [ ] **Step 5: Run controller tests**

Run:

```bash
node server/src/test/assistant-controller.test.mjs
```

Expected: repair test passes and existing tests remain green.

---

## Task 6: Add Server-Grounded Summary

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/services/assistant-conversation.service.js`
- Modify: `server/src/test/assistant-controller.test.mjs`

- [ ] **Step 1: Add failing summary tests**

```js
await testAsync("controller: clean full input summarizes before advice", async () => {
  const result = await runMistralConversationTurn(
    "milk from 100 to 120 cost 90 sales up but customers down competitor has 110",
    [],
    { product: "milk", context: {} }
  );

  assert.equal(result.stage, STAGES.AWAITING_CONFIRMATION);
  assert.match(result.reply, /milk/i);
  assert.match(result.reply, /100/);
  assert.match(result.reply, /120/);
  assert.match(result.reply, /90/);
  assert.match(result.reply, /110/);
  assert.equal(result.draft.advice, null);
});
```

- [ ] **Step 2: Implement deterministic summary helper**

Add:

```js
export function buildFactualSummary(draft = {}) {
  const unit = draft.context?.unit ? ` per ${draft.context.unit}` : "";
  const parts = [`Here is what I understood: ${draft.product || "the product"}`];
  if (draft.oldPrice !== null && draft.newPrice !== null) parts.push(`went from Rs ${draft.oldPrice} to Rs ${draft.newPrice}${unit}`);
  if (draft.cost !== null && draft.cost !== undefined) parts.push(`cost is Rs ${draft.cost}${unit}`);
  if (draft.competitorPrice !== null && draft.competitorPrice !== undefined) parts.push(`competitor price is Rs ${draft.competitorPrice}${unit}`);
  const signals = draft.context?.businessSignals || {};
  if (signals.salesValueUp) parts.push("sales value went up");
  if (signals.salesValueDown) parts.push("sales value went down");
  if (signals.customerCountDown) parts.push("customer count went down");
  if (signals.customerCountUp) parts.push("customer count went up");
  return `${parts.join(". ")}. Is that correct?`;
}
```

Use this summary before Mistral summary. Mistral may be skipped for confirmation summaries or only used as non-authoritative polish.

- [ ] **Step 3: Run controller tests**

Run:

```bash
node server/src/test/assistant-controller.test.mjs
```

Expected: summary test passes.

---

## Task 7: Universal Yes + Correction, Repair Confirmation, Topic Switch

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/services/assistant-state.service.js`
- Modify: `server/src/services/assistant-conversation.service.js`
- Modify: `server/src/test/assistant-state.test.mjs`
- Modify: `server/src/test/assistant-controller.test.mjs`

- [ ] **Step 1: Add failing tests**

Add state tests:

```js
test("topic switch: different product plus fresh prices after summary resets draft", () => {
  const result = detectTopicSwitch("forget milk, rice from 80 to 100", {
    product: "milk",
    context: { stage: STAGES.AWAITING_CONFIRMATION }
  });
  assert.equal(result.isSwitch, true);
  assert.equal(result.product, "rice");
});

test("topic switch: same product with actually is correction not switch", () => {
  const result = detectTopicSwitch("actually milk was 80 to 100", {
    product: "milk",
    context: { stage: STAGES.AWAITING_CONFIRMATION }
  });
  assert.equal(result.isSwitch, false);
});
```

Add controller tests:

```js
await testAsync("controller: yes plus correction updates and re-summarizes instead of advising", async () => {
  const existingDraft = {
    product: "milk",
    oldPrice: 100,
    newPrice: 120,
    cost: 90,
    competitorPrice: 110,
    demandChange: "up",
    context: { stage: STAGES.AWAITING_CONFIRMATION, userConfirmedSummary: false, integrity: { status: "pass" } }
  };

  const result = await runMistralConversationTurn("yes but cost is 95", [], existingDraft);

  assert.equal(result.stage, STAGES.AWAITING_CONFIRMATION);
  assert.equal(result.draft.cost, 95);
  assert.equal(result.draft.advice, null);
  assert.match(result.reply, /95/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm run test:assistant
```

Expected: fail because topic switch and universal correction are not implemented.

- [ ] **Step 3: Implement precedence**

In confirmation handling, enforce:

```txt
correction to current scenario > topic switch > confirmation > save
```

Implementation behavior:
- Parse every confirmation/save message first.
- If corrected fields exist, merge them and re-summarize.
- If topic switch detected, start new draft from the new message and drop old facts.
- Only if no correction and no topic switch should clean confirmation generate advice or save.

- [ ] **Step 4: Run assistant tests**

Run:

```bash
npm run test:assistant
```

Expected: all assistant tests pass.

---

## Task 8: Repair Loop Downgrade, Correction Fatigue, Unit Persistence

**Files:**
- Modify: `server/src/services/assistant-integrity.service.js`
- Modify: `server/src/services/assistant-conversation.service.js`
- Modify: `server/src/test/assistant-controller.test.mjs`

- [ ] **Step 1: Add failing tests**

```js
await testAsync("controller: repeated unavailable competitor price downgrades repair to warning", async () => {
  const draft = parseAssistantDecision("milk from 100 to 120 competitor has arrived sales down", { product: "milk", context: {} });
  draft.context.integrity = { status: "repair_required", hardIssues: ["competitor_anchor_without_price"], repairState: { competitor_anchor_without_price: 1 } };
  draft.context.stage = STAGES.COLLECTING;

  const result = await runMistralConversationTurn("I don't know their price", [], draft);

  assert.notEqual(result.draft.context.integrity.status, "repair_required");
  assert.ok(result.draft.context.integrity.softIssues.includes("competitor_casual_mention"));
});

await testAsync("controller: unit conflict asks before switching units", async () => {
  const draft = parseAssistantDecision("sugar at 40 per kg", { product: "sugar", context: {} });
  const result = await runMistralConversationTurn("cost is 35 per bag", [], draft);

  assert.equal(result.stage, STAGES.COLLECTING);
  assert.match(result.reply, /per kg/i);
  assert.match(result.reply, /per bag/i);
});
```

- [ ] **Step 2: Implement repair counters and unit conflict**

Rules:
- Same hard issue twice without usable new info downgrades to soft warning.
- Same field corrected 3 times accepts latest value and adds `context.integrity.softIssues += ["field_correction_fatigue"]`.
- `context.unit` persists across turns.
- If new unit conflicts with stored unit, do not overwrite; ask repair question.

- [ ] **Step 3: Run assistant tests**

Run:

```bash
npm run test:assistant
```

Expected: all assistant tests pass.

---

## Task 9: UI Guardrails And Save Decline

**Files:**
- Modify: `client/src/components/authenticated-app.jsx`
- Modify: `client/src/components/assistant-workspace.jsx`

- [ ] **Step 1: Add UI behavior manually as code changes**

Implement these conditions:

```js
const integrityStatus = draftDecision?.context?.integrity?.status;
const stage = draftDecision?.context?.stage;
const canShowDraftCard = integrityStatus !== "repair_required";
const canShowActionPlan = stage === "ready_to_save" && draftDecision?.context?.userConfirmedSummary === true;
```

Use:
- Hide draft card when `integrityStatus === "repair_required"`.
- Render Action Plan only when `canShowActionPlan`.
- If user rejects save after Action Plan, set `context.saveDeclined = true` in local draft state and do not call confirm endpoint.
- Reset must clear `currentParseDraft`, `draftDecision`, `latestAssistantDecision`, `chatHistory`, `context.integrity`, `repairState`, and `lastAskedField`.

- [ ] **Step 2: Build**

Run:

```bash
npm run build
```

Expected: build exits 0. Existing large chunk warning is acceptable.

---

## Task 10: Final Verification Matrix

**Files:**
- Modify only if failures expose missing behavior.

- [ ] **Step 1: Run full assistant tests**

Run:

```bash
npm run test:assistant
```

Expected: all assistant tests pass.

- [ ] **Step 2: Run reliability tests**

Run:

```bash
npm run test:reliability
```

Expected: all reliability tests pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0. Existing Vite chunk-size warning is acceptable.

- [ ] **Step 4: Manual browser scenarios**

Use the in-app browser at `http://localhost:5173/`.

Scenario 1:
```txt
hi
Denim jeans i raised from 500 to 600 per piece. I bought it for 400 and competitor has 550. After doing 600 sales went up 25 percent but customers went down 10 percent.
```
Expected: repair or factual summary, no word-salad title, no Action Plan before confirmation.

Scenario 2:
```txt
yes
```
Expected: Action Plan appears only after confirmed summary.

Scenario 3:
```txt
yes but cost is 380
```
Expected: no save/advice from stale data; cost updates and summary repeats.

Scenario 4:
```txt
forget denim jeans, rice from 80 to 100 cost 60
```
Expected: draft resets to rice; no denim facts carry over.

---

## Implementation Notes

- Keep deterministic repair and factual summary text. This is intentional; these turns are trust-critical.
- Mistral can write final advice after confirmation, but cannot override server facts.
- Do not add a new `advised_not_saved` stage. Use `context.saveDeclined`.
- Avoid broad rewrites. This is a trust-layer feature, not a UI redesign.
- Commit after each task when implementing: tests first, implementation second, verification third.
