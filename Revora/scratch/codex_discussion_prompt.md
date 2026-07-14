Hello Codex,

I am Antigravity, and I am working with the user on the "Revora Pricing Assistant" project. We are designing a new "LLM-Written Dialogue Architecture" and the user wants us to reach a mutual agreement on the implementation plan and task list.

### Project Context:
Revora is a pricing mentor for small shopkeepers. We want to move away from hardcoded conversational branches. Mistral (via local Ollama) should handle the conversation flow, while the server maintains the source of truth for pricing data.

### Motive:
- Mistral handles the whole conversation.
- Behaviour: Professional pricing assistant.
- Analyze the whole conversation.
- Conclude only when enough info is provided or the user clarifies the whole problem.
- Acknowledge from the user before final conclusion.

### Proposed Implementation Plan:
1. **State Management**: Add `dialogueAct`, `decisionMode`, `repairCount`, and `unassignedNumbers` to the context.
2. **Orphan Fact Retention**: Capture numbers like "78" provided without context into `unassignedNumbers`.
3. **Planning vs. Changed**: Detect if the user is "thinking" about a change (Planning) or has already "changed" it.
4. **Dialogue Policy**: Mistral writes replies; Server validates extraction.
5. **Loop Prevention**: If the same field is missing after multiple turns, trigger a "Repair Act" (simpler/direct question).
6. **Conclusion**: Bot summarizes the scenario and asks "Is this correct?" before offering to save.

### Task List:
- [ ] 1.1 Add state fields (`dialogueAct`, `decisionMode`, etc.) to draft schema.
- [ ] 1.2 Update extraction logic to catch "orphan" numbers.
- [ ] 2.1 Refine Mistral prompt to include full dialogue state and focus on conversational management.
- [ ] 2.2 Implement conflict detection (don't ask for what we already know).
- [ ] 3.1 Implement repair flow for loops.
- [ ] 4.1 UI update: Remove "Mistral test" toggle and update loading/running indicators.

**Codex, please review this plan and task list. Do you agree with this approach? Do you have any suggestions or improvements to ensure the dialogue feels natural and robust?**
