# Haney GPT — Model Architecture

## The Transformer, Explained Through Implementation

Haney Chat uses a decoder-only Transformer architecture — the same family as GPT-2, GPT-3, and GPT-4. But instead of reading about it in a paper, let's walk through how it's actually built in code.

## The Big Picture

A language model's job is simple to describe but complex to implement: given a sequence of tokens, predict the next token. The Transformer architecture solves this by processing tokens through a stack of identical blocks, each containing two key operations: self-attention (understanding relationships between tokens) and a feed-forward network (processing each token's representation).

Haney Chat uses 24 of these blocks stacked on top of each other. Information flows from the input, through each block, and finally through a projection layer that outputs probabilities for every possible next token.

## The Configuration — One Place for All Hyperparameters

The entire model is configured through a single `GPTConfig` dataclass. This is a pattern worth adopting in your own projects — put all hyperparameters in one place:

- **vocab_size: 50,257** — The GPT-2 tokenizer vocabulary. Every possible token the model can predict.
- **block_size: 512** — The maximum sequence length (context window). The model can look back at up to 512 tokens.
- **n_layer: 24** — Number of transformer blocks. More layers = more capacity, more compute.
- **n_head: 20** — Number of attention heads per layer. Each head learns different relationship patterns.
- **n_embd: 1280** — The embedding dimension. Every token is represented as a 1280-dimensional vector. This is the "width" of the model.

The key constraint is that `n_embd` must be divisible by `n_head`. With 1280 / 20 = 64, each attention head works with 64-dimensional vectors internally.

## Token and Position Embeddings — Giving the Model Eyes

Before any processing happens, input tokens need to become numbers the model can work with:

**Token embeddings** (`wte`): A lookup table that maps each token ID to a learned vector of size 1280. When the model sees token #1234, it retrieves the 1234th row of this embedding matrix.

**Position embeddings** (`wpe`): A second lookup table that tells the model *where* each token is in the sequence. Without this, the model would see a "bag of words" — it couldn't distinguish "dog bites man" from "man bites dog." Positions 0 through 511 each have a learned 1280-dimensional vector.

The actual input to the first transformer block is simply: `token_embedding + position_embedding`. That's it. No complex preprocessing — just addition of the two representations.

## Causal Self-Attention — The Heart of the Transformer

This is where the magic happens. Self-attention lets each token "look at" every other token in the sequence and decide which ones are relevant. "Causal" means each token can only look at tokens that come before it — no peeking at the future.

Here's the step-by-step:

1. **Project to Q, K, V:** Each token's 1280-dimensional vector is projected into three separate vectors — Query (what am I looking for?), Key (what do I contain?), and Value (what information do I offer?). The projection uses a single linear layer that outputs 3 × 1280 = 3840 dimensions, then splits into Q, K, and V.

2. **Reshape for multi-head:** The 1280-dimensional Q, K, V are split across 20 heads, giving each head 64-dimensional sub-vectors. Each head operates independently.

3. **Compute attention scores:** For each pair of tokens, the model computes: `score = Q · K^T / sqrt(head_dim)`. The dot product measures similarity — if token A's query is similar to token B's key, token A wants to attend to token B. Dividing by sqrt(64) = 8 prevents the scores from growing too large.

4. **Apply causal mask:** Scores for future tokens are set to negative infinity. After softmax, these become zero — future tokens get no attention weight.

5. **Weighted sum of values:** Each token's output is a weighted combination of all previous tokens' value vectors, where weights are the attention scores. A token that's highly relevant gets more weight.

6. **Project back:** All heads are concatenated (20 heads × 64 dims = 1280) and projected back through a linear layer.

PyTorch's `F.scaled_dot_product_attention` handles steps 3-5 efficiently with a fused GPU kernel.

## The Feed-Forward Network (MLP) — Processing Each Token

After attention, each token goes through a simple two-layer network:

1. **Expand:** Project from 1280 to 4 × 1280 = 5120 dimensions
2. **Activate:** Apply GELU (Gaussian Error Linear Unit) — a smooth version of ReLU
3. **Project back:** Compress from 5120 back to 1280

The expansion gives the model capacity to learn complex patterns. The 4× multiplier is a convention from the original Transformer paper. GELU is used because it's smoother than ReLU and performs better in practice.

## The Block — Putting It Together

Each transformer block combines attention and MLP with two critical techniques:

**Pre-LayerNorm:** Normalization happens *before* attention and MLP, not after. This is the "pre-norm" architecture that's more stable during training than the original "post-norm."

**Residual Connections:** The attention output is *added* to the input, not replacing it. Same for the MLP output. This `x = x + f(norm(x))` pattern lets gradients flow directly through the network during training, preventing the vanishing gradient problem that plagued deep networks for years.

## The Full Forward Pass

Starting from a batch of token IDs:

1. Look up token embeddings + position embeddings → add them
2. Apply dropout (regularization during training)
3. Pass through 24 transformer blocks sequentially
4. Apply final layer normalization
5. Project to vocabulary size (1280 → 50257) using `lm_head`

The output is a `(batch, sequence, vocab_size)` tensor — for each position in each sequence, the model predicts logits (unnormalized probabilities) for every possible next token.

During training, cross-entropy loss compares these predictions against the actual next tokens. During generation, we sample from the probability distribution to produce new tokens one at a time.

## Weight Tying — A Clever Optimization

Notice that `lm_head.weight` and `wte.weight` are the same tensor. This is called "weight tying." The intuition: if two tokens have similar embeddings, they should have similar output probabilities. Sharing weights enforces this relationship and saves ~64 million parameters.

## The Generate Method

Generation is autoregressive: predict one token, append it, repeat. At each step, the model sees all previously generated tokens (up to block_size) and predicts the next one. Temperature scaling controls randomness — lower temperature means more deterministic output. Top-k sampling restricts the model to the k most likely tokens, preventing it from choosing extremely unlikely words that would derail the generation.

## Why This Architecture Works

The Transformer's power comes from two properties:

**Parallelism:** Unlike RNNs that process tokens sequentially, attention computes all token relationships simultaneously. This makes training dramatically faster on GPUs.

**Long-range dependencies:** Attention gives every token direct access to every previous token. An RNN has to carry information through many processing steps; a Transformer just looks directly at the relevant position.

Combined with residual connections (enabling deep networks) and layer normalization (stabilizing training), these properties make Transformers the dominant architecture for language modeling.
