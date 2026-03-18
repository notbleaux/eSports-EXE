import * as vscode from "vscode";
import {
  VSCodeACPClient,
  createKimiACPClient,
  createBridgeACPClient,
} from "./vscode-acp-client";

let acpClient: VSCodeACPClient | undefined;
let chatPanel: vscode.WebviewPanel | undefined;

class ACPSessionTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      const status = acpClient?.isConnected() ? "Connected" : "Disconnected";
      return Promise.resolve([
        new vscode.TreeItem(
          "Status",
          status === "Connected"
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None,
          status,
        ),
        new vscode.TreeItem(
          "Session",
          acpClient?.createSession() || "No active session",
        ),
      ]);
    }
    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log("ACP extension activated");

  const commands = [
    vscode.commands.registerCommand("acp.startKimi", () =>
      startAgent(context, "kimi"),
    ),
    vscode.commands.registerCommand("acp.startBridge", () =>
      startAgent(context, "bridge"),
    ),
    vscode.commands.registerCommand("acp.stop", stopAgent),
    vscode.commands.registerCommand("acp.newSession", newSession),
    vscode.commands.registerCommand("acp.openChat", () =>
      openChatPanel(context),
    ),
    vscode.commands.registerCommand("acp.sendPrompt", sendPrompt),
    vscode.commands.registerCommand("acp.setMode", setMode),
    vscode.commands.registerCommand("acp.cancel", cancelPrompt),
  ];

  context.subscriptions.push(...commands);

  const sessionTreeProvider = new ACPSessionTreeProvider();
  vscode.window.registerTreeDataProvider("acpSessions", sessionTreeProvider);
}

async function startAgent(
  context: vscode.ExtensionContext,
  type: "kimi" | "bridge",
): Promise<void> {
  try {
    if (acpClient) stopAgent();

    acpClient =
      type === "kimi"
        ? createKimiACPClient(context)
        : createBridgeACPClient(context);
    await acpClient.start();
    await acpClient.createSession();
    openChatPanel(context);
    vscode.window.showInformationMessage(`ACP ${type} agent started`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to start ACP agent: ${error}`);
  }
}

function stopAgent(): void {
  acpClient?.stop();
  acpClient = undefined;
  vscode.window.showInformationMessage("ACP agent stopped");
}

function openChatPanel(context: vscode.ExtensionContext): void {
  if (chatPanel) {
    chatPanel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  chatPanel = vscode.window.createWebviewPanel(
    "acpChat",
    "ACP Chat",
    vscode.ViewColumn.Beside,
    { enableScripts: true },
  );

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

export function deactivate() {
  stopAgent();
}

async function newSession(): Promise<void> {
  if (acpClient) {
    const sessionId = await acpClient.createSession();
    vscode.window.showInformationMessage(`New session: ${sessionId}`);
  }
}

async function sendPrompt(): Promise<void> {
  const prompt = await vscode.window.showInputBox({
    prompt: "Message to agent",
  });
  if (prompt && acpClient) {
    const response = await acpClient.sendPrompt(prompt);
    vscode.window.showInformationMessage(response.response);
  }
}

async function setMode(): Promise<void> {
  const mode = await vscode.window.showQuickPick(["ask", "architect", "code"]);
  if (mode && acpClient) acpClient.setMode(mode);
}

function cancelPrompt(): void {
  acpClient?.cancel();
}
