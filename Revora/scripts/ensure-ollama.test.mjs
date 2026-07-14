import assert from "node:assert/strict";
import { ensureOllama, normalizeOllamaBaseUrl } from "./ensure-ollama.mjs";

async function test(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

await test("normalizeOllamaBaseUrl derives host from generate endpoint", () => {
  assert.equal(
    normalizeOllamaBaseUrl("http://127.0.0.1:11434/api/generate"),
    "http://127.0.0.1:11434"
  );
});

await test("ensureOllama does not spawn when Ollama is already reachable", async () => {
  let spawnCalled = false;
  const result = await ensureOllama({
    fetchImpl: async () => ({ ok: true }),
    spawnImpl: () => {
      spawnCalled = true;
      throw new Error("spawn should not be called");
    },
    log: () => {}
  });

  assert.equal(result.status, "already-running");
  assert.equal(spawnCalled, false);
});
