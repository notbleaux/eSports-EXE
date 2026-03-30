"""NJZ API middleware package.

[Ver001.000]
"""

from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitBreakerOpen,
    CircuitState,
    circuit_breaker,
    circuit_breaker_with_config,
    create_circuit_breaker,
    get_all_circuit_breakers,
    get_circuit_breaker,
    get_circuit_breaker_status,
    remove_circuit_breaker,
    reset_circuit_breaker,
)
from .lineage import DataLineageMiddleware, track_lineage
from .rbac import (
    Permission,
    RBACManager,
    Role,
    UserPrincipal,
    get_current_principal,
    get_rbac_manager,
    require_admin,
    require_any_permission,
    require_permission,
)

__all__ = [
    # Circuit Breaker
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitBreakerOpen",
    "CircuitState",
    "circuit_breaker",
    "circuit_breaker_with_config",
    "create_circuit_breaker",
    "get_all_circuit_breakers",
    "get_circuit_breaker",
    "get_circuit_breaker_status",
    "remove_circuit_breaker",
    "reset_circuit_breaker",
    # Data Lineage
    "DataLineageMiddleware",
    "track_lineage",
    # RBAC
    "Permission",
    "RBACManager",
    "Role",
    "UserPrincipal",
    "get_current_principal",
    "get_rbac_manager",
    "require_admin",
    "require_any_permission",
    "require_permission",
]
