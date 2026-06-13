# Haney CLI — Lessons Learned

Building a terminal-based AI coding assistant from scratch teaches you things that using one never will. Here are the key lessons from developing Haney.

## Lesson 1: Streaming Is Worth the Complexity

Implementing streaming LLM responses with Rich Markdown rendering was technically challenging — you're parsing partial Markdown blocks, handling code fences mid-stream, and managing cursor positions. But the user experience difference between streaming and waiting for a complete response is night and day.

Streaming makes the AI feel responsive and alive. You see the model thinking in real time. If it's going in the wrong direction, you can interrupt early. The psychological difference between "waiting 30 seconds for a response" and "watching the response build over 30 seconds" is enormous — even though they take the same total time.

**Takeaway:** Always stream. The engineering cost is a one-time investment. The user experience benefit is permanent.

## Lesson 2: Safety Layers Must Be Independent

The safety system uses five layers: handler lookup, mode guard, permission check, user confirmation, and tool execution. Each layer operates independently. The mode guard doesn't assume the permission check will catch something. The tool execution doesn't assume the mode guard already blocked something.

Redundant safety checks might seem unnecessary in normal operation. But they matter when something unexpected happens — a tool definition filter fails, a mode switch has a race condition, a permission cache gets stale. Independent layers mean a single failure never compromises safety.

**Takeaway:** Safety-critical systems should have overlapping, independent checks. No single layer should be the only thing standing between the user and a mistake.

## Lesson 3: Configuration Auto-Population Prevents Breakage

Version 1 of Haney had a fixed config schema. When version 2 added new keys, existing configs would break — missing keys caused crashes. The solution was the bootstrap process: on every startup, read the existing config, compare against the schema, add missing keys with defaults, but never overwrite existing values.

This simple change eliminated an entire category of upgrade pain. Users never need to manually update their config files. New versions can add as many keys as needed without breaking existing installations.

**Takeaway:** Config schemas should be forward-compatible by design. Auto-population with sensible defaults is far better than requiring users to manually migrate.

## Lesson 4: The Cat Theme Matters

This sounds trivial, but naming the assistant "Haney" after an apartment cat and including cat ASCII art had a surprisingly large impact. It made the project approachable. Users smiled at the cat. The personality made people more forgiving of bugs and more willing to provide feedback.

In a space dominated by serious, corporate AI tools, a cat-themed assistant stands out. It signals that this tool is built by a human, for humans — not by a committee trying to maximize enterprise adoption.

**Takeaway:** Personality matters in developer tools. A small touch of whimsy — an ASCII cat, a friendly name, a playful tone — makes the tool memorable and human.

## Lesson 5: LiteLLM Abstraction Is Both a Blessing and a Curse

Using LiteLLM to support 6+ providers through a unified API was the right decision — it saved months of integration work. But it also means Haney inherits LiteLLM's limitations. When a provider releases a new model with a new API parameter, Haney can't use it until LiteLLM adds support. When LiteLLM has a bug in its streaming implementation, Haney users experience it.

The lesson isn't to avoid abstractions — it's to understand their cost. Every abstraction layer is a dependency that can limit you. Choose abstractions that solve more problems than they create.

**Takeaway:** Dependencies solve problems today but can become limitations tomorrow. Choose carefully and monitor their health.

## Lesson 6: Users Want Control, Not Just Automation

The most requested features weren't about making Haney do more automatically — they were about giving users more control. Custom configurable limits. Per-project settings. The ability to see and approve every tool call. Users don't want an AI that operates autonomously in the background. They want an AI that amplifies their capabilities while keeping them in the loop.

This insight shaped Haney's entire design philosophy: transparency, configurability, and user control are features, not constraints.

**Takeaway:** Build tools that empower users, not tools that replace them. Give users visibility into what's happening and control over what happens next.

## Lesson 7: Start Simple, Compound Gradually

The initial version of Haney had 5 commands, 1 provider, and a basic read-eval-print loop. Each subsequent version added capabilities incrementally — more commands, more providers, the tool system, MCP integration, the memory system. No version was a complete rewrite.

This incremental approach meant each feature was tested in isolation. Bugs were caught early. The architecture evolved to accommodate new capabilities without collapsing under their weight.

**Takeaway:** Complex systems that work evolved from simple systems that worked. Start with the smallest useful thing and grow it one feature at a time.
