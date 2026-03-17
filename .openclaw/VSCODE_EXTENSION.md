# VS Code: ACP Client Extension

**Production-ready ACP client using the official @agentclientprotocol/sdk**

## Overview

This VS Code: extension provides native integration with ACP (Agent Client Protocol) agents including:
- **Kimi CLI** (`kimi acp`)
- **OpenClaw Bridge** (our custom Python bridge)
- Any ACP-compliant agent

## Features

### ✅ Full ACP Protocol Support
- JSON-RPC 2.0 communication
- Session management (new, load, list)
- Real-time message streaming
- Tool call lifecycle tracking
- Permission request UI
- Mode switching (ask/architect/code)
- Cancellation support

### ✅ VS Code: Integration
- File system operations via VS Code: APIs
- Terminal creation and management
- Status bar integration
- Output channel logging
- Webview chat panel
- Command palette commands
- Keyboard shortcuts

### ✅ Type Safety
- Full TypeScript implementation
- Type definitions from official SDK
- Compile-time error checking

---

## Installation

### Option 1: Automated Setup (Recommended)

```powershell
# Run the setup script
.openclaw/setup-vscode-extension.ps1 -Install
```

### Option 2: Manual Installation

```powershell
# 1. Install dependencies
cd .openclaw
npm install

# 2. Compile TypeScript
npm run compile

# 3. Package extension
npx vsce package

# 4. Install in VS Code:
code --install-extension vscode-acp-client.vsix
```

### Option 3: Development Mode

```powershell
# Run in VS Code: development mode
.openclaw/setup-vscode-extension.ps1 -Dev
```

---

## Usage

### Starting an Agent

1. **Command Palette** (`Ctrl+Shift+P`):
   - Type "ACP: Start Kimi Agent" or "ACP: Start OpenClaw Bridge"

2. **Status Bar**:
   - Click the ACP status item to see available actions

3. **Keyboard Shortcut**:
   - `Ctrl+Shift+A` - Open chat panel

### Available Commands

| Command | Description |
|---------|-------------|
| `ACP: Start Kimi Agent` | Start kimi acp as agent |
| `ACP: Start OpenClaw Bridge` | Start Python bridge as agent |
| `ACP: Stop Agent` | Stop current agent |
| `ACP: New Session` | Create new session |
| `ACP: Open Chat` | Open chat webview |
| `ACP: Send Prompt` | Send message to agent |
| `ACP: Set Mode` | Change agent mode |
| `ACP: Cancel` | Cancel current prompt |

### Chat Interface

The chat panel provides:
- Real-time message streaming
- Tool call visualization
- Error display
- Command history

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS CODE:                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Command      │  │ Status Bar   │  │ Chat Webview         │  │
│  │ Palette      │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼────────────────┼─────────────────────┼──────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VSCode:ACPClient                                │
│         (implements acp.Client interface)                        │
│                                                                  │
│  • requestPermission()  → Shows VS Code: quick pick              │
│  • sessionUpdate()      → Streams to webview                    │
│  • readTextFile()       → Uses vscode.workspace.fs               │
│  • writeTextFile()      → Uses vscode.workspace.fs               │
│  • createTerminal()     → Uses vscode.window.createTerminal      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ @agentclientprotocol/sdk
                     │ ClientSideConnection
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ACP AGENT                                │
│                    (kimi acp / bridge)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
.openclaw/
├── vscode-acp-client.ts      # Main client class (ACP implementation)
├── vscode-extension.ts       # VS Code: extension entry point
├── package-vscode.json       # Extension manifest template
├── tsconfig.json             # TypeScript config
├── setup-vscode-extension.ps1 # Setup script
└── out/                      # Compiled JavaScript
    ├── vscode-acp-client.js
    ├── vscode-extension.js
    └── *.js.map
```

---

## Comparison: Official SDK vs Custom

### What We Gained by Using Official SDK

| Aspect | Custom Python | Official SDK |
|--------|---------------|--------------|
| **Type Safety** | ❌ None | ✅ Full TypeScript |
| **Error Handling** | ❌ Manual | ✅ Built-in validation |
| **Cancellation** | ⚠️ Basic | ✅ AbortController |
| **Stream Handling** | ❌ Manual | ✅ ndJsonStream |
| **Protocol Updates** | ❌ Manual tracking | ✅ SDK updates |
| **Maintenance** | ❌ Custom code | ✅ Community maintained |

### Trade-offs

| Aspect | Consideration |
|--------|---------------|
| **Bundle Size** | +39KB for SDK |
| **Dependencies** | npm ecosystem required |
| **Learning Curve** | SDK API to learn |
| **Flexibility** | Less low-level control |

### Verdict

**For VS Code: extension: Official SDK is the right choice**

- Type safety catches bugs at compile time
- Automatic protocol compliance
- Proper cancellation support
- Future-proof with SDK updates

---

## Development

### Building

```powershell
cd .openclaw
npm run compile
```

### Testing

```powershell
# Run extension in debug mode
npm run watch
# Then press F5 in VS Code:
```

### Making Changes

1. Edit `.ts` files
2. `npm run compile` (or `npm run watch` for auto-rebuild)
3. Reload VS Code: window (`Ctrl+R` in extension host)

---

## Troubleshooting

### Extension Won't Load

```powershell
# Check compiled output exists
Test-Path .openclaw/out/vscode-extension.js

# Recompile
cd .openclaw
npm run compile
```

### Agent Won't Connect

1. Check agent is installed: `kimi --version`
2. Check agent protocol: `kimi info`
3. View output: View → Output → "ACP: Kimi CLI"

### Type Errors

```powershell
# Update TypeScript
cd .openclaw
npm install typescript@latest --save-dev

# Rebuild
npm run compile
```

---

## Resources

- **ACP Protocol:** https://agentclientprotocol.com
- **SDK Documentation:** https://agentclientprotocol.github.io/typescript-sdk
- **VS Code: Extension API:** https://code.visualstudio.com/api

---

**Status:** ✅ Production-ready ACP client implementation
