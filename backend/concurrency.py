import asyncio
import aiohttp
import json
import time
import statistics
import os
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


class ModelNames:
    SEA_LION = "aisingapore/Llama-SEA-LION-v3.5-8B-R"
    SEA_LION_MODEL = "SEA-LION-v3.5-8B-R"
    OPENAI_MODEL = "gpt-4.1-nano-2025-04-14"

class APIEndpoints:
    MODAL_URL = os.getenv("MODAL_URL")
    OPENAI_URL = "https://api.openai.com/v1/chat/completions"

class Timeouts:
    WARMUP_DELAY = 5
    BETWEEN_TESTS = 2
    BETWEEN_LEVELS = 5
    TOTAL_REQUEST = 120
    CONNECT = 10
    SOCK_READ = 60
    KEEPALIVE = 30

class Limits:
    CONNECTION_POOL = 100
    PER_HOST = 30
    RESPONSE_PREVIEW = 50

@dataclass
class BenchmarkConfig:
    """Configuration for benchmark testing"""
    connection_limit: int = Limits.CONNECTION_POOL
    per_host_limit: int = Limits.PER_HOST
    keepalive_timeout: int = Timeouts.KEEPALIVE
    total_timeout: int = Timeouts.TOTAL_REQUEST
    connect_timeout: int = Timeouts.CONNECT
    sock_read_timeout: int = Timeouts.SOCK_READ
    response_preview_length: int = Limits.RESPONSE_PREVIEW
    
    def create_connector(self) -> aiohttp.TCPConnector:
        """Create TCP connector with configured limits"""
        return aiohttp.TCPConnector(
            limit=self.connection_limit,
            limit_per_host=self.per_host_limit,
            keepalive_timeout=self.keepalive_timeout,
            enable_cleanup_closed=True
        )
    
    def create_timeout(self) -> aiohttp.ClientTimeout:
        """Create client timeout with configured values"""
        return aiohttp.ClientTimeout(
            total=self.total_timeout,
            connect=self.connect_timeout,
            sock_read=self.sock_read_timeout
        )

SYSTEM_PROMPT = "You are a helpful multilingual assistant specializing in Southeast Asian languages. You are to translate the given text into Bahasa Indonesia. Only return the translated text, nothing else. Do not add any explanations or additional text, or show your reasoning."

class TimingTracker:
    """Track timing metrics for requests"""
    
    def __init__(self):
        self.start_time = time.time()
        self.first_token_time: Optional[float] = None
        self.token_count = 0
        self.full_response = ""
    
    def record_token(self, content: str) -> None:
        """Record a new token"""
        self.token_count += 1
        current_time = time.time()
        
        if self.first_token_time is None:
            self.first_token_time = current_time - self.start_time
        
        self.full_response += content
    
    def get_metrics(self) -> Dict[str, Any]:
        """Calculate final metrics"""
        total_time = time.time() - self.start_time
        
        if self.first_token_time and total_time > self.first_token_time:
            tokens_per_second = self.token_count / (total_time - self.first_token_time)
        else:
            tokens_per_second = 0
            
        return {
            "time_to_first_token": self.first_token_time,
            "tokens_per_second": tokens_per_second,
            "response": self.full_response
        }

async def parse_sse_stream(response: aiohttp.ClientResponse, timing: TimingTracker) -> bool:
    """
    Parse Server-Sent Events stream and update timing tracker
    Returns True if successful, False otherwise
    """
    try:
        async for line in response.content:
            line_str = line.decode('utf-8').strip()
            if line_str.startswith('data: '):
                data = line_str[6:]
                if data == '[DONE]':
                    break
                
                try:
                    chunk = json.loads(data)
                    if 'choices' in chunk and len(chunk['choices']) > 0:
                        delta = chunk['choices'][0].get('delta', {})
                        if 'content' in delta and delta['content']:
                            timing.record_token(delta['content'])
                except json.JSONDecodeError:
                    continue
        return True
    except Exception:
        return False

def create_result_dict(model_name: str, timing: TimingTracker, success: bool = True, error: str = None) -> Dict[str, Any]:
    """Create standardized result dictionary"""
    if not success:
        return {"model": model_name, "success": False, "error": error}
    
    metrics = timing.get_metrics()
    return {
        "model": model_name,
        "success": True,
        **metrics
    }

async def benchmark_sealion_async(session: aiohttp.ClientSession, prompt: str) -> Dict[str, Any]:
    """Async benchmark for SEA-LION model"""
    payload = {
        "model": ModelNames.SEA_LION,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": True,
    }

    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    timing = TimingTracker()

    try:
        async with session.post(APIEndpoints.MODAL_URL, json=payload, headers=headers) as response:
            if response.status == 200:
                success = await parse_sse_stream(response, timing)
                if success:
                    return create_result_dict(ModelNames.SEA_LION_MODEL, timing)
                else:
                    return create_result_dict(ModelNames.SEA_LION_MODEL, timing, False, "Stream parsing failed")
            else:
                error_text = await response.text()
                return create_result_dict(ModelNames.SEA_LION_MODEL, timing, False, f"HTTP {response.status}: {error_text}")
                
    except Exception as e:
        return create_result_dict(ModelNames.SEA_LION_MODEL, timing, False, str(e))

