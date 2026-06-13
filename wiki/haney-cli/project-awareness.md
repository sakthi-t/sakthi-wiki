# Haney CLI — Project Awareness

## Automatic Context, Zero Effort

Haney automatically discovers your project files and injects them into every LLM interaction. You don't need to manually attach files or remind the model what project you're working on. It just knows.

## How Discovery Works

At startup and whenever you run `/reload`, Haney's ProjectContextManager scans two locations:

1. **Project root** — for user-created files: `plan.md` and `README.md`. These are files you own, edit, and commit to git.

2. **`.haney/` directory** — for Haney-managed files: `memory.md`, `summary.md`, and `tasks.md`. These are generated and maintained by Haney.

Source files at the root (like `*.py`, `*.js`) are discovered and listed, but not injected into context. Injecting all source files would blow through token limits. Use `@file` syntax when you need the model to see specific source code.

## Priority Order

When building the context preamble, files are ordered by relevance:

| Priority | File | Why |
|----------|------|-----|
| 1 | `summary.md` | Most current — recent conversation state |
| 2 | `memory.md` | Persistent project knowledge |
| 3 | `plan.md` | Project roadmap and architecture |
| 4 | `README.md` | Project documentation |

The preamble is injected into the system prompt as structured markdown. The model sees file names, sizes, and token estimates — it knows exactly what context it has available.

## The Three Context Commands

**`/project`** shows your project status at a glance — project name, awareness status (enabled/disabled), which files are loaded, which are missing, and your current context size.

**`/reload`** re-scans the project directory and refreshes the file cache. Use this after editing plan.md or adding new project files. It recalculates token estimates so your context metrics stay accurate.

**`/context`** shows detailed metrics in a table: each file's size, estimated token count, and priority level, plus a health indicator. Under 4,000 tokens is "Healthy"; 4,000-8,000 is "Moderate"; over 8,000 is "Large" and suggests running `/compact`.

**`/init`** generates missing starter files without overwriting anything that already exists. It creates `plan.md` at the project root and `memory.md`, `summary.md`, and `tasks.md` in `.haney/`.

## Token Estimation

Haney uses a simple character-based estimate: `tokens ≈ characters / 4`. This isn't precise enough for billing, but it's perfectly adequate for context health monitoring. You can see at a glance whether your context is getting bloated and needs compaction.

## The Design Rationale

**Why auto-discovery instead of manual attachment?** Manual attachment (`@file`) exists for ad-hoc needs, but for project-wide context, auto-discovery means the model always sees the latest state. You never forget to attach plan.md — it's always there. The model always knows your conventions from memory.md — no need to restate them.

**Why inject into system prompt instead of user message?** System prompt injection means the model treats project context as authoritative background knowledge. When context is in the user message, the model sometimes responds with "as mentioned in your project context..." — awkward and redundant. In the system prompt, the knowledge is seamless.

**Why source files aren't auto-injected?** A typical project might have hundreds of source files totaling megabytes. Injecting them all would consume your entire context window before you even ask a question. The file listing is available for reference, and `@file` syntax lets you pull in specific files when the model needs them.

## What This Enables

Project awareness transforms Haney from a generic chatbot into a project-aware assistant. The model knows your codebase conventions without being told. It remembers your architectural decisions across sessions. It understands what you're building and why. This context compound interest — the more you work with Haney, the more helpful it becomes, because it has more accumulated knowledge about your project.
