[Ver001.000]

# Round 1 Discovery Beta: Dependencies Audit Report

## Executive Summary

| Metric | Count |
|--------|-------|
| Python Packages | 21 |
| Node.js Production Dependencies | 20 |
| Node.js Dev Dependencies | 28 |
| Total Node Packages (installed) | 811 |
| Security Issues | 2 (Moderate) |
| **Status** | **⚠️ NEEDS ATTENTION** |

---

## Python Dependencies Analysis

### Core Framework (12 packages)

| Package | Specified | Purpose | Status |
|---------|-----------|---------|--------|
| fastapi | >=0.104.0 | Web framework | ✅ Current stable |
| uvicorn[standard] | >=0.24.0 | ASGI server | ✅ With standard extras |
| asyncpg | >=0.29.0 | Async PostgreSQL | ✅ Latest stable |
| redis | >=5.0.0 | Redis client | ✅ Version 5.x |
| httpx | >=0.25.0 | HTTP client | ✅ Modern requests alternative |
| python-dotenv | >=1.0.0 | Environment config | ✅ v1.0+ stable |
| pydantic | >=2.5.0 | Data validation | ✅ V2 major version |
| pydantic-settings | >=2.1.0 | Settings management | ✅ Pydantic v2 compatible |
| pydantic[email] | >=2.5.0 | Email validation | ✅ Extra dependency |
| python-jose[cryptography] | >=3.3.0 | JWT handling | ✅ With crypto backend |
| passlib[bcrypt] | >=1.7.4 | Password hashing | ✅ With bcrypt |
| slowapi | >=0.1.9 | Rate limiting | ✅ FastAPI compatible |

### Phase 2/3 Additions (4 packages)

| Package | Specified | Purpose | Status |
|---------|-----------|---------|--------|
| pyotp | >=2.9.0 | 2FA/TOTP generation | ✅ **Present** |
| qrcode | >=7.4.2 | QR code generation | ✅ **Present** |
| cryptography | >=41.0.0 | Cryptographic operations | ✅ **Present** |
| pywebpush | >=1.14.0 | Web Push notifications | ✅ **Present** |

### Testing Dependencies (3 packages)

| Package | Specified | Purpose | Status |
|---------|-----------|---------|--------|
| pytest | >=7.4.0 | Test framework | ✅ Modern version |
| pytest-asyncio | >=0.21.0 | Async test support | ✅ Required for asyncpg |
| pytest-cov | >=4.1.0 | Coverage reporting | ✅ Standard plugin |

### Python Security Assessment

| Check | Status | Notes |
|-------|--------|-------|
| All Phase 2/3 deps present | ✅ PASS | pyotp, qrcode, cryptography, pywebpush all present |
| Version constraints | ✅ PASS | All use >= (minimum versions) |
| Major version compatibility | ✅ PASS | Pydantic v2, Python 3.11+ compatible |
| Known vulnerabilities | ⚠️ REVIEW | Requires `safety check` for full assessment |
| No conflicting versions | ✅ PASS | No version conflicts detected |

### Python Findings

**✅ Positive:**
- All Phase 2/3 authentication dependencies are present (pyotp, qrcode, cryptography, pywebpush)
- Pydantic v2 migration complete (>=2.5.0)
- Proper async stack (asyncpg, uvicorn[standard], pytest-asyncio)
- Standard security libraries (python-jose, passlib, cryptography)

**⚠️ Recommendations:**
1. Run `safety check -r packages/shared/requirements.txt` for CVE scanning
2. Consider pinning to specific versions for production stability
3. Add `psycopg2-binary` as fallback for synchronous operations
4. Consider adding `alembic` for database migrations

---

## Node.js Dependencies Analysis

### Production Dependencies (20 packages)