async def benchmark_openai_async(session: aiohttp.ClientSession, prompt: str, model_name: str) -> Dict[str, Any]:
    """Async benchmark for OpenAI models"""
    if not os.getenv("OPENAI_API_KEY"):
        return create_result_dict(model_name, TimingTracker(), False, "OPENAI_API_KEY not set")

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "stream": True,
        "temperature": 0.1,
        "max_tokens": 150,
        "top_p": 0.9,
    }

    headers = {
        "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
        "Content-Type": "application/json"
    }

    timing = TimingTracker()

    try:
        async with session.post(APIEndpoints.OPENAI_URL, json=payload, headers=headers) as response:
            if response.status == 200:
                success = await parse_sse_stream(response, timing)
                if success:
                    return create_result_dict(model_name, timing)
                else:
                    return create_result_dict(model_name, timing, False, "Stream parsing failed")
            else:
                error_text = await response.text()
                return create_result_dict(model_name, timing, False, f"HTTP {response.status}: {error_text}")
                
    except Exception as e:
        return create_result_dict(model_name, timing, False, str(e))

def aggregate_results(processed_results: List[Dict[str, Any]], concurrency_level: int, model_name: str) -> Dict[str, Any]:
    """Aggregate benchmark results with fixed metrics calculation"""
    successful_results = [r for r in processed_results if r.get('success', False)]
    success_rate = len(successful_results) / len(processed_results) * 100 if processed_results else 0
    
    if not successful_results:
        return {
            "concurrency_level": concurrency_level,
            "success_rate": 0,
            "total_requests": len(processed_results),
            "successful_requests": 0,
            "avg_time_to_first_token": 0,
            "min_time_to_first_token": 0,
            "max_time_to_first_token": 0,
            "avg_tokens_per_second": 0,
            "total_throughput": 0,
            "requests_per_second": 0,
            "model": model_name
        }
    
    # Extract valid metrics
    first_token_times = [r['time_to_first_token'] for r in successful_results if r.get('time_to_first_token')]
    tokens_per_second = [r['tokens_per_second'] for r in successful_results if r.get('tokens_per_second')]
    
    return {
        "concurrency_level": concurrency_level,
        "success_rate": success_rate,
        "total_requests": len(processed_results),
        "successful_requests": len(successful_results),
        "avg_time_to_first_token": statistics.mean(first_token_times) if first_token_times else 0,
        "min_time_to_first_token": min(first_token_times) if first_token_times else 0,
        "max_time_to_first_token": max(first_token_times) if first_token_times else 0,
        "avg_tokens_per_second": statistics.mean(tokens_per_second) if tokens_per_second else 0,
        "total_throughput": sum(tokens_per_second) if tokens_per_second else 0,  # Fixed: sum not mean
        "requests_per_second": concurrency_level,  # Simplified: concurrent requests attempted
        "model": model_name
    }

async def run_concurrent_benchmark_async(benchmark_func, session: aiohttp.ClientSession, test_prompt: str, concurrency_level: int, model_name: str = None) -> Dict[str, Any]:
    """Run multiple concurrent async benchmark tests"""
    
    print(f"\nRunning {concurrency_level} concurrent async requests...")
    
    start_time = time.time()
    
    # Create concurrent tasks
    if model_name:
        tasks = [benchmark_func(session, test_prompt, model_name) for _ in range(concurrency_level)]
    else:
        tasks = [benchmark_func(session, test_prompt) for _ in range(concurrency_level)]
    
    # Execute all tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results (handle exceptions)
    processed_results = []
    for result in results:
        if isinstance(result, Exception):
            processed_results.append({"success": False, "error": str(result)})
        else:
            processed_results.append(result)
    
    # Use fixed aggregation
    final_model_name = model_name if model_name else ModelNames.SEA_LION_MODEL
    return aggregate_results(processed_results, concurrency_level, final_model_name)

def print_async_concurrency_results(results: Dict[str, Any], config: BenchmarkConfig):
    """Print async concurrency test results"""
    print(f"\n{'='*60}")
    print(f"ASYNC CONCURRENCY RESULTS: {results['model']}")
    print(f"{'='*60}")
    print(f"Concurrency Level: {results['concurrency_level']} concurrent requests")
    print(f"Success Rate: {results['success_rate']:.1f}% ({results['successful_requests']}/{results['total_requests']})")
    print(f"Requests per Second: {results['requests_per_second']:.1f} req/s")
    print(f"")
    print(f"LATENCY METRICS:")
    print(f"  Average time to first token: {results['avg_time_to_first_token']:.3f}s")
    print(f"  Min time to first token: {results['min_time_to_first_token']:.3f}s") 
    print(f"  Max time to first token: {results['max_time_to_first_token']:.3f}s")
    print(f"")
    print(f"THROUGHPUT METRICS:")
    print(f"  Average tokens per second (per request): {results['avg_tokens_per_second']:.1f}")
    print(f"  Total system throughput: {results['total_throughput']:.1f} tokens/sec")

