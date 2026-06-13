# Haney CLI — Commands

## The Slash-Command System

Haney provides 30 slash-commands that give you complete control over the assistant. Every command starts with `/` and is routed through a dispatch system that maps command names to handler functions. Commands are organized across 12 modules, each handling a specific domain.

## Provider & Model Commands

These commands manage your connection to LLM providers.

**Connecting a Provider:**
When you run `/login openai`, Haney prompts you for an API key (masked as you type). The key is stored in `.haney/config.json` under `providers.openai.api_key`. You can connect multiple providers simultaneously and switch between them freely.

**Listing Models:**
`/models` fetches the live model list from the provider's API. This means you always see currently available models — no stale hardcoded lists. If you're offline or not logged in, it falls back to curated defaults.

**Switching Models:**
`/model gpt-5.4` changes the active model immediately. Run `/model` without arguments to see your current configuration: provider, model name, thinking mode, and search status.

**Checking Status:**
`/provider` shows a full status table — provider name, API base URL, connection state, masked API key, and active model.

## Thinking & Execution Modes

These are where Haney gives you fine-grained control over how the LLM operates.

**Thinking Modes** control reasoning depth:
- `off` — Temperature 0, deterministic output
- `low` — Temperature 0.2, minimal variation
- `medium` — Default, balanced
- `high` — Extended reasoning (OpenAI: `reasoning_effort=high`, Anthropic: thinking budget of 4000 tokens)

The beauty here is the unified abstraction. You don't need to know provider-specific parameters. Set `/think high` and Haney translates it appropriately whether you're using OpenAI, Anthropic, or DeepSeek.

**PLAN vs EDIT Modes** are the safety backbone:
- **PLAN** (default) — Discussion only. The LLM can read files and list directories, but all write tools are hidden from the model entirely. Even if the model somehow requests a write, the mode guard blocks it.
- **EDIT** — Full tool access. All tools are available, subject to permission checks.

**Permission Modes** control approval requirements:
- **ASK** — Prompt for every modifying action (default, safest)
- **SAVE** — Remember approvals per tool type for the session
- **AUTO** — Auto-approve non-dangerous tools (dangerous commands still blocked)

## Project Commands

These keep the model aware of your project context.

`/project` shows what Haney knows about your project — loaded files, missing files, context size, and last reload time.

`/reload` re-scans your project directory. Useful after editing plan.md or adding new files.

`/context` shows detailed metrics: file sizes, token estimates, priority levels, and a health indicator (Healthy under 4K tokens, Moderate at 4-8K, Large over 8K).

`/init` generates starter project files if they don't exist: plan.md at the project root, and memory.md, summary.md, and tasks.md in `.haney/`.

## File & Tool Commands

`/trash` lists files in `.haney/trash/`. Haney never permanently deletes — everything goes to trash first.

`/restore <file>` recovers a file from trash back to the project root.

`/attachments` shows currently attached files with sizes and token estimates.

## Session & Memory Commands

`/session` displays your current session: ID, provider, model, start time, message count, API calls, and cost.

`/stats` gives you a token and cost breakdown with per-call averages.

`/remember <text>` appends a bullet point to `.haney/memory.md`. This survives sessions — your conventions and preferences accumulate over time.

`/compact` is one of Haney's most powerful features. When your conversation gets long, it sends the history to the LLM with a summarization prompt, generates a concise summary in `.haney/summary.md`, and truncates the in-memory conversation. You typically see 70-85% token reduction.

## File Attachment Syntax

Not a command, but a core interaction pattern: use `@filename` anywhere in your message to attach files. Haney strips the `@` references from your visible message, loads the files, and injects them into the LLM's context. You can attach multiple files at once and use nested paths like `@src/utils/helper.py`.

## Why This Design Works

The command system is intentionally discoverable. Run `/help` to see everything. Each command has a clear, single purpose. The provider/model commands manage your AI connection, the mode/permission commands control safety, the project commands manage context, and the session/memory commands help you manage long-running work.

There are 30 commands, but you'll typically use only 5-6 regularly: `/login`, `/model`, `/edit`, `/compact`, `/remember`, and `/exit`. The rest are there when you need them.
