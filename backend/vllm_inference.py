from typing import Any
import modal

# 1. Set up container image

vllm_image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "vllm==0.9.1",
        "huggingface_hub[hf_transfer]==0.32.0",
        "flashinfer-python==0.2.6.post1",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
)

# 2. Download aisingapore's SEA-LION v3.5 8b model weights
MODEL_NAME = "aisingapore/Llama-SEA-LION-v3.5-8B-R"
MODEL_REVISION = "main"

# Modal volumes 
hf_cache_vol = modal.Volume.from_name("huggingface-cache", create_if_missing=True)

# Cache vLLM's JIT compilation artifacts in a Modal volume
vllm_cache_vol = modal.Volume.from_name("vllm-cache", create_if_missing=True)

# Configuring vLLM V1 Engine
vllm_image = vllm_image.env({"VLLM_USE_V1": "1"})

FAST_BOOT = True

# 3. Build a vLLM engine and serve it
# the function spawns a vLLM instance listening at port 8000, serving requests to our model

app = modal.App("sealion-vllm")

N_GPU = 1
MINUTES = 60  # seconds
VLLM_PORT = 8000

@app.function(
    image=vllm_image,
    gpu=f"H100:{N_GPU}", # using Nvidia H100 GPU
    scaledown_window=1 * MINUTES,  # how long should we stay up with no requests?
    timeout=5 * MINUTES,  # how long should we wait for container start?
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        "/root/.cache/vllm": vllm_cache_vol,
    },
)
@modal.concurrent( 
    max_inputs=32  # Optimized for 8B model on H100
)
@modal.web_server(port=VLLM_PORT, startup_timeout=10 * MINUTES)
def serve():
    import subprocess

    cmd = [
        "vllm",
        "serve",
        "--uvicorn-log-level=info",
        MODEL_NAME,
        "--revision",
        MODEL_REVISION,
        "--served-model-name",
        MODEL_NAME,
        "--host",
        "0.0.0.0",
        "--port",
        str(VLLM_PORT),
    ]

    cmd += ["--enforce-eager" if FAST_BOOT else "--no-enforce-eager"]
    cmd += ["--tensor-parallel-size", str(N_GPU)]

    print(cmd)

    subprocess.Popen(" ".join(cmd), shell=True)