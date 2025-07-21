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

## Tests

### Benchmarking SEA-LION against OpenAI 4.1-nano and 4.1-mini

1. Create a .env file with the following:

```bash
MODAL_URL=<<YOUR_MODAL_DEPLOYMENT_URL>>
OPENAI_API_KEY=<<YOUR_OPENAI_API_KEY>>
```

Use the Modal endpoint URL from the previous step

2. Run `benchmark.py`

```bash
python benchmark.py
```
This will run an automated test to compare SEA-LION against OpenAI 4.1-nano and 4.1-mini