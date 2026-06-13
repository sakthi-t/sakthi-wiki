# Haney GPT — Project Overview

## Building a Language Model From Scratch

Haney Chat is a 537-million-parameter GPT-style language model built entirely from scratch using PyTorch. It was trained on a custom corpus of 517 million tokens combining conversational data, stories, and instruction-following examples.

## Why Build Another LLM?

There are dozens of open-source language models available. So why build one from scratch?

The answer is education. Reading papers about Transformers teaches you the theory. Fine-tuning existing models teaches you the application layer. But building a model from scratch — implementing the attention mechanism, designing the training loop, debugging vanishing gradients, managing GPU memory — teaches you how these systems actually work at every level.

This project follows the philosophy Andrej Karpathy popularized: to truly understand something, build it. After building Haney Chat, concepts like "attention heads," "residual connections," "layer normalization," and "mixed precision training" aren't abstract ideas — they're things you've implemented, debugged, and optimized.

## The Journey from 29M to 537M Parameters

Haney Chat didn't start at 537 million parameters. It evolved through progressively larger models:

| Model | Parameters | Purpose |
|-------|-----------|---------|
| TinyGPT | 29M | Proof of concept — does the architecture work? |
| TinyGPT | 76M | Scaling test — can we handle more parameters? |
| TinyGPT | 162M | Data pipeline validation — can we feed enough data? |
| Haney Chat | 354M | First "real" model — conversational quality emerges |
| Haney Chat | 537M | Production scale — coherent multi-paragraph generation |

Each stage validated a different aspect of the system. The 29M model proved the architecture was correct. The 76M and 162M models tested the data pipeline and training infrastructure. The 354M model showed that conversational quality emerges with scale. The 537M model pushed to the limits of available hardware.

## The Final Model

The 537M model has 24 transformer layers, 20 attention heads per layer, and an embedding dimension of 1280. It can process sequences of up to 1024 tokens and generates text one token at a time, predicting the next most likely word based on everything that came before.

Training ran on an NVIDIA L40S GPU with 46GB of VRAM using Lightning AI Studio. Mixed precision training with bfloat16 kept memory usage manageable while maintaining numerical stability.

## What the Model Can Do

Haney Chat generates coherent, contextually relevant text. Given a prompt like "Once upon a time," it produces complete stories with characters, settings, and narrative arcs. Given conversational prompts, it responds naturally — the training data included UltraChat, which taught it dialogue patterns.

The model isn't competitive with GPT-4 or Claude — that was never the goal. It's an educational achievement that demonstrates you can build a working language model with publicly available tools and datasets, understanding every component along the way.

## The Repository Structure

The project is organized into clean functional areas:

- `models/` — The Transformer architecture implementation
- `scripts/` — Training loop, data preparation, tokenization, and evaluation
- `data/` — Raw and processed datasets
- `tokenizer/` — GPT-2 tokenizer integration
- `checkpoints/` — Saved model states for resumption and inference

## The Educational Value

If you're an AI engineer or student, this project demonstrates that modern language models aren't magic. They're built from understandable components — embeddings, attention, feed-forward networks, layer normalization — that combine through training to produce coherent text. Understanding these components is the first step toward building, modifying, and improving your own models.
