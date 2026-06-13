# Haney GPT — Training Process

## The Training Loop, Step by Step

Training a language model is deceptively simple: show the model tokens, ask it to predict the next one, measure how wrong it is, and adjust the weights to be less wrong next time. The complexity is in making this loop run efficiently on a GPU for millions of iterations without running out of memory, diverging, or producing garbage.

## The Training Configuration

The training script starts with a clear set of hyperparameters:

- **batch_size: 8** — How many sequences to process simultaneously. Originally set to 16 but had to reduce due to GPU memory constraints. Each sequence is 1024 tokens, so each batch contains 8,192 tokens.
- **block_size: 1024** — The context window during training. The model sees 1024 tokens at a time.
- **max_iters: 10,000** — Total training iterations. The model sees about 82 million tokens total (10,000 batches × 8,192 tokens).
- **learning_rate: 3e-4** — How aggressively to update weights. Too high = unstable training. Too low = slow progress.
- **weight_decay: 0.1** — L2 regularization strength. Prevents weights from growing too large.
- **grad_clip: 1.0** — Maximum gradient norm. If gradients exceed this, they're scaled down. Critical for training stability.

## Data Loading: Memory-Mapped Efficiency

Training data is stored as a numpy memmap file — a binary format that maps directly to disk. The `get_batch` function:

1. Picks random starting positions in the data
2. Extracts 1024-token input sequences (`x`) and their corresponding target sequences (`y`)
3. Targets are offset by one position — the model predicts token N+1 given tokens 1 through N
4. Data is moved to GPU in `non_blocking` mode for asynchronous transfer

The random sampling means the model rarely sees the same sequence twice in the same order. This is effectively infinite data augmentation — the same tokens arranged in different contexts.

## Mixed Precision Training

This is one of the most important optimizations in modern deep learning. Instead of using 32-bit floats (FP32) for all computations, the training loop uses bfloat16 for the forward and backward passes:

```python
with autocast(device_type="cuda", dtype=torch.bfloat16):
    _, loss = model(xb, yb)
```

Bfloat16 uses 16 bits but keeps the same exponent range as FP32 — it loses precision on the mantissa but maintains the ability to represent very large and very small numbers. This matters because:

- **Memory:** Half the memory for activations means larger batch sizes or models
- **Speed:** Bfloat16 operations are faster on modern GPUs
- **Stability:** Unlike float16, bfloat16 rarely causes overflow/underflow

The gradient scaler compensates for the reduced precision. It multiplies the loss by a large factor before backpropagation to prevent small gradients from underflowing to zero in bfloat16, then unscales them before the optimizer step.

## The Training Loop

Each iteration:

1. **Get a batch** of input-target pairs
2. **Zero gradients** with `set_to_none=True` (more memory-efficient than zeroing)
3. **Forward pass** in bfloat16 with autocast
4. **Backward pass** with gradient scaling
5. **Unscale gradients** and clip to max norm of 1.0
6. **Optimizer step** with AdamW
7. **Update gradient scaler** for the next iteration
8. **Log progress** every 10 iterations

## Evaluation: Are We Actually Learning?

Every 50 iterations, the training loop pauses to evaluate on both training and validation data. The `estimate_loss` function:

1. Switches the model to evaluation mode (disables dropout)
2. Runs 20 forward passes on each split (train and val)
3. Averages the losses
4. Reports both numbers

If training loss decreases but validation loss increases, the model is overfitting — memorizing training data instead of learning general patterns. This is the signal to stop training, reduce model capacity, or add regularization.

## Checkpointing: Never Lose Progress

Training a large model for hours or days means you need resilience against crashes, preemption, and experimentation:

**Regular checkpoint:** Every 50 iterations, the model state (weights, optimizer state, iteration count) is saved to `haney_gpt_v2_step2101.pt`. This is the "latest" checkpoint — always overwritten.

**Milestone checkpoint:** Every 1000 iterations, a permanent snapshot is saved (`haney_gpt_v2_step1000.pt`, `haney_gpt_v2_step2000.pt`, etc.). These are never overwritten — you can go back to any point in training.

**Resumption:** On startup, the script checks for the regular checkpoint and resumes from it. This means you can stop and restart training without losing progress.

## The AdamW Optimizer

AdamW is the standard optimizer for Transformer training. It's Adam with decoupled weight decay — the weight decay is applied directly to the weights rather than being mixed into the adaptive learning rate. This subtle difference leads to better generalization.

Key parameters:
- Learning rate: 3e-4 (moderate — large enough to learn, small enough to be stable)
- Weight decay: 0.1 (significant regularization for a model this size)
- Betas: Default (0.9, 0.999) — momentum parameters for the running averages

## What the Loss Numbers Mean

During training, you see output like:

```
step 0 | loss 10.9824 | time 2.3s
step 50 | train 7.2341 | val 7.1982
step 100 | loss 5.8763 | time 45.1s
```

Initial loss around 10-11 is expected — at 50,257 possible tokens, random guessing gives a loss of ln(50257) ≈ 10.8. As training progresses, loss decreases:

- Loss ~7: The model is learning basic word frequencies and common patterns
- Loss ~5: Grammar and basic syntax are emerging
- Loss ~3-4: Coherent sentence structure
- Loss ~2-3: Good quality, competitive with similarly-sized models

The gap between train and validation loss shows generalization. A small gap (0.05 or less) means the model is learning general patterns. A growing gap signals overfitting.

## Hardware Constraints and Their Impact

Training on a single L40S (46GB VRAM) meant working within tight memory limits:

- Batch size was reduced from 16 to 8 to fit in memory
- bfloat16 was essential — FP32 would have required double the memory
- Gradient checkpointing (trading compute for memory) was considered but not implemented
- Context length of 1024 was chosen as a balance between capability and memory usage

These constraints are real-world engineering. The theoretical "right" hyperparameters don't matter if they don't fit on your GPU. Part of building models from scratch is learning to work within hardware limits.
