# Haney GPT — Challenges Faced

Building a language model from scratch is an exercise in debugging. Here are the real challenges encountered and how they were solved.

## Challenge 1: GPU Out of Memory Errors

**The problem:** The initial batch size of 16 caused CUDA out-of-memory errors on the L40S. The model's activations (intermediate values saved for backpropagation) consumed more memory than available.

**The investigation:** Memory usage comes from model parameters (~2GB for 537M parameters in bfloat16), optimizer state (~4GB for AdamW momentum/variance), and activations (varies with batch size and sequence length). The activations were the culprit — 16 sequences of 1024 tokens through 24 layers generated too many saved tensors.

**The solution:** Reduced batch size to 8. Also used `set_to_none=True` in `optimizer.zero_grad()` instead of the default `zero_grad()`, which frees memory rather than zeroing it. Both changes together brought memory usage within limits.

**Lesson:** Batch size isn't just about training dynamics — it's primarily constrained by GPU memory. Always estimate memory requirements before starting training.

## Challenge 2: Training Instability

**The problem:** During early experiments, loss would occasionally spike (jump from ~5 to ~50+) and never recover, effectively ruining the training run.

**The investigation:** Loss spikes in Transformer training are usually caused by large gradients. The Adam optimizer's adaptive learning rates can amplify small parameter changes in certain layers, leading to cascading instability. Without gradient clipping, a single "bad" batch can push the model into an irrecoverable state.

**The solution:** Gradient clipping (`grad_clip = 1.0`) — after computing gradients but before applying them, scale all gradients so their total norm doesn't exceed 1.0. This prevents any single batch from causing catastrophic updates. Combined with mixed precision's gradient scaling, this eliminated loss spikes entirely.

**Lesson:** Gradient clipping isn't optional for Transformer training — it's essential. The default in most frameworks is no clipping, but for language models, always set a clip value.

## Challenge 3: Data Pipeline Complexity

**The problem:** The training data came from three different sources (TinyStories, Dolly-15k, UltraChat) with different formats, quality levels, and characteristics. Merging them naively produced inconsistent training examples.

**The investigation:** Each dataset had its own format. TinyStories was plain text. Dolly-15k had instruction-response pairs. UltraChat had multi-turn conversations. Putting them together required a unified format with special tokens to distinguish between content types.

**The solution:** Created a preprocessing pipeline with three scripts:
- `merge_datasets.py` — Combines datasets with special tokens (`<|story|>`, `<|instruction|>`, etc.)
- `analyze_dataset.py` — Examines the merged data for quality issues
- `preparedata.py` — Converts to binary format for efficient training

**Lesson:** Data preprocessing is often 70-80% of the work in ML projects. The model architecture gets the attention, but the data pipeline determines success or failure.

## Challenge 4: Checkpoint Resume Failures

**The problem:** When resuming from a checkpoint, the optimizer state sometimes wouldn't load correctly, causing the learning rate schedule to reset or the optimizer's momentum buffers to be lost.

**The investigation:** The checkpoint saved model weights, optimizer state, and iteration count. But if the optimizer was initialized with different parameters than when the checkpoint was created, state dict keys wouldn't match.

**The solution:** Ensured consistent optimizer initialization in both the initial training and checkpoint loading paths. Always saved the full optimizer state dict rather than just the parameter groups. Added the iteration count to the checkpoint to resume from the correct position.

**Lesson:** Checkpoint format should be treated as an API contract. Any change to the model, optimizer, or training configuration should either be backward-compatible or accompanied by a checkpoint version bump.

## Challenge 5: Slow Token Generation

**The problem:** Initial generation was painfully slow — 1-2 tokens per second. For a 100-token response, that's a minute of waiting.

**The investigation:** Each generation step was recomputing the full context, including all previously generated tokens, from scratch. With a 512-token context and 24 layers, this was enormous wasted computation.

**The solution:** While full KV-caching wasn't implemented for this educational project, the generation was optimized by trimming the context to the last `block_size` tokens. Additionally, reducing `block_size` during generation (versus training) helped with speed without significantly impacting quality for short generations.

**Lesson:** Generation optimization (KV-caching, speculative decoding) is a separate engineering challenge from training. Production LLMs spend as much engineering effort on inference as on training.

## Challenge 6: Knowing When to Stop

**The problem:** Training loss kept decreasing, but it wasn't clear whether the model was actually getting better or just memorizing the training data more thoroughly.

**The investigation:** Validation loss is the primary signal, but it can be noisy. Looking at generation samples tells a more nuanced story — sometimes a model with slightly higher validation loss produces more coherent text.

**The solution:** Used a combination of validation loss monitoring and qualitative evaluation. Every 1000 iterations, generated sample text from the same prompt and manually assessed quality. Stopped training when generation quality plateaued, even though loss was still decreasing slowly.

**Lesson:** Loss curves don't tell the whole story. Qualitative evaluation (reading actual model outputs) is essential for judging when a language model is "done."

## Challenge 7: Working with Lightning AI Studio

**The problem:** Lightning AI Studio provided the L40S GPU, but it's a cloud environment with its own constraints — storage limits, session timeouts, and data transfer speeds.

**The investigation:** The `/data` directory had limited space. Downloading and preprocessing the full dataset (UltraChat is large) took significant time. Sessions could time out, interrupting long training runs.

**The solution:** Preprocessed data locally and uploaded only the binary files. Used checkpointing aggressively to survive session timeouts. Optimized data loading with memmap to minimize storage footprint.

**Lesson:** Cloud development environments are powerful but require adaptation. Always design training workflows to be resumable — assume interruptions will happen.
