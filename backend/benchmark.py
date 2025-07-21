import requests 
import json
import time
import openai
import os
from typing import Dict, Any

from dotenv import load_dotenv
load_dotenv()

# URLs and configs
MODAL_URL = os.getenv("MODAL_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Standardized system prompt for fair comparison
SYSTEM_PROMPT = "You are a helpful multilingual assistant specializing in Southeast Asian languages. You are to translate the given text into Bahasa Indonesia. Only return the translated text, nothing else. Do not add any explanations or additional text, or show your reasoning."

def _initialize_timing() -> Dict[str, Any]:
    """Initialize timing variables for benchmarking"""
    return {
        "start_time": time.time(),
        "first_token_time": None,
        "token_count": 0,
        "full_response": ""
    }

def _update_token_metrics(timing_data: Dict[str, Any], content: str) -> None:
    """Update token count and timing metrics"""
    timing_data["token_count"] += 1
    current_time = time.time()
    
    if timing_data["first_token_time"] is None:
        timing_data["first_token_time"] = current_time - timing_data["start_time"]
    
    timing_data["full_response"] += content

def _create_result(model_name: str, timing_data: Dict[str, Any], success: bool = True, error: str = None) -> Dict[str, Any]:
    """Create standardized benchmark result"""
    if not success:
        return {"model": model_name, "success": False, "error": error}
    
    total_time = time.time() - timing_data["start_time"]
    first_token_time = timing_data["first_token_time"]
    token_count = timing_data["token_count"]
    
    return {
        "model": model_name,
        "response": timing_data["full_response"],
        "time_to_first_token": first_token_time,
        "tokens_per_second": token_count / (total_time - first_token_time) if first_token_time else 0,
        "success": True
    }

def benchmark_sealion(prompt: str) -> Dict[str, Any]:
    """Benchmark SEA-LION model"""
    payload = {
        "model": "aisingapore/Llama-SEA-LION-v3.5-8B-R",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": True,
    }

    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    timing = _initialize_timing()
    
    response = requests.post(MODAL_URL, json=payload, headers=headers, stream=True)
    
    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    data = line[6:]
                    if data == '[DONE]':
                        break
                    
                    try:
                        chunk = json.loads(data)
                        if 'choices' in chunk and len(chunk['choices']) > 0:
                            delta = chunk['choices'][0].get('delta', {})
                            if 'content' in delta and delta['content']:
                                _update_token_metrics(timing, delta['content'])
                    except json.JSONDecodeError:
                        continue
        
        return _create_result("SEA-LION-v3.5-8B-R", timing)
    else:
        return _create_result("SEA-LION-v3.5-8B-R", timing, success=False, error=response.text)

def benchmark_openai(prompt: str, model_name: str) -> Dict[str, Any]:
    """Benchmark OpenAI models"""
    if not OPENAI_API_KEY:
        return _create_result(model_name, {}, success=False, error="OPENAI_API_KEY not set")
    
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    timing = _initialize_timing()
    
    try:
        stream = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            stream=True,
            temperature=0.1,  # Lower temperature reduces reasoning variability
            max_tokens=150,   # Limit response length to discourage reasoning
            top_p=0.9,        # Focus on most likely tokens
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                _update_token_metrics(timing, chunk.choices[0].delta.content)
        
        return _create_result(model_name, timing)
    except Exception as e:
        return _create_result(model_name, timing, success=False, error=str(e))

def print_results(results: Dict[str, Any]):
    """Print benchmark results in a formatted way"""
    print(f"\n{'='*50}")
    print(f"MODEL: {results['model']}")
    print(f"{'='*50}")
    
    if not results['success']:
        print(f"Error: {results['error']}")
        return
    
    print(f"Success")
    print(f"Response: {results['response'][:100]}{'...' if len(results['response']) > 100 else ''}")
    print(f"\nMETRICS:")
    print(f"  Time to first token: {results['time_to_first_token']:.3f}s")
    print(f"  Tokens per second: {results['tokens_per_second']:.1f}")

def compare_models(results1: Dict[str, Any], results2: Dict[str, Any]):
    """Compare results between two models"""
    print(f"\n{'COMPARISON':<50}")
    print(f"{'='*50}")
    
    if not (results1['success'] and results2['success']):
        print("Cannot compare - one or both models failed")
        return
    
    metrics = [
        ("Time to first token", "time_to_first_token", "s", "lower"),
        ("Tokens per second", "tokens_per_second", "tok/s", "higher")
    ]
    
    for metric_name, key, unit, better in metrics:
        val1, val2 = results1[key], results2[key]
        
        if better == "lower":
            winner = results1['model'] if val1 < val2 else results2['model']
            diff = abs(val1 - val2) / max(val1, val2) * 100
        elif better == "higher":
            winner = results1['model'] if val1 > val2 else results2['model']
            diff = abs(val1 - val2) / max(val1, val2) * 100
        else:
            winner = "tied"
            diff = 0
        
        print(f"{metric_name:<20}: {results1['model']}: {val1:.3f}{unit} | {results2['model']}: {val2:.3f}{unit}")
        if winner != "tied":
            print(f"{winner} wins by {diff:.1f}%")

def _run_comparison_test(test_number: int, gpt_model: str, test_prompt: str) -> None:
    """Run a standardized comparison test between SEA-LION and GPT model"""
    print(f"\nTEST {test_number}: SEA-LION vs {gpt_model}")
    print("-" * 60)
    
    sealion_results = benchmark_sealion(test_prompt)
    gpt_results = benchmark_openai(test_prompt, gpt_model)
    
    # Print individual results
    print_results(sealion_results)
    print_results(gpt_results)
    
    # Compare results
    compare_models(sealion_results, gpt_results)
    
    # Add delay between tests
    time.sleep(2)

def main():
    # Test prompt for all benchmarks
    test_prompt = "Hello! Can I have a cup of coffee?"
    
    print("BENCHMARK: SEA-LION vs OpenAI Models")
    print("=" * 60)
    
    # TEST 1: SEA-LION Cold Start Warmup
    print(f"\nTEST 1: SEA-LION Cold Start Warmup")
    print("DISCLAIMER: This test is for SEA-LION cold start preparation - results not comparable")
    print("-" * 60)
    
    sealion_warmup = benchmark_sealion(test_prompt)
    print_results(sealion_warmup)
    print("SEA-LION warmed up - container ready for comparison tests")
    
    # Delay for cold start preparation
    time.sleep(3)
    
    # TEST 2 & 3: Standardized comparison tests
    _run_comparison_test(2, "gpt-4.1-nano-2025-04-14", test_prompt)
    _run_comparison_test(3, "gpt-4.1-mini-2025-04-14", test_prompt)

if __name__ == "__main__":
    main()
    