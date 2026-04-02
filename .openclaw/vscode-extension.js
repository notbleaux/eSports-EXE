"use strict";
/**
 * VS Code: Extension Entry Point for ACP Integration
 *
 * This extension provides:
 * - Command palette commands for ACP operations
 * - Status bar integration
 * - Webview panel for agent chat
 * - File tree decorations for agent-modified files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const vscode_acp_client_1 = require("./vscode-acp-client");
let acpClient;
let chatPanel;
/**
 * Extension activation
 */
function activate(context) {
    console.log("ACP extension activated");
    // Register commands
    const commands = [
        vscode.commands.registerCommand("acp.startKimi", () => startAgent(context, "kimi")),
        vscode.commands.registerCommand("acp.startBridge", () => startAgent(context, "bridge")),
        vscode.commands.registerCommand("acp.stop", stopAgent),
        vscode.commands.registerCommand("acp.newSession", newSession),
        vscode.commands.registerCommand("acp.openChat", () => openChatPanel(context)),
        vscode.commands.registerCommand("acp.sendPrompt", sendPrompt),
        vscode.commands.registerCommand("acp.setMode", setMode),
        vscode.commands.registerCommand("acp.cancel", cancelPrompt),
    ];
    context.subscriptions.push(...commands);
    // Register tree data provider for sessions
    const sessionTreeProvider = new ACPSessionTreeProvider();
    vscode.window.registerTreeDataProvider("acpSessions", sessionTreeProvider);
}
/**
 * Extension deactivation
 */
function deactivate() {
    stopAgent();
}
// ====================================================================
// Command Handlers
// ====================================================================
async function startAgent(context, type) {
    try {
        // Stop existing agent if any
        if (acpClient) {
            stopAgent();
        }
        // Create appropriate client
        acpClient = type === "kimi"
            ? (0, vscode_acp_client_1.createKimiACPClient)(context)
            : (0, vscode_acp_client_1.createBridgeACPClient)(context);
        // Set up event handlers
        acpClient.onMessage((text) => {
            chatPanel?.webview.postMessage({
                type: "agentMessage",
                text,
            });
        });
        acpClient.onToolCall((tool) => {
            chatPanel?.webview.postMessage({
                type: "toolCall",
                tool,
            });
        });
        // Start the agent
        await acpClient.start();
        // Create a new session automatically
        await acpClient.createSession();
        // Open chat panel
        openChatPanel(context);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start ACP agent: ${error}`);
    }
}
function stopAgent() {
    if (acpClient) {
        acpClient.stop();
        acpClient = undefined;
        vscode.window.showInformationMessage("ACP agent stopped");
    }
}
async function newSession() {
    if (!acpClient?.isConnected()) {
        vscode.window.showWarningMessage("No ACP agent connected. Start an agent first.");
        return;
    }
    try {
        const sessionId = await acpClient.createSession();
        vscode.window.showInformationMessage(`New session created: ${sessionId}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to create session: ${error}`);
    }
}
async function sendPrompt() {
    if (!acpClient?.isConnected()) {
        vscode.window.showWarningMessage("No ACP agent connected. Start an agent first.");
        return;
    }
    const prompt = await vscode.window.showInputBox({
        prompt: "Enter your message to the agent",
        placeHolder: "e.g., Explain this codebase to me",
        ignoreFocusOut: true,
    });
    if (!prompt)
        return;
    try {
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Agent is thinking...",
            cancellable: true,
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                acpClient?.cancel();
            });
            const response = await acpClient.sendPrompt(prompt);
            vscode.window.showInformationMessage(`Agent completed: ${response.stopReason}`);
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Prompt failed: ${error}`);
    }
}
async function setMode() {
    if (!acpClient?.isConnected()) {
        vscode.window.showWarningMessage("No ACP agent connected.");
        return;
    }
    const mode = await vscode.window.showQuickPick([
        { label: "Ask", description: "Request permission before changes", value: "ask" },
        { label: "Architect", description: "Design without implementation", value: "architect" },
        { label: "Code", description: "Write and modify code", value: "code" },
    ], { placeHolder: "Select agent mode" });
    if (!mode)
        return;
    try {
        await acpClient.setMode(mode.value);
        vscode.window.showInformationMessage(`Agent mode set to: ${mode.label}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to set mode: ${error}`);
    }
}
function cancelPrompt() {
    if (!acpClient?.isConnected()) {
        return;
    }
    acpClient.cancel();
    vscode.window.showInformationMessage("Cancelled current prompt");
}
// ====================================================================
// Chat Panel
// ====================================================================
function openChatPanel(context) {
    if (chatPanel) {
        chatPanel.reveal(vscode.ViewColumn.Beside);
        return;
    }
    chatPanel = vscode.window.createWebviewPanel("acpChat", "ACP Chat", vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
    });
    chatPanel.webview.html = getChatHtml();
    // Handle messages from webview
    chatPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
            case "sendMessage":
                if (acpClient?.isConnected()) {
                    try {
                        await acpClient.sendPrompt(message.text);
                    }
                    catch (error) {
                        chatPanel?.webview.postMessage({
                            type: "error",
                            text: String(error),
                        });
                    }
                }
                else {
                    chatPanel?.webview.postMessage({
                        type: "error",
                        text: "No agent connected. Start an agent first.",
                    });
                }
                break;
        }
    }, undefined, context.subscriptions);
    chatPanel.onDidDispose(() => {
        chatPanel = undefined;
    });
}
function getChatHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ACP Chat</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      margin: 0;
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 100vh;
      box-sizing: border-box;
    }
    #messages {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 16px;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background: var(--vscode-input-background);
    }
    .message {
      margin: 8px 0;
      padding: 8px;
      border-radius: 4px;
    }
    .user {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      text-align: right;
    }
    .agent {
      background: var(--vscode-editor-inactiveSelectionBackground);
    }
    .tool {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-size: 0.9em;
    }
    #input-area {
      display: flex;
      gap: 8px;
    }
    #messageInput {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: inherit;
    }
    button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .error {
      background: var(--vscode-errorForeground);
      color: var(--vscode-editor-background);
    }
  </style>
</head>
<body>
  <div id="messages"></div>
  <div id="input-area">
    <input type="text" id="messageInput" placeholder="Type your message..." />
    <button onclick="sendMessage()">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('messageInput');

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = 'message ' + type;
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      vscode.postMessage({ type: 'sendMessage', text });
      input.value = '';
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'agentMessage':
          addMessage(message.text, 'agent');
          break;
        case 'toolCall':
          addMessage('🔧 ' + message.tool.title + ' (' + message.tool.status + ')', 'tool');
          break;
        case 'error':
          addMessage('❌ ' + message.text, 'error');
          break;
      }
    });

    // Focus input on load
    input.focus();
  </script>
</body>
</html>`;
}
// ====================================================================
// Tree Data Provider
// ====================================================================
class ACPSessionTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level
            return Promise.resolve([
                new ACPTreeItem("Status", acpClient?.isConnected() ? "Connected" : "Disconnected", acpClient?.isConnected()
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.None),
                new ACPTreeItem("Session", acpClient?.getSessionId() || "No active session", vscode.TreeItemCollapsibleState.None),
            ]);
        }
        return Promise.resolve([]);
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}
class ACPTreeItem extends vscode.TreeItem {
    constructor(label, description, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${label}: ${description}`;
    }
}
//# sourceMappingURL=vscode-extension.js.map