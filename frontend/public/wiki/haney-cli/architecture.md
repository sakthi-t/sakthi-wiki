# Haney CLI — Architecture

## How Haney Works Under the Hood

Haney's architecture is a pipeline that flows from your terminal input through several processing layers before reaching an LLM provider and returning a response. Let me walk you through each layer.

## The Big Picture

```
Terminal Input
     │
     ▼
ChatSession ──→ Project Context ──→ File Context ──→ Tool Manager
     │                                                  │
     │                                            LiteLLM ◄── Tools
     │                                                  │
     ▼                                          ┌───────┼───────┐
Streamed Output                                 ▼       ▼       ▼
                                           OpenAI  DeepSeek  Anthropic
```

At the highest level, you type something in the terminal, Haney enriches it with project context (your plan.md, memory.md, etc.) and any attached files, then sends it to the LLM with available tool definitions. The model can call tools (read, write, edit, shell, search), and the results feed back into the conversation.

## The Key Components

### ChatSession — The Brain

`chat.py` orchestrates the entire read-eval-print loop. It manages the conversation state, handles streaming responses from the LLM, coordinates tool execution, and maintains the message history. Think of it as the conductor of an orchestra — it doesn't play every instrument, but it makes sure everyone is in sync.

### Project Context — The Eyes

`project_context.py` automatically discovers project files like plan.md, memory.md, summary.md, and README.md. These are injected into every LLM request as system prompt context. The model always knows what project you're working on and what conventions you've established. No manual uploading needed.

### File Context — The Hands

`file_context.py` handles the `@filename` attachment syntax. When you type `@main.py` in your message, this module resolves the path, reads the file, estimates token counts, and injects the content into context. It supports 119+ file extensions and can handle multiple files simultaneously.

### Tool Manager — The Toolbox

`tools/tool_manager.py` is the safety gatekeeper. Every tool call from the LLM goes through mode guards (PLAN blocks writes), permission checks (ASK/SAVE/AUTO), and path containment validation before execution. The actual file and shell operations live in `tools/file_tools.py` and `tools/shell_tools.py`.

### LiteLLM Integration — The Bridge

`providers.py` and `llm.py` handle the connection to LLM providers through LiteLLM. This abstraction gives Haney access to 6+ providers with a unified API. When you run `/models`, it live-fetches the available models from the provider's API. Thinking modes are unified across providers — you set `/think high` and Haney translates that to the appropriate parameters for each provider.

### The Command System — The Control Panel

30 slash-commands organized across 12 modules in `commands/`. Each command is a dataclass with a name, description, and handler function. The dispatch system in `__init__.py` routes user input to the right handler. Commands cover provider management, mode switching, project awareness, session management, memory, and system utilities.

## File Structure

The codebase follows a clean separation of concerns:

```
haney/
├── cli.py              # Typer CLI app entry point
├── chat.py             # Read-eval loop + conversation orchestrator
├── commands/           # 30 slash-command handlers (12 modules)
├── llm.py              # ChatSession + streaming logic
├── providers.py        # Provider registry + live model fetching
├── config_bootstrap.py # Single-source config schema
├── project_context.py  # Project file discovery + injection
├── file_context.py     # @file attachment parsing
├── session_manager.py  # Session lifecycle + persistence
├── search.py           # Exa search integration
├── thinking_manager.py # Unified thinking mode abstraction
├── mode_manager.py     # PLAN/EDIT mode guard
├── permission_manager.py # ASK/SAVE/AUTO approval
├── tools/              # File + shell tool implementations
├── mcp/                # Model Context Protocol (10 servers)
└── ui/                 # Terminal composer + status bar
```

## Design Philosophy in Practice

What makes this architecture special isn't any individual component — it's how they work together. The configuration bootstrap ensures every setting has a default. The mode manager and permission manager form a two-layer safety system. The project context injection means the model always has up-to-date knowledge. And the streaming output with Rich Markdown rendering makes the experience feel responsive and informative.

Every component is independently testable and replaceable. Want a different search provider? Swap `search.py`. Want a different UI? Replace the composer. The modular design means Haney can evolve without rewrites.
