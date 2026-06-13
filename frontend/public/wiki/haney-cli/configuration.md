# Haney CLI — Configuration

## Configuration-Driven by Design

Everything about Haney's behavior is controlled by a single JSON file: `.haney/config.json`. There are no hardcoded limits buried in source code. If you want to change how Haney behaves, you change the config — or use the slash-commands that update it for you.

## The Philosophy

The configuration system follows five principles:

1. **Single Source of Truth.** All configurable values are declared in `config_bootstrap.py`'s `CONFIG_SCHEMA` dictionary. This is the canonical reference — there's no second place where settings are defined.

2. **Auto-Population.** On every startup, `bootstrap_config()` reads your existing config and adds any missing keys with sensible defaults. When a new Haney version introduces new settings, your config is automatically updated. You never need to manually add keys.

3. **Never Overwrite.** Existing values are preserved. Only missing keys get defaults. Your settings are always respected.

4. **Null Means Unlimited.** Numeric limits set to `null` are treated as "no limit enforced." This gives you the flexibility to remove constraints entirely.

5. **No Hidden Limits.** At runtime, code reads from the config. There are no hardcoded fallback values hiding in functions.

## The Config Schema

Here's what a typical config looks like:

```json
{
  "active_provider": "openai",
  "active_model": "gpt-5.4",
  "providers": {},
  "mode": "plan",
  "thinking_mode": "medium",
  "permission_mode": "ask",
  "web_search": true,
  "search_provider": "exa",
  "max_tool_calls": 20,
  "max_attachment_tokens": 10000,
  "max_context_tokens": null,
  "ui": {
    "sticky_input": true,
    "input_bottom_padding": 2,
    "show_status_bar": true
  }
}
```

## What Each Setting Does

**Provider Settings:** `active_provider` and `active_model` track your current connection. `providers` stores API keys (set via `/login`, never committed to git).

**Mode Settings:** `mode` switches between `"plan"` (discussion only) and `"edit"` (tools enabled). `thinking_mode` controls reasoning depth — `"off"`, `"low"`, `"medium"`, or `"high"`. `permission_mode` sets approval behavior — `"ask"`, `"save"`, or `"auto"`.

**Search Settings:** `web_search` enables or disables automatic web search enrichment. `search_provider` selects the search backend (currently Exa).

**Limit Settings:** `max_tool_calls` caps how many tools the LLM can call in sequence per message. `max_attachment_tokens` limits attached file content size. `max_context_tokens` sets an overall context ceiling. All accept `null` for unlimited.

**UI Settings:** Control the sticky input bar, padding, and status bar visibility. The status bar shows your current model, thinking mode, mode, permission level, search status, cost, and context size — all at a glance.

## API Key Management

Keys can be provided three ways, checked in priority order:

1. **Config file** — via `/login <provider>`. Stored encrypted-style in `providers.<name>.api_key`.
2. **Environment variables** — `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, etc.
3. **Exa search key** — via `/login exa` or the `EXA_API_KEY` environment variable.

When displayed, keys are masked (e.g., `sk-pr...Xwx0A`). You can see enough to identify the key without exposing it.

## The Bootstrap Process

Every time Haney starts, this sequence runs:

1. Load `.haney/config.json`
2. Iterate over `CONFIG_SCHEMA` (the canonical key list)
3. For each missing key, insert the default value
4. If keys were added, save and print a notice
5. Return the complete config

This elegant approach means Haney is always backward-compatible. New versions can add config keys without breaking existing installations. Your old config just gets the new defaults.

## Why Configuration-Driven Matters

Most AI coding tools hide their operational parameters. You don't know the context limit, the tool call cap, or the temperature settings. If you hit a limit, you get a cryptic error — or worse, silent truncation.

Haney makes every limit explicit and adjustable. If you need the LLM to call 200 tools in sequence for a complex refactoring, set `max_tool_calls` to 200. If you want deterministic output for a critical task, set thinking to `off`. If you want zero guardrails for an automated workflow, set permission to `auto`.

The power is in your hands, and the config file makes that power visible.
