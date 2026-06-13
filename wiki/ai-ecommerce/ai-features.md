# AI Ecommerce — AI Features

## Voice Support Agent: Haney

The standout AI feature is the voice-enabled customer support agent. Unlike a text chatbot, Haney speaks with customers in natural voice, understands their questions, and provides contextually relevant answers.

### How the Voice Pipeline Works

The voice support system integrates four AI services:

**ElevenLabs (Text-to-Speech):** Converts Haney's text responses into natural-sounding speech. ElevenLabs was chosen for its expressive, human-like voice quality — important for customer service where tone affects user experience.

**Deepgram (Speech-to-Text):** Transcribes customer speech into text in real time. Deepgram provides low-latency transcription with good accuracy even on varied audio quality (phone calls, background noise).

**OpenAI GPT-4.1 (Reasoning):** The "brain" of the voice agent. GPT-4.1 processes the customer's transcribed question, considers the injected context (customer name, order history), and generates a helpful response. It was chosen over GPT-4o for its strong instruction-following and structured output capabilities.

**Vapi (Orchestration):** Connects everything. Vapi handles the WebRTC connection (the actual voice call), manages the TTS/STT pipeline, and provides the webhook infrastructure for post-call data delivery.

### Context Injection: Making Haney Smart

When a customer initiates a call, Django builds a context payload:

```json
{
  "customer_name": "Sakthivel T",
  "ctx_info": "Customer: Sakthivel T (sakthi@example.com)\n
               Order #ORD-001: 3 books, ₹1,200 — Delivered\n
               Order #ORD-002: 1 book, ₹450 — Processing\n
               Order #ORD-003: 2 books, ₹800 — Paid",
  "vapi_conversation_id": "conv_abc123"
}
```

This context is injected into the voice agent's system prompt via Vapi's `variableValues`. Haney "knows" the customer's complete order history before the first word is spoken.

This is what separates an AI agent from a generic voice bot. A generic bot would ask "Can I have your order number?" Haney can respond: "I can see your order #ORD-002 with one book is still processing. Is that the one you're asking about?"

### The Webhook: Capturing Everything

When a call ends, Vapi sends a webhook to Django with:

- **Transcript:** Every word spoken by customer and agent, with timestamps and speaker labels
- **Rating:** Customer's 1-5 rating (extracted via Vapi's structured output)
- **Summary:** AI-generated summary of the call (issue, resolution, outcome)
- **Duration:** Call length in seconds

All of this is stored in `SupportSession` and `TranscriptMessage` models. Admins can review every interaction, read full transcripts, see ratings, and monitor the quality of AI support.

## LLM-Powered Features Beyond Voice

### Order Confirmation Summaries

When an order is placed, the system generates a human-readable summary of the purchase. This is a simple but effective use of LLMs — turning structured order data into a friendly confirmation message.

### Future: Intent Classification

On the roadmap: classifying support call transcripts by intent (order inquiry, complaint, general question, product recommendation). This would enable:
- Trend analysis: "30% of calls are about shipping delays"
- Proactive improvements: Fix the most common pain points
- Agent training: See which intents Haney handles well vs. poorly

### Future: Sentiment Analysis

Analyzing transcript sentiment to detect frustrated customers, flag urgent issues, and measure overall satisfaction trends over time.

## The Admin Dashboard

The admin interface for AI features provides:

- **KPI boxes:** Average rating, total rated calls, total calls
- **Session list:** All support sessions with summary, rating, and timestamp
- **Transcript viewer:** Full conversation with customer/agent role labels
- **Session detail:** Duration, rating, feedback, AI-generated summary

This makes the AI support system measurable and manageable. It's not a black box — every interaction is recorded, scored, and reviewable.
