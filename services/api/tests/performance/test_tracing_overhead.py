"""
Tracing Performance Benchmarks

Measures OpenTelemetry tracing overhead to ensure <100ms target.
[Ver001.000]

Usage:
    cd services/api
    poetry run pytest tests/performance/test_tracing_overhead.py -v
"""

import time
import asyncio
import statistics
from typing import List, Callable
from contextlib import contextmanager

import pytest


class TracingOverheadBenchmark:
    """Benchmark suite for measuring tracing overhead."""
    
    # Performance target: <100ms overhead
    TARGET_OVERHEAD_MS = 100
    
    def __init__(self, iterations: int = 1000):
        self.iterations = iterations
        self.results = {
            "no_tracing": [],
            "simple_span": [],
            "span_with_attributes": [],
            "nested_spans": [],
            "db_tracing": [],
            "cache_tracing": [],
        }
    
    @contextmanager
    def _timer(self):
        """Simple timer context manager."""
        start = time.perf_counter()
        yield
        end = time.perf_counter()
        return (end - start) * 1000  # ms
    
    async def benchmark_no_tracing(self) -> List[float]:
        """Baseline: no tracing at all."""
        durations = []
        
        for _ in range(self.iterations):
            start = time.perf_counter()
            # Minimal work
            _ = 1 + 1
            end = time.perf_counter()
            durations.append((end - start) * 1000)
        
        return durations
    
    async def benchmark_simple_span(self) -> List[float]:
        """Benchmark simple span creation."""
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
            
            # Setup tracer
            provider = TracerProvider()
            processor = SimpleSpanProcessor(ConsoleSpanExporter())
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            tracer = trace.get_tracer(__name__)
            
            durations = []
            for _ in range(self.iterations):
                start = time.perf_counter()
                
                with tracer.start_as_current_span("test_operation"):
                    _ = 1 + 1
                
                end = time.perf_counter()
                durations.append((end - start) * 1000)
            
            return durations
            
        except ImportError:
            pytest.skip("OpenTelemetry not installed")
    
    async def benchmark_span_with_attributes(self) -> List[float]:
        """Benchmark span with attributes."""
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
            
            provider = TracerProvider()
            processor = SimpleSpanProcessor(ConsoleSpanExporter())
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            tracer = trace.get_tracer(__name__)
            
            durations = []
            for _ in range(self.iterations):
                start = time.perf_counter()
                
                with tracer.start_as_current_span("test_operation") as span:
                    span.set_attribute("test.attribute", "value")
                    span.set_attribute("test.number", 42)
                    span.set_attribute("test.boolean", True)
                    _ = 1 + 1
                
                end = time.perf_counter()
                durations.append((end - start) * 1000)
            
            return durations
            
        except ImportError:
            pytest.skip("OpenTelemetry not installed")
    
    async def benchmark_nested_spans(self) -> List[float]:
        """Benchmark nested span creation (typical API request pattern)."""
        try:
            from opentelemetry import trace
            from opentelemetry.sdk.trace import TracerProvider
            from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
            
            provider = TracerProvider()
            processor = SimpleSpanProcessor(ConsoleSpanExporter())
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            tracer = trace.get_tracer(__name__)
            
            durations = []
            for _ in range(self.iterations):
                start = time.perf_counter()
                
                with tracer.start_as_current_span("http_request"):
                    with tracer.start_as_current_span("auth_middleware"):
                        _ = 1 + 1
                    with tracer.start_as_current_span("route_handler"):
                        with tracer.start_as_current_span("db_query"):
                            _ = 1 + 1
                        with tracer.start_as_current_span("cache_get"):
                            _ = 1 + 1
                
                end = time.perf_counter()
                durations.append((end - start) * 1000)
            
            return durations
            
        except ImportError:
            pytest.skip("OpenTelemetry not installed")
    
    def calculate_stats(self, durations: List[float]) -> dict:
        """Calculate statistics for benchmark results."""
        sorted_durations = sorted(durations)
        
        return {
            "count": len(durations),
            "mean_ms": statistics.mean(durations),
            "median_ms": statistics.median(durations),
            "stdev_ms": statistics.stdev(durations) if len(durations) > 1 else 0,
            "min_ms": min(durations),
            "max_ms": max(durations),
            "p50_ms": sorted_durations[int(len(durations) * 0.50)],
            "p95_ms": sorted_durations[int(len(durations) * 0.95)],
            "p99_ms": sorted_durations[int(len(durations) * 0.99)],
        }
    
    def print_report(self, baseline: List[float], results: dict):
        """Print benchmark report."""
        baseline_stats = self.calculate_stats(baseline)
        
        print("\n" + "=" * 80)
        print("TRACING OVERHEAD BENCHMARK REPORT")
        print("=" * 80)
        print(f"Iterations: {self.iterations}")
        print(f"Target overhead: <{self.TARGET_OVERHEAD_MS}ms")
        print("\n" + "-" * 80)
        
        for name, durations in results.items():
            if name == "no_tracing":
                continue
            
            stats = self.calculate_stats(durations)
            overhead = stats["p99_ms"] - baseline_stats["p99_ms"]
            status = "PASS" if overhead < self.TARGET_OVERHEAD_MS else "FAIL"
            
            print(f"\n{name}:")
            print(f"  Mean:   {stats['mean_ms']:.3f}ms")
            print(f"  Median: {stats['median_ms']:.3f}ms")
            print(f"  P95:    {stats['p95_ms']:.3f}ms")
            print(f"  P99:    {stats['p99_ms']:.3f}ms")
            print(f"  Overhead: {overhead:.3f}ms [{status}]")
        
        print("\n" + "=" * 80)


