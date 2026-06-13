# Haney CLI — Tool System

## Tools As the LLM's Hands

An AI coding assistant that can only chat is a consultant. One that can read files, write code, and run commands is a collaborator. Haney's tool system gives the LLM practical agency — but with multiple layers of safety to ensure that agency is always under your control.

## The Five-Layer Safety Pipeline

When the LLM requests a tool call, it goes through five distinct safety checks before anything happens:

```
LLM requests tool
  │
  ▼
1. Handler lookup          → Unknown tool? Error.
2. Mode guard (PLAN/EDIT)  → PLAN mode? Block write tools.
3. Permission check        → ASK/SAVE/AUTO approval
4. User confirmation       → Rich panel + [y/n] prompt
5. Tool execution          → file_tools.py or shell_tools.py
  │
  ▼
Result feeds back to LLM conversation
```

### Layer 1: Handler Lookup

The tool name is validated against the tool registry. Unknown tools are rejected immediately.

### Layer 2: Mode Guard

In PLAN mode, the LLM only sees `read_file` and `list_directory` in its available tools. Write tools like `write_file`, `edit_file`, `delete_file`, and `run_shell_command` are filtered from the tool definitions before they even reach the model. But if one somehow gets through, the mode guard at execution time blocks it with a clear message suggesting you switch to EDIT mode.

### Layer 3: Permission Check

This is where the ASK/SAVE/AUTO modes come in. ASK prompts for every modifying action. SAVE remembers your approval for the session (prompt once per tool type). AUTO auto-approves — but dangerous shell commands are still checked in the next layer.

### Layer 4: User Confirmation

When a tool needs approval, you see a Rich panel showing exactly what will happen. For file writes, you see the file path, content size, and line count. For edits, you see the exact diff — the text being found and what it's being replaced with. You type `y` or `n` to proceed.

### Layer 5: Tool Execution

The actual operation happens here. File tools use path containment — all paths are resolved relative to the project root, and any path that tries to escape (like `../../../etc/passwd`) is rejected.

## The Six Available Tools

**read_file** — Reads a file's contents. Auto-approved in all modes, available even in PLAN mode.

**write_file** — Creates or overwrites a file. Creates parent directories automatically if they don't exist.

**edit_file** — Replaces text in a file using exact string matching. Shows the diff before executing.

**rename_file** — Renames or moves a file within the project.

**delete_file** — Moves a file to `.haney/trash/`. Never permanently deletes. Name collisions are handled with numeric suffixes. Recovery is as simple as `/restore old_file.py`.

**list_directory** — Lists files and directories. Auto-approved, available in all modes.

**run_shell_command** — Executes safe shell commands. Goes through dual whitelist/blacklist checking.

## Shell Safety

Shell commands are the most powerful and most dangerous tool. Haney uses a combined whitelist and blacklist approach:

The **whitelist** allows common development commands: `pwd`, `ls`, `cat`, `grep`, `echo`, `git`, `python`, `pip`, `npm`, `node`, and similar.

The **blacklist** blocks dangerous patterns regardless of the base command: `rm`, `sudo`, `shutdown`, `reboot`, `mkfs`, `dd`, `chmod 777`, `wget ... | sh`, `curl ... | sh`, redirects to `/dev/`, `kill`, `fdisk`, `mount`, `iptables`.

A whitelist alone is too restrictive (blocks useful commands). A blacklist alone is too permissive (misses dangerous variants). Combined, they provide both flexibility and safety.

## The Tool Execution Loop

When the LLM returns tool calls, Haney enters a loop:

1. Stream the completion and accumulate tool calls
2. Display `⚙ Calling N tool(s)…`
3. Execute each tool through the safety pipeline
4. Append tool results back to the conversation
5. Re-call the LLM with the new context
6. Continue until no more tool calls or `max_tool_calls` is reached
7. Stream the final answer

The loop limit is configurable — set `max_tool_calls` to whatever makes sense for your workflow.

## Why This Design

The tool system reflects a core belief: **AI agents should be capable but never autonomous by default.** Every modifying action requires your awareness. The defaults are safe (PLAN mode, ASK permission). You intentionally choose to increase capability by switching to EDIT mode or relaxing permissions.

The trash system embodies this philosophy perfectly. Haney could delete files permanently — it's simpler to implement. But by choosing to move files to trash instead, Haney protects you from accidents. Safety isn't an afterthought — it's built into every tool's design.
