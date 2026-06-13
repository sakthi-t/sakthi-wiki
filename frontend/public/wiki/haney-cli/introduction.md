# Haney CLI — Introduction

## What Is Haney?

Haney is a terminal-based AI coding assistant that lives entirely in your command line. Think of it as having a smart, cat-themed developer buddy who can read your project files, write and edit code, run shell commands, and have deep technical conversations — all from the comfort of your terminal.

Named after an apartment cat, Haney embodies the philosophy that developer tools should be transparent, configurable, and respectful of your workflow. No browser tabs, no Electron apps, no context switching. Just you, your terminal, and a helpful assistant.

```text
 /\_/\
( o.o )
 > ^ <

Haney Meow!
```

## Why Haney Exists

Most AI coding assistants are black boxes. You type something, magic happens, and code appears. But you don't know what the model is thinking, what tools it's calling, how much each interaction costs, or what limits are being imposed behind the scenes.

Haney takes the opposite approach. Every tool call is visible. Every permission is configurable. Every cost is tracked. The entire system is driven by a single JSON configuration file that you control. Nothing is hidden.

The core insight is simple: **developers deserve to understand what their AI tools are doing.** When an LLM reads your file, you see it. When it wants to write something, you approve it. When it calls a shell command, you know exactly which command and why.

## What Makes Haney Different

Haney stands apart from other coding assistants in five key ways:

**Transparency by Design.** The LLM's output streams live to your terminal as rendered Markdown. Tool calls show inline status indicators — you always know what's happening. Every interaction has a cost estimate so you're never surprised by API bills.

**Configuration-Driven Architecture.** Every behavior lives in `.haney/config.json`. Change limits, modes, and providers without touching Python code. Missing keys are auto-populated with sensible defaults — your config is always complete.

**Safety-First Tool System.** Haney has a PLAN mode for discussion (all write tools blocked) and an EDIT mode for real work (with configurable approval). File deletions go to trash, never permanent. Dangerous shell commands are always blocked, even in auto-approve mode.

**Local-First Philosophy.** Your project context, session history, and memory files live in `.haney/` — a hidden directory in your project. No cloud dependency for core features. Your data stays with you.

**Provider-Agnostic.** Through LiteLLM, Haney connects to OpenAI, Anthropic, DeepSeek, Gemini, Groq, and OpenRouter. Switch providers with a single command. No vendor lock-in.

## Who This Is For

Haney is built for developers who:

- Live in the terminal and want their AI tools there too
- Care about understanding what their tools are doing
- Want control over costs, permissions, and behavior
- Work on projects where code quality and safety matter
- Prefer configuration over convention

If you've used ChatGPT for coding and found it helpful but opaque, or used Copilot and wanted more control, Haney is designed for you.