def compare_async_results(sealion_results: Dict[str, Any], openai_results: Dict[str, Any]):
    """Compare async concurrency results"""
    print(f"\n{'='*60}")
    print(f"ASYNC CONCURRENCY COMPARISON - {sealion_results['concurrency_level']} concurrent requests")
    print(f"{'='*60}")
    
    metrics = [
        ("Success Rate", "success_rate", "%", "higher"),
        ("Requests per Second", "requests_per_second", "req/s", "higher"),
        ("Avg Time to First Token", "avg_time_to_first_token", "s", "lower"),
        ("Total System Throughput", "total_throughput", "tok/s", "higher")
    ]
    
    for metric_name, key, unit, better in metrics:
        val1, val2 = sealion_results[key], openai_results[key]
        
        if better == "lower":
            winner = sealion_results['model'] if val1 < val2 else openai_results['model']
            diff = abs(val1 - val2) / max(val1, val2) * 100 if max(val1, val2) > 0 else 0
        elif better == "higher":
            winner = sealion_results['model'] if val1 > val2 else openai_results['model']
            diff = abs(val1 - val2) / max(val1, val2) * 100 if max(val1, val2) > 0 else 0
        else:
            winner = "tied"
            diff = 0
        
        print(f"{metric_name:<25}: {sealion_results['model']}: {val1:.3f}{unit} | {openai_results['model']}: {val2:.3f}{unit}")
        if winner != "tied":
            print(f"{' '*27}{winner} wins by {diff:.1f}%")

async def perform_warmup(config: BenchmarkConfig, test_prompt: str) -> bool:
    """Perform SEA-LION warmup and return success status"""
    print("COLD START WARMUP")
    print("DISCLAIMER: Warming up SEA-LION container - results not used for comparison")
    print("-" * 60)
    
    connector = aiohttp.TCPConnector(limit=10, limit_per_host=10)
    timeout = aiohttp.ClientTimeout(total=120, connect=10, sock_read=60)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as warmup_session:
        warmup_result = await benchmark_sealion_async(warmup_session, test_prompt)
        if warmup_result['success']:
            print(f"SEA-LION warmed up successfully")
            print(f"Response: {warmup_result['response'][:config.response_preview_length]}{'...' if len(warmup_result['response']) > config.response_preview_length else ''}")
            return True
        else:
            print(f"SEA-LION warmup failed: {warmup_result['error']}")
            print("Proceeding with tests, but results may include cold start penalties")
            return False

# ============================================================================
# MAIN TESTING LOGIC
# ============================================================================

async def run_single_concurrency_test(session: aiohttp.ClientSession, test_prompt: str, level: int, config: BenchmarkConfig):
    """Run a single concurrency level test for both models"""
    print(f"\nTESTING ASYNC CONCURRENCY LEVEL: {level}")
    print("-" * 60)
    
    # Test SEA-LION concurrency
    print(f"Testing SEA-LION with {level} concurrent async requests...")
    sealion_results = await run_concurrent_benchmark_async(
        benchmark_sealion_async, 
        session,
        test_prompt, 
        level
    )
    print_async_concurrency_results(sealion_results, config)
    
    # Small delay between tests
    await asyncio.sleep(Timeouts.BETWEEN_TESTS)
    
    # Test OpenAI concurrency  
    print(f"\nTesting GPT-4.1-nano with {level} concurrent async requests...")
    openai_results = await run_concurrent_benchmark_async(
        benchmark_openai_async, 
        session,
        test_prompt, 
        level,
        model_name=ModelNames.OPENAI_MODEL
    )
    print_async_concurrency_results(openai_results, config)
    
    # Compare results
    compare_async_results(sealion_results, openai_results)

async def test_concurrency_levels_async(test_prompt: str, concurrency_levels: List[int], config: BenchmarkConfig):
    """Test different concurrency levels async"""
    
    print(f"\nCONCURRENCY TESTING")
    print(f"Test prompt: {test_prompt}")
    
    connector = config.create_connector()
    timeout = config.create_timeout()
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        for i, level in enumerate(concurrency_levels):
            await run_single_concurrency_test(session, test_prompt, level, config)
            
            # Longer delay between concurrency levels (except last)
            if i < len(concurrency_levels) - 1:
                print(f"\nWaiting before next concurrency level...")
                await asyncio.sleep(Timeouts.BETWEEN_LEVELS)

async def main():
    """Main execution function"""
    # Configuration
    config = BenchmarkConfig()
    test_prompt = "Hello! Can I have a cup of coffee?"
    concurrency_levels = [1, 5, 10, 25, 50]
    
    # Print header
    print("ASYNC CONCURRENCY TESTING: SEA-LION vs OpenAI Models")
    print("="*60)
    
    # Perform warmup
    print("\n")
    await perform_warmup(config, test_prompt)
    
    # Wait for container stabilization
    print("Waiting for container stabilization...")
    await asyncio.sleep(Timeouts.WARMUP_DELAY)
    
    # Run concurrency tests
    await test_concurrency_levels_async(test_prompt, concurrency_levels, config)

if __name__ == "__main__":
    asyncio.run(main()) 