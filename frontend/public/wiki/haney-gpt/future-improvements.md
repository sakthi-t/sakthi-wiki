# Haney GPT — Future Improvements

The 537M model works, but there's a clear path to making it better. Here's what's planned, organized from most immediate to most ambitious.

## Near-Term: Better Training and Deployment

### Instruction Tuning

The base model was trained on a mixture of stories, conversations, and instruction data. The next step is dedicated instruction tuning — fine-tuning the model on high-quality instruction-response pairs to make it better at following directions. This is how GPT-3 became ChatGPT — base model + supervised fine-tuning + RLHF.

The Dolly-15k dataset already provides some instruction data, but dedicated tuning with a larger, higher-quality instruction dataset would significantly improve the model's usefulness.

### GGUF Conversion and Ollama Integration

Right now, the model runs only in PyTorch. Converting to GGUF format would enable:
- Running on consumer hardware (MacBooks, PCs without GPUs)
- Integration with Ollama for easy local deployment
- Quantization (4-bit, 8-bit) for reduced memory footprint
- Broader accessibility — anyone with a laptop could run Haney Chat locally

This is the single highest-impact improvement for making the model actually usable by others.

### Evaluation Benchmarks

The model was evaluated qualitatively — by reading its outputs. Quantitative benchmarking on standard NLP tasks would give objective metrics:
- Perplexity on held-out text
- HellaSwag for commonsense reasoning
- MMLU for broad knowledge
- HumanEval for code generation capability

Benchmarks provide ground truth about where the model stands and which improvements actually help.

## Medium-Term: Architectural Improvements

### Rotary Position Embeddings (RoPE)

The current model uses learned absolute position embeddings. RoPE encodes position information directly into the attention computation through rotation matrices. Benefits include:
- Better handling of sequences longer than training length
- Relative position awareness (the model knows "these two tokens are 3 positions apart")
- Better extrapolation to longer contexts

RoPE has become standard in modern LLMs (LLaMA, Mistral, Qwen) and would be a straightforward upgrade.

### Flash Attention

The current implementation uses PyTorch's `scaled_dot_product_attention`, which is already efficient. But Flash Attention (fused kernels that avoid materializing the full attention matrix) would further improve training speed and memory efficiency, allowing larger batch sizes or longer contexts on the same hardware.

### Larger Context Window

1024 tokens is small by modern standards. Expanding to 2048 or 4096 would require architectural changes (RoPE or ALiBi for position encoding) and more training data, but would make the model much more useful for real tasks that require longer contexts.

## Longer-Term: Scaling and Specialization

### Larger Model (1B+ Parameters)

Scaling to 1 billion+ parameters would require:
- Multiple GPUs with model parallelism
- More training data (billions of tokens)
- Longer training time (days to weeks)
- More sophisticated training infrastructure

But the architectural foundation is the same — Transformers scale remarkably well. A well-trained 1B model can be genuinely useful for many tasks.

### Domain-Specific Fine-Tuning

The base model could be fine-tuned for specific domains:
- Code generation (fine-tune on GitHub code)
- Medical text (fine-tune on PubMed)
- Legal documents (fine-tune on case law)
- Tamil or other Indian languages

Domain-specific models often outperform much larger general models on their target tasks.

### Mixture of Experts (MoE)

Instead of making the model deeper or wider, MoE architectures use multiple "expert" sub-networks and route each token to a subset of experts. This increases total parameters without proportionally increasing compute — a 4B-parameter MoE model might cost as much to run as a 1B-parameter dense model.

MoE is how models like Mixtral achieve strong performance at lower inference cost.

## Research Directions

### Training Data Quality

The current training data is a mix of existing datasets. Curating a high-quality, deduplicated dataset specifically for this model could improve performance more than scaling model size. Data quality matters at least as much as model architecture.

### Better Tokenizer

The GPT-2 tokenizer works, but a custom tokenizer trained on the target domain could be more efficient. Fewer tokens for common words = longer effective context for the same compute budget.

### Distillation from Larger Models

Rather than training from scratch, knowledge distillation from a larger teacher model (like GPT-4 or Claude) could produce a small but capable model. The student learns not just the teacher's outputs but its reasoning patterns.

## The Meta-Lesson

The most important thing about this project isn't any specific model or technique — it's the learning process itself. Each improvement is an opportunity to understand a concept deeply. RoPE teaches you about position encoding. Flash Attention teaches you about GPU memory hierarchies. MoE teaches you about conditional computation.

The 537M model is a starting point, not an endpoint. The path forward is clear, and each step teaches something new.
