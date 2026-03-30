# ADR 004: React vs Vue vs Other Frontend Frameworks

## Status
✅ **Accepted** - React 18 with Vite

## Context

Frontend framework selection for the main web platform (hub-1 through hub-5). Evaluated options:

1. **React 18** - Meta's UI library with ecosystem
2. **Vue 3** - Progressive framework with Composition API
3. **Svelte** - Compiler-based approach
4. **SolidJS** - Fine-grained reactivity
5. **Angular** - Full-featured framework

## Decision

**Selected: React 18 with Vite build tool**

## Rationale

### Why React?

| Factor | React Advantage |
|--------|-----------------|
| **Ecosystem** | Largest UI component library ecosystem |
| **Hiring** | Most available frontend developers |
| **Integration** | Three.js, D3.js, TensorFlow.js all React-friendly |
| **State Management** | Zustand, TanStack Query mature and well-documented |
| **Visualization** | React Three Fiber for 3D SATOR Square |

### Why Not Vue?

Vue 3 is excellent but:
- Smaller ecosystem for specialized libraries (WebGL, ML)
- Team had existing React expertise
- React's concurrent features (Suspense, Transitions) fit real-time data needs

### Why Vite over Create React App?

| Feature | Vite | CRA |
|---------|------|-----|
| Dev server start | ~300ms | ~30s |
| HMR update | ~50ms | ~3s |
| Build time | 4s | 15s |
| Modern output | ESM native | Webpack legacy |

## Consequences

### Positive
- **Fast Development**: Vite HMR enables rapid iteration
- **Rich Ecosystem**: Component libraries (Radix, Headless UI)
- **Visualization**: React Three Fiber for 3D components
- **TypeScript**: First-class TS support

### Negative
- **Bundle Size**: React larger than Vue/Svelte (mitigated by code splitting)
- **Complexity**: Hooks learning curve for new developers
- **Rapid Change**: Frequent updates require maintenance

## Implementation

```json
// apps/web/package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

## State Management Strategy

| State Type | Solution | Rationale |
|------------|----------|-----------|
| **Server State** | TanStack Query | Caching, synchronization, deduping |
| **Global UI** | Zustand | Simple, no boilerplate |
| **Local UI** | useState/useReducer | Component-level state |
| **Form State** | React Hook Form | Performance, validation |

## References

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Animation Guide](../ANIMATION_GUIDE.md)

---

*Decision Date: 2024-01-10*  
*Decision Maker: Frontend Team*  
*Last Reviewed: 2026-03-30*