| Package | Specified | Resolved | Purpose | Status |
|---------|-----------|----------|---------|--------|
| react | ^18.2.0 | 18.3.1 | UI library | ✅ Latest stable |
| react-dom | ^18.2.0 | 18.3.1 | DOM renderer | ✅ Matched with react |
| react-router-dom | ^6.20.0 | 6.30.3 | Routing | ✅ v6 stable |
| zustand | ^4.4.0 | 4.5.7 | State management | ✅ Latest 4.x |
| @tanstack/react-query | ^5.90.21 | 5.90.21 | Data fetching | ✅ Latest |
| @tanstack/react-virtual | ^3.13.22 | 3.13.22 | Virtual scrolling | ✅ Latest |
| framer-motion | ^10.16.0 | 10.18.0 | Animation | ✅ v10 stable |
| gsap | ^3.12.0 | 3.14.2 | Animation library | ✅ Latest |
| @gsap/react | ^2.0.0 | 2.1.2 | GSAP React integration | ✅ Latest |
| three | ^0.158.0 | 0.158.0 | 3D library | ✅ Locked version |
| @react-three/fiber | ^8.15.0 | 8.18.0 | React Three.js | ✅ Latest 8.x |
| @react-three/drei | ^9.90.0 | 9.122.0 | Three.js helpers | ✅ Latest 9.x |
| d3 | ^7.9.0 | 7.9.0 | Data visualization | ✅ Latest v7 |
| recharts | ^3.8.0 | 3.8.0 | Chart library | ⚠️ v2 also available |
| @tensorflow/tfjs | ^4.22.0 | 4.22.0 | ML in browser | ✅ Latest |
| @tensorflow/tfjs-backend-wasm | ^4.22.0 | 4.22.0 | WASM backend | ✅ Matched |
| @tensorflow/tfjs-backend-webgpu | ^4.22.0 | 4.22.0 | WebGPU backend | ✅ Matched |
| onnxruntime-web | ^1.20.1 | 1.24.3 | ONNX inference | ✅ Latest |
| react-grid-layout | ^2.2.2 | 2.2.2 | Draggable grids | ✅ Latest |
| scheduler | ^0.21.0 | 0.21.0 | React scheduler | ⚠️ React 18 uses 0.23 |
| lucide-react | ^0.294.0 | 0.294.0 | Icons | ✅ Stable |
| clsx | ^2.1.1 | 2.1.1 | Class name utilities | ✅ Latest |
| tailwind-merge | ^3.5.0 | 3.5.0 | Tailwind class merge | ✅ Latest |

### Development Dependencies (28 packages)

| Category | Packages |
|----------|----------|
| **Build Tools** | vite@5.4.21, @vitejs/plugin-react@4.7.0, typescript@5.9.3, ts-node@10.9.2 |
| **Testing** | @playwright/test@1.58.2, vitest@4.1.0, @vitest/coverage-v8@4.1.0, @testing-library/react@16.3.2, @testing-library/jest-dom@6.9.1, jsdom@28.1.0, msw@2.12.10 |
| **Linting** | eslint@9.39.4, @eslint/js@9.39.4, @typescript-eslint/eslint-plugin@8.57.0, @typescript-eslint/parser@8.57.0, eslint-plugin-react@7.37.5, eslint-plugin-react-hooks@7.0.1, eslint-plugin-react-refresh@0.5.2, globals@14.0.0 |
| **Styling** | tailwindcss@3.4.19, autoprefixer@10.4.27, postcss@8.5.8 |
| **Types** | @types/react@18.3.28, @types/react-dom@18.3.7, @types/node@25.5.0, @types/react-grid-layout@1.3.6, @types/ws@8.18.1 |
| **Utilities** | ws@8.19.0 |

### Workspace Configuration

| Check | Status | Notes |
|-------|--------|-------|
| Workspaces enabled | ✅ PASS | `packages/*`, `apps/*`, `api` |
| Version consistency | ⚠️ REVIEW | Root: 2.0.0, website-v2: 2.0.0 |
| Dev vs Prod separation | ✅ PASS | Clear separation in package.json |
| Unused dependencies | ⚠️ REVIEW | See findings below |

---

## Security Findings

### Node.js Security Issues (2 Moderate)

| Package | Severity | CVE | Issue | Affected Range | Fix Available |
|---------|----------|-----|-------|----------------|---------------|
| esbuild | Moderate | GHSA-67mh-4wv8-2f99 | Development server CORS bypass | <=0.24.2 | vite@6.2.6+ |
| vite | Moderate | (via esbuild) | Depends on vulnerable esbuild | 0.11.0 - 6.1.6 | vite@8.0.0 (breaking) |

**Details:**
- **esbuild vulnerability**: Development server allows any website to send requests and read responses (CWE-346)
- **CVSS Score**: 5.3 (Medium)
- **Impact**: Development server only - NOT production
- **Exploitability**: Requires user interaction, high complexity

### Security Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 HIGH | Upgrade vite to 6.2.6+ (esbuild 0.25.2+) | Fixes dev server vulnerability |
| 🟡 MEDIUM | Run `npm audit fix` periodically | Maintains security posture |
| 🟢 LOW | Consider adding `audit-ci` to CI/CD | Automated security checking |

---

## Missing Dependencies Analysis

### Potentially Missing (Recommended)

| Package | Type | Reason | Priority |
|---------|------|--------|----------|
| @types/d3 | dev | D3 has no built-in types | Medium |
| @types/three | dev | Three.js type definitions | Medium |
| @types/scheduler | dev | React scheduler types | Low |
| sharp | dev | Image optimization (Vite) | Low |

### Version Compatibility Notes

| Package | Current | Recommended | Reason |
|---------|---------|-------------|--------|
| scheduler | 0.21.0 | 0.23.0 | React 18.3 internal dependency |
| recharts | 3.8.0 | 2.x or 3.x | 3.x is beta, consider 2.15 for stability |
| vite | 5.4.21 | 6.2.6+ | Security fix available |

---

## Architecture Compliance Check

### TENET Platform Requirements

| Requirement | Package | Status |
|-------------|---------|--------|
| 3D Visualization | three, @react-three/fiber, @react-three/drei | ✅ Present |
| ML/AI | @tensorflow/tfjs, onnxruntime-web | ✅ Present |
| Data Visualization | d3, recharts | ✅ Present |
| State Management | zustand, @tanstack/react-query | ✅ Present |
| Animation | framer-motion, gsap | ✅ Present |
| Virtual Scrolling | @tanstack/react-virtual | ✅ Present |
| Grid Layout | react-grid-layout | ✅ Present |
| Real-time | ws (dev) | ✅ Available |

---

## Final Recommendations

### Immediate Actions (High Priority)

1. **Security**: Upgrade vite to 6.2.6+ to resolve esbuild vulnerability
   ```bash
   cd apps/website-v2
   npm update vite@6.2.6
   ```

2. **Type Safety**: Add missing type definitions
   ```bash
   npm install -D @types/d3 @types/three
   ```

### Short-term Improvements (Medium Priority)

3. **Python**: Add `safety` to pre-commit hooks for CVE scanning
4. **Node**: Consider pinning critical dependencies for reproducibility
5. **Both**: Add `scheduler` version alignment check (should match React's internal)

### Long-term Considerations (Low Priority)

6. **Python**: Consider adding `alembic` for database migrations
7. **Node**: Evaluate recharts v3 beta stability vs v2 LTS
8. **Monorepo**: Add dependency synchronization check between root and workspaces

---

## Appendix: Dependency Count Summary

| Category | Direct | Transitive | Total |
|----------|--------|------------|-------|
| Python | 21 | Unknown | 21+ |
| Node Production | 20 | 243 | 263 |
| Node Development | 28 | 551 | 579 |
| **Node Total** | **48** | **763** | **811** |

---

*Report generated: 2026-03-16*
*Audited files: packages/shared/requirements.txt, apps/website-v2/package.json, package.json (root)*
