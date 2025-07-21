# Careloop Backend - SEA-LION Model Deployment

Deploy aisingapore's Llama-SEA-LION-v3.5-8B-R model on Modal with vLLM inference.

## Prerequisites

- Python 3.12+
- Modal account (sign up at modal.com)

## Setup

1. Install uv:

```bash
pip install uv
```

2. Install dependencies:

```bash
uv venv --python 3.12
source .venv/bin/activate
uv sync
```

3. Authenticate with Modal:

Follow the official Modal setup guide at [modal.com/docs/getting-started](https://modal.com/docs/getting-started) to properly configure your Modal account and authentication.

After setting up, run:

```bash
modal setup
```

4. Deploy the model:

```bash
modal deploy vllm_inference.py
```

After successful deployment, you'll see a web function served with an endpoint URL like:

```
https://user--sealion-vllm-serve.modal.run
```

**Save this URL** - you'll need it to make inference requests to your deployed model.

## Deployment Details

This deployment uses:

- **GPU**: Single NVIDIA H100
- **Model**: aisingapore/Llama-SEA-LION-v3.5-8B-R (8B parameters)
- **Inference Engine**: vLLM v0.9.1 with V1 engine
- **Startup Time**: ~5 minutes for first deployment
- **Auto-scaling**: Scales down after 1 minute of inactivity
- **Port**: 8000
- **Concurrency**: 32 concurrent requests per replica (optimized for H100 + 8B model)

## Tests

### Benchmarking SEA-LION against OpenAI Models

1. Create a .env file with the following:

```bash
MODAL_URL=<<YOUR_MODAL_DEPLOYMENT_URL>>
OPENAI_API_KEY=<<YOUR_OPENAI_API_KEY>>
```

Use the Modal endpoint URL from the previous step

2. Run basic performance comparison:

```bash
python benchmark.py
```

This compares SEA-LION against OpenAI 4.1-nano and 4.1-mini on:

- **Warms up SEA-LION** first to eliminate cold start bias
- Time to first token (latency)
- Tokens per second (throughput)

3. Run concurrency stress test:

```bash
python concurrency
```

This async concurrency test compares SEA-LION against OpenAI 4.1-nano

- **Warms up SEA-LION** first to eliminate cold start bias
- Tests 1, 5, 10, 25, 50+ concurrent requests
- Measures success rate under load, requests per second, average time to first token, and total system throughput
