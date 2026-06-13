# Haney CLI — Design Decisions

Every software project is a series of tradeoffs. Here are the key decisions that shaped Haney's architecture and why they were made.

## Decision 1: Configuration-Driven Over Hardcoded

**The choice:** Put every operational parameter in a JSON config file instead of hardcoding values in Python source.

**Why:** Most AI tools have hidden limits — maximum tool calls, token thresholds, temperature settings — buried in source code. You hit a limit and get a cryptic error, with no way to change it. By externalizing all behavior into `.haney/config.json`, Haney gives you full visibility and control. The auto-bootstrap process ensures backward compatibility when new keys are added in future versions.

**The tradeoff:** Configuration-driven code is slightly more complex to write — every value must be read from config at runtime. But the user experience benefit far outweighs this one-time development cost.

## Decision 2: PLAN/EDIT Mode Separation

**The choice:** Two distinct execution modes — PLAN for discussion (write tools hidden from the model) and EDIT for real work (tools available with approval).

**Why:** Most AI coding assistants either block everything or allow everything. Haney's two-mode system means you can have long architectural discussions without worrying about accidental file modifications. When you're ready to code, you intentionally switch to EDIT mode. This makes the safety boundary explicit and user-controlled.

**The tradeoff:** It's an extra step — you need to run `/edit` before the model can write code. But this friction is intentional. It creates a moment of mindfulness: "I'm now switching from thinking to doing."

## Decision 3: Trash-Based Deletion

**The choice:** Never permanently delete files. Always move to `.haney/trash/` instead.

**Why:** LLMs make mistakes. They might delete the wrong file, misinterpret an instruction, or have a hallucination that leads to data loss. Trash-based deletion means no deletion is permanent without explicit user action outside of Haney. You can always recover with `/restore`.

**The tradeoff:** Trash accumulates and needs occasional manual cleanup. But this is a feature, not a bug — it forces you to review what was deleted before it's truly gone.

## Decision 4: Provider-Agnostic via LiteLLM

**The choice:** Use LiteLLM as an abstraction layer rather than integrating with providers directly.

**Why:** The LLM provider landscape changes rapidly. A direct integration with OpenAI would lock Haney into one ecosystem. LiteLLM provides a unified API across 6+ providers with consistent streaming, tool calling, and thinking mode abstractions. You can switch from OpenAI to DeepSeek to Anthropic with a single command.

**The tradeoff:** LiteLLM adds a dependency and an abstraction layer. If LiteLLM has a bug or lags behind a provider's API changes, Haney is affected. But the alternative — maintaining 6 separate provider integrations — would be far more complex and fragile.

## Decision 5: Vector-Free Memory

**The choice:** Use raw markdown files injected into the system prompt instead of embedding-based retrieval.

**Why:** Vector databases add significant complexity — embedding models, chunking strategies, retrieval pipelines, and storage infrastructure. For project-level context (a few files totaling a few thousand tokens), raw text injection is simpler, faster, more transparent, and completely sufficient. The model reads your memory.md directly — no retrieval step, no information loss, no hallucinated chunks.

**The tradeoff:** This approach doesn't scale to hundreds of documents. But that's not the use case — Haney is for project context, not enterprise knowledge bases. If you need that, there are other tools.

## Decision 6: 30 Commands Organized Across 12 Modules

**The choice:** A modular command system with each module handling a specific domain.

**Why:** As Haney grows, new commands can be added by creating a new module or extending an existing one — no changes to the core dispatch system. Each module has clear ownership: provider commands, mode commands, project commands, tool commands, session commands, memory commands, MCP commands, system commands. This separation makes the codebase navigable and maintainable.

**The tradeoff:** 30 commands is a lot to learn. But they're discoverable through `/help`, and most users only need 5-6 regularly.

## Decision 7: Terminal-Native, No GUI

**The choice:** Stay in the terminal. No browser, no Electron, no desktop app.

**Why:** The terminal is the developer's home. Adding a GUI means context switching, additional dependencies, and a different interaction model. The terminal provides keyboard-driven efficiency, composability with Unix tools, and a distraction-free environment. The Rich library makes the terminal experience feel modern with streaming Markdown, styled panels, and a sticky status bar — without leaving the command line.

**The tradeoff:** Terminal-only limits the audience to developers comfortable with the command line. But that's the target audience — developers building software.
