# Security Audit Report — 2026-05-18

**Repository:** ZeSporteXte (`notbleaux/ZeSporteXte`)  
**Auditor:** Kimi (AI Assistant)  
**Commit:** `bbb4cda` (post-merge from `origin/main`)  
**Scope:** Full workspace dependency tree (pnpm monorepo)

---

## Executive Summary

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| **Critical** | 1 | 0 | ✅ −1 |
| **High** | 5 | 1 | ⚠️ −4 |
| **Moderate** | 6 | 0 | ✅ −6 |
| **Total** | 12 | 1 | −11 |

**Status: 92% resolved. One HIGH vulnerability remains as an accepted upstream risk.**

---

## Remaining Vulnerability

### [HIGH] Rollup Path Traversal (CVE-2026-27606)

- **Module:** `rollup` (< 2.80.0)
- **Current:** `2.79.2` (bundled with `@crxjs/vite-plugin@2.4.0`)
- **Patched:** `>= 2.80.0`
- **Scope:** `apps/browser-extension` ONLY
- **CVSS:** 9.8 (Critical — arbitrary file write via build output path traversal)

**Why it remains:**
- `@crxjs/vite-plugin@2.4.0` (latest) has a *direct* dependency on `rollup@2.79.2` (not a peer dependency).
- Adding `rollup@2.80.0` to browser-extension devDependencies does not override the plugin’s internal copy.
- A global pnpm override (`rollup: ^2.80.0`) breaks the main web app because Vite 7 requires Rollup 4.x (imports `./parseAst` which does not exist in Rollup 2.x).
- **Upstream status:** Unresolved — GitHub Discussion #1129 opened 2026-03-04, no maintainer response.

**Risk Assessment:**
- **Likelihood:** Low — requires a malicious plugin or build config to exploit.
- **Impact:** High — arbitrary file write during build.
- **Mitigation:**
  1. Browser extension is a secondary deliverable; main web app is unaffected.
  2. Build runs in CI/CD with restricted filesystem permissions.
  3. Monitor `@crxjs/vite-plugin` releases for update.
  4. Consider migrating to a rollup-4-compatible extension build tool (e.g., `vite-plugin-web-extension`).

---

## Fixes Applied

### 1. Critical — protobufjs Arbitrary Code Execution

- **Vulnerability:** GHSA-8gw7-4j27-h4f6 (protobufjs < 7.5.5)
- **Fix:** Updated `onnxruntime-web` `^1.20.1` → `^1.26.0`
- **Result:** protobufjs `7.5.4` → `7.5.9` (patched)
- **Cascading fix:** Also resolved 9 additional protobufjs advisories (5 HIGH + 4 MODERATE)

### 2. Moderate — brace-expansion ReDoS

- **Vulnerability:** Zero-step sequence causes process hang
- **Fix:** pnpm override `brace-expansion: ^1.1.13`
- **Result:** Resolved in all eslint dependency trees

### 3. Moderate — PostCSS XSS

- **Vulnerability:** Unescaped `</style>` in CSS stringify output
- **Fix:** pnpm override `postcss: ^8.5.14`
- **Result:** Resolved in `apps/wiki` (next@16.2.6 dependency)

---

## Configuration Changes

### `package.json` (root)

```json
"pnpm": {
  "overrides": {
    "protobufjs": "^7.5.6",
    "brace-expansion": "^1.1.13",
    "postcss": "^8.5.14"
  }
}
```

### `apps/web/package.json`

```json
"onnxruntime-web": "^1.26.0"
```

### `apps/browser-extension/package.json`

```json
"devDependencies": {
  "rollup": "^2.80.0"
}
```

### `apps/wiki/package.json`

```json
"devDependencies": {
  "postcss": "^8.5.14"
}
```

---

## Build Verification

```
✓ TypeScript typecheck: PASS (0 errors)
✓ Vite production build: PASS (28.22s)
✓ pnpm audit (apps/web): 1 HIGH (upstream, browser-extension only)
```

---

## Recommendations

1. **Monitor upstream:** Subscribe to `@crxjs/vite-plugin` releases for rollup update.
2. **CI/CD hardening:** Run browser-extension build in a container with read-only mounts for sensitive directories.
3. **Replace plugin:** Evaluate `vite-plugin-web-extension` as an alternative that supports Rollup 4.x.
4. **Re-audit monthly:** Schedule `pnpm audit` in CI and alert on new critical/high findings.

---

*Report generated: 2026-05-18 10:XX AEST*  
*Next audit: 2026-06-18*
