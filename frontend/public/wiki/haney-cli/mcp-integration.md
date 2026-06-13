# Haney CLI — MCP Integration

## What Is MCP?

MCP stands for Model Context Protocol — an open standard that lets AI assistants connect to external tools and data sources through a standardized interface. Think of it as a universal adapter that lets Haney talk to GitHub, search the web, browse documentation, control a browser, and more.

## How Haney Implements MCP

Haney connects to MCP servers as subprocesses that communicate over standard input/output using JSON-RPC 2.0. Each server runs as a separate process, and tools from different servers are namespaced to prevent conflicts. A GitHub tool becomes `mcp__github__create_issue` and a Tavily search tool becomes `mcp__tavily__tavily_search`.

The architecture works like this:

```
Config (server_configs.py)
    │
    ▼
ServerManager ──→ Transport (subprocess stdio)
    │                  │
    ▼                  ▼
ToolAdapter ←── MCP tools → LiteLLM schema
    │
    ▼
ToolManager ──→ LLM function calling
    │
    ▼
PermissionManager (ASK/SAVE/AUTO)
```

Server configurations are declared in `server_configs.py` as structured data. When you run `/mcp connect github`, the ServerManager spawns a subprocess using the Transport layer. The Client sends JSON-RPC 2.0 requests over stdio, and the ToolAdapter converts MCP tool schemas into LiteLLM's function-calling format. From there, tools flow through Haney's normal safety pipeline — mode guards, permission checks, and execution.

## Available Servers

Haney supports 10 MCP servers:

- **GitHub** — Repository management, issues, PRs, commits, code search, file operations. Requires OAuth authentication.
- **DuckDuckGo** — Anonymous web search with no API key or tracking.
- **Stack Overflow** — Lexical search for questions, answers, and comments.
- **MDN Web Docs** — CSS, JavaScript, HTML, API, and browser compatibility documentation.
- **Filesystem** — Secure file operations constrained to allowed paths.
- **Sequential Thinking** — Structured step-by-step reasoning with revision tracking and branching.
- **LangChain** — LangChain and LangGraph documentation search.
- **Playwright** — Headless browser automation — navigation, screenshots, form filling, JavaScript evaluation.
- **Tavily** — AI-optimized web search and content extraction via HTTP transport.
- **Notion** — Workspace integration — search pages, read/write databases, manage comments.

## Security Considerations

MCP tools are treated like any other Haney tool — they go through the full safety pipeline. They're only available in EDIT mode (not PLAN). Permission checks apply — ASK prompts for each use, SAVE remembers approvals, AUTO auto-approves (but dangerous operations are still blocked).

Credentials are stored in `.haney/config.json` and never committed. For GitHub, authentication uses the OAuth device flow — you authorize in your browser, never typing a token into the terminal. Each server can have custom environment variables via the `extra_env` config field.

## Why MCP Matters

Before MCP, every AI tool integration was custom-built. Each developer had to write provider-specific code, handle authentication differently, and maintain separate integration paths. MCP standardizes this. When a new MCP server is released, Haney can integrate it by adding a config entry — no new code needed for the integration pattern itself.

It's the difference between having a universal power outlet and needing a custom adapter for every device. MCP is the universal outlet, and Haney is built to plug into it.
