"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const vscode_acp_client_1 = require("./vscode-acp-client");
let acpClient;
let chatPanel;
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
            const status = acpClient?.isConnected() ? "Connected" : "Disconnected";
            const statusItem = new vscode.TreeItem(`Status: ${status}`, status === "Connected"
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None);
            const sessionItem = new vscode.TreeItem("Session", vscode.TreeItemCollapsibleState.None);
            sessionItem.description = "Active";
            return Promise.resolve([statusItem, sessionItem]);
        }
        return Promise.resolve([]);
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}
function activate(context) {
    console.log("ACP extension activated");
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
    const sessionTreeProvider = new ACPSessionTreeProvider();
    vscode.window.registerTreeDataProvider("acpSessions", sessionTreeProvider);
}
async function startAgent(context, type) {
    try {
        if (acpClient)
            stopAgent();
        acpClient =
            type === "kimi"
                ? (0, vscode_acp_client_1.createKimiACPClient)(context)
                : (0, vscode_acp_client_1.createBridgeACPClient)(context);
        await acpClient.start();
        await acpClient.createSession();
        openChatPanel(context);
        vscode.window.showInformationMessage(`ACP ${type} agent started`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start ACP agent: ${error}`);
    }
}
function stopAgent() {
    acpClient?.stop();
    acpClient = undefined;
    vscode.window.showInformationMessage("ACP agent stopped");
}
function openChatPanel(context) {
    if (chatPanel) {
        chatPanel.reveal(vscode.ViewColumn.Beside);
        return;
    }
    chatPanel = vscode.window.createWebviewPanel("acpChat", "ACP Chat", vscode.ViewColumn.Beside, { enableScripts: true });
    chatPanel.webview.html = `<!DOCTYPE html>
<html>
<head><meta charset=\"UTF-8\"><title>ACP Chat</title></head>
<body><div id=\"messages\"></div><input id=\"input\" placeholder=\"Type message...\"><button onclick=\"send()\">Send</button>
<script>
const vscode = acquireVsCodeApi();
document.getElementById('input').addEventListener('keypress', e => { if (e.key === 'Enter') send(); });
function send() { vscode.postMessage({type: 'sendMessage', text: document.getElementById('input').value}); document.getElementById('input').value = ''; }
</script></body></html>`;
    chatPanel.webview.onDidReceiveMessage(async (message) => {
        if (message.type === "sendMessage" && acpClient) {
            const response = await acpClient.sendPrompt(message.text);
            chatPanel?.webview.postMessage({
                type: "agentMessage",
                text: response.response,
            });
        }
    });
}
function deactivate() {
    stopAgent();
}
async function newSession() {
    if (acpClient) {
        const sessionId = await acpClient.createSession();
        vscode.window.showInformationMessage(`New session: ${sessionId}`);
    }
}
async function sendPrompt() {
    const prompt = await vscode.window.showInputBox({
        prompt: "Message to agent",
    });
    if (prompt && acpClient) {
        const response = await acpClient.sendPrompt(prompt);
        vscode.window.showInformationMessage(response.response);
    }
}
async function setMode() {
    const mode = await vscode.window.showQuickPick(["ask", "architect", "code"]);
    if (mode && acpClient)
        acpClient.setMode(mode);
}
function cancelPrompt() {
    acpClient?.cancel();
}
//# sourceMappingURL=extension.js.map