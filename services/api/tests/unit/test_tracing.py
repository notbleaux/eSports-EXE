"""
Unit tests for distributed tracing.

[Ver001.000]
"""

import pytest
from unittest.mock import Mock, patch, MagicMock


class TestTracingManager:
    """Test TracingManager functionality."""
    
    @pytest.mark.asyncio
    async def test_tracing_manager_initialization(self):
        """Test that TracingManager can be initialized."""
        try:
            from src.njz_api.observability.tracing import TracingManager, TracingBackend
            
            manager = TracingManager(
                service_name="test-service",
                backend=TracingBackend.CONSOLE,
                enabled=True,
            )
            
            assert manager.service_name == "test-service"
            assert manager.backend == TracingBackend.CONSOLE
            assert manager.enabled is True
            
        except ImportError:
            pytest.skip("OpenTelemetry not installed")
    
    @pytest.mark.asyncio
    async def test_tracing_manager_disabled(self):
        """Test that disabled tracing manager returns None spans."""
        from src.njz_api.observability.tracing import TracingManager
        
        manager = TracingManager(enabled=False)
        
        # Should not raise when disabled
        with manager.start_span("test") as span:
            assert span is None
    
    @pytest.mark.asyncio
    async def test_span_creation(self):
        """Test basic span creation."""
        try:
            from src.njz_api.observability.tracing import TracingManager, TracingBackend
            
            manager = TracingManager(
                service_name="test",
                backend=TracingBackend.CONSOLE,
            )
            
            with manager.start_span("test_operation", {"test.attr": "value"}) as span:
                # Span should be created (or None if OTel not available)
                pass
                
        except ImportError:
            pytest.skip("OpenTelemetry not installed")
    
    def test_get_tracing_manager_singleton(self):
        """Test that get_tracing_manager returns singleton."""
        from src.njz_api.observability.tracing import get_tracing_manager
        
        manager1 = get_tracing_manager()
        manager2 = get_tracing_manager()
        
        assert manager1 is manager2


class TestTraceAttributes:
    """Test TraceAttributes constants."""
    
    def test_attribute_constants(self):
        """Test that attribute constants are defined."""
        from src.njz_api.observability.tracing import TraceAttributes
        
        # HTTP attributes
        assert hasattr(TraceAttributes, "HTTP_METHOD")
        assert hasattr(TraceAttributes, "HTTP_URL")
        assert hasattr(TraceAttributes, "HTTP_STATUS_CODE")
        
        # DB attributes
        assert hasattr(TraceAttributes, "DB_SYSTEM")
        assert hasattr(TraceAttributes, "DB_STATEMENT")
        assert hasattr(TraceAttributes, "DB_OPERATION")
        
        # Cache attributes
        assert hasattr(TraceAttributes, "CACHE_KEY")
        assert hasattr(TraceAttributes, "CACHE_HIT")


class TestDecorators:
    """Test tracing decorators."""
    
    @pytest.mark.asyncio
    async def test_trace_function_decorator(self):
        """Test trace_function decorator."""
        from src.njz_api.observability.tracing import trace_function
        
        @trace_function("test_operation", component="test")
        async def test_func():
            return "result"
        
        result = await test_func()
        assert result == "result"
    
    @pytest.mark.asyncio
    async def test_trace_function_exception(self):
        """Test that trace_function records exceptions."""
        from src.njz_api.observability.tracing import trace_function
        
        @trace_function("test_operation")
        async def test_func_error():
            raise ValueError("test error")
        
        with pytest.raises(ValueError):
            await test_func_error()


class TestDatabaseTracing:
    """Test database tracing components."""
    
    @pytest.mark.asyncio
    async def test_traced_pool_wraps_operations(self):
        """Test that TracedPool wraps asyncpg pool."""
        try:
            from src.njz_api.observability.database_tracing import TracedPool
            
            mock_pool = Mock()
            mock_pool.get_size.return_value = 5
            mock_pool.get_free_size.return_value = 3
            
            traced = TracedPool(mock_pool)
            
            assert traced.get_size() == 5
            assert traced.get_free_size() == 3
            
        except ImportError:
            pytest.skip("Database tracing not available")


class TestCacheTracing:
    """Test cache tracing components."""
    
    @pytest.mark.asyncio
    async def test_traced_redis_stats(self):
        """Test TracedRedis statistics."""
        try:
            from src.njz_api.observability.cache_tracing import TracedRedis
            
            mock_redis = Mock()
            traced = TracedRedis(mock_redis)
            
            stats = traced.get_stats()
            
            assert "hits" in stats
            assert "misses" in stats
            assert "hit_ratio" in stats
            
        except ImportError:
            pytest.skip("Cache tracing not available")


class TestWebSocketTracing:
    """Test WebSocket tracing components."""
    
    def test_godot_trace_bridge_extract(self):
        """Test GodotTraceBridge context extraction."""
        try:
            from src.njz_api.observability.websocket_tracing import GodotTraceBridge
            
            bridge = GodotTraceBridge()
            
            # Test W3C format
            headers = {
                "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"
            }
            
            # Should not raise
            context = bridge.extract_from_headers(headers)
            # Context may be None if OTel not available
            
        except ImportError:
            pytest.skip("WebSocket tracing not available")
    
    def test_godot_trace_bridge_inject(self):
        """Test GodotTraceBridge context injection."""
        try:
            from src.njz_api.observability.websocket_tracing import GodotTraceBridge
            
            bridge = GodotTraceBridge()
            
            headers = {}
            result = bridge.inject_to_headers(headers)
            
            # Should return headers dict
            assert isinstance(result, dict)
            
        except ImportError:
            pytest.skip("WebSocket tracing not available")


class TestObservabilitySetup:
    """Test observability setup functions."""
    
    def test_get_health_status(self):
        """Test that get_health_status returns expected structure."""
        try:
            from src.njz_api.observability import get_health_status
            
            status = get_health_status()
            
            assert "tracing" in status
            assert "database_tracing" in status
            assert "cache_tracing" in status
            
        except ImportError:
            pytest.skip("Observability not available")
    
    def test_setup_observability(self):
        """Test setup_observability function."""
        try:
            from fastapi import FastAPI
            from src.njz_api.observability import setup_observability
            
            app = FastAPI()
            
            # Should not raise
            components = setup_observability(app, enable_tracing=False)
            
            assert isinstance(components, dict)
            
        except ImportError:
            pytest.skip("Observability not available")


class TestTracingBackends:
    """Test tracing backend configurations."""
    
    def test_tracing_backend_enum(self):
        """Test TracingBackend enum values."""
        try:
            from src.njz_api.observability.tracing import TracingBackend
            
            assert TracingBackend.JAEGER.value == "jaeger"
            assert TracingBackend.OTLP_GRPC.value == "otlp_grpc"
            assert TracingBackend.OTLP_HTTP.value == "otlp_http"
            assert TracingBackend.CONSOLE.value == "console"
            
        except ImportError:
            pytest.skip("Tracing not available")


class TestPerformanceTargets:
    """Verify performance targets are defined."""
    
    def test_overhead_target_defined(self):
        """Test that performance target is defined."""
        try:
            from tests.performance.test_tracing_overhead import TracingOverheadBenchmark
            
            benchmark = TracingOverheadBenchmark()
            
            # Target should be <100ms
            assert benchmark.TARGET_OVERHEAD_MS == 100
            
        except ImportError:
            pytest.skip("Performance tests not available")