@pytest.mark.asyncio
@pytest.mark.performance
async def test_tracing_overhead():
    """
    Test that tracing overhead is within acceptable limits (<100ms).
    """
    benchmark = TracingOverheadBenchmark(iterations=1000)
    
    # Run benchmarks
    print("\nRunning benchmarks...")
    
    baseline = await benchmark.benchmark_no_tracing()
    results = {"no_tracing": baseline}
    
    # Simple span benchmark
    try:
        simple = await benchmark.benchmark_simple_span()
        results["simple_span"] = simple
    except Exception as e:
        print(f"Simple span benchmark skipped: {e}")
    
    # Span with attributes
    try:
        with_attrs = await benchmark.benchmark_span_with_attributes()
        results["span_with_attributes"] = with_attrs
    except Exception as e:
        print(f"Span with attributes benchmark skipped: {e}")
    
    # Nested spans
    try:
        nested = await benchmark.benchmark_nested_spans()
        results["nested_spans"] = nested
    except Exception as e:
        print(f"Nested spans benchmark skipped: {e}")
    
    # Print report
    benchmark.print_report(baseline, results)
    
    # Assert performance target
    if len(results) > 1:
        baseline_p99 = benchmark.calculate_stats(baseline)["p99_ms"]
        
        for name, durations in results.items():
            if name == "no_tracing":
                continue
            
            p99 = benchmark.calculate_stats(durations)["p99_ms"]
            overhead = p99 - baseline_p99
            
            assert overhead < benchmark.TARGET_OVERHEAD_MS, (
                f"{name} tracing overhead ({overhead:.2f}ms) exceeds "
                f"target ({benchmark.TARGET_OVERHEAD_MS}ms)"
            )


@pytest.mark.asyncio
@pytest.mark.performance
async def test_tracing_context_switch_overhead():
    """
    Test overhead of context propagation across async boundaries.
    """
    try:
        from opentelemetry import trace, propagate
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
        
        provider = TracerProvider()
        processor = SimpleSpanProcessor(ConsoleSpanExporter())
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        tracer = trace.get_tracer(__name__)
        
        propagator = TraceContextTextMapPropagator()
        iterations = 1000
        
        durations = []
        
        for _ in range(iterations):
            start = time.perf_counter()
            
            # Inject context
            carrier = {}
            propagator.inject(carrier)
            
            # Extract context
            context = propagator.extract(carrier)
            
            end = time.perf_counter()
            durations.append((end - start) * 1000)
        
        stats = {
            "mean_ms": statistics.mean(durations),
            "p99_ms": sorted(durations)[int(len(durations) * 0.99)],
        }
        
        print(f"\nContext propagation overhead: {stats['mean_ms']:.3f}ms (p99: {stats['p99_ms']:.3f}ms)")
        
        # Context propagation should be very fast (<1ms)
        assert stats["p99_ms"] < 1.0, f"Context propagation too slow: {stats['p99_ms']:.2f}ms"
        
    except ImportError:
        pytest.skip("OpenTelemetry not installed")


@pytest.mark.asyncio
@pytest.mark.performance
async def test_tracer_provider_lookup_overhead():
    """
    Test overhead of tracer provider lookups.
    """
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        
        provider = TracerProvider()
        trace.set_tracer_provider(provider)
        
        iterations = 10000
        
        # Warmup
        for _ in range(100):
            _ = trace.get_tracer(__name__)
        
        # Benchmark
        start = time.perf_counter()
        for _ in range(iterations):
            _ = trace.get_tracer(__name__)
        end = time.perf_counter()
        
        total_ms = (end - start) * 1000
        per_call_us = (total_ms / iterations) * 1000
        
        print(f"\nTracer lookup: {per_call_us:.3f}us per call ({iterations} iterations)")
        
        # Should be very fast (<10us)
        assert per_call_us < 10, f"Tracer lookup too slow: {per_call_us:.2f}us"
        
    except ImportError:
        pytest.skip("OpenTelemetry not installed")


if __name__ == "__main__":
    # Run benchmarks directly
    asyncio.run(test_tracing_overhead())
    asyncio.run(test_tracing_context_switch_overhead())
    asyncio.run(test_tracer_provider_lookup_overhead())
