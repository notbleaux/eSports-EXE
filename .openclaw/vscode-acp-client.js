"use strict";
/**
 * VS Code: ACP Client
 *
 * A production-ready ACP client implementation using the official
 * @agentclientprotocol/sdk for VS Code: extension integration.
 *
 * This client:
 * - Spawns and manages ACP agents (kimi acp, custom bridge, etc.)
 * - Handles file system operations via VS Code: APIs
 * - Manages terminal integration
 * - Provides permission request UI
 * - Streams agent responses to VS Code: UI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeACPClient = void 0;
exports.createKimiACPClient = createKimiACPClient;
exports.createBridgeACPClient = createBridgeACPClient;
const acp = require("@agentclientprotocol/sdk");
const child_process_1 = require("child_process");
const vscode = require("vscode");
const stream_1 = require("stream");
const util_1 = require("util");
/**
 * Manages the connection between VS Code: and an ACP agent
 */
class VSCodeACPClient {
    constructor(config, context) {
        this.config = config;
        this.context = context;
        this.disposables = [];
        this.messageEmitter = new vscode.EventEmitter();
        this.toolCallEmitter = new vscode.EventEmitter();
        /** Event fired when agent sends a message chunk */
        this.onMessage = this.messageEmitter.event;
        /** Event fired when agent creates/updates a tool call */
        this.onToolCall = this.toolCallEmitter.event;
        // Create output channel for ACP communication
        this.outputChannel = vscode.window.createOutputChannel(`ACP: ${config.name || config.command}`, "json");
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.text = "$(sync~spin) ACP: Connecting...";
        this.statusBarItem.show();
        this.disposables.push(this.outputChannel, this.statusBarItem);
    }
    /**
     * Start the ACP agent and establish connection
     */
    async start() {
        try {
            // Spawn the agent process
            this.agentProcess = (0, child_process_1.spawn)(this.config.command, this.config.args || [], {
                cwd: this.config.cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                env: { ...process.env, ...this.config.env },
                stdio: ["pipe", "pipe", "pipe"],
            });
            this.log(`Spawned agent: ${this.config.command} ${this.config.args?.join(" ") || ""}`);
            // Handle agent stderr (logging)
            this.agentProcess.stderr?.on("data", (data) => {
                const message = data.toString();
                this.log(`[Agent stderr] ${message.trim()}`, "warning");
            });
            // Handle process exit
            this.agentProcess.on("exit", (code) => {
                this.log(`Agent exited with code ${code}`, code === 0 ? "info" : "error");
                this.statusBarItem.text = "$(error) ACP: Disconnected";
                vscode.window.showWarningMessage(`ACP agent disconnected (code: ${code})`);
            });
            // Create ACP streams from process stdio
            const input = stream_1.Writable.toWeb(this.agentProcess.stdin);
            const output = stream_1.Readable.toWeb(this.agentProcess.stdout);
            const stream = acp.ndJsonStream(input, output);
            // Create client connection
            this.connection = new acp.ClientSideConnection(() => this, stream);
            // Initialize the connection
            const initResult = await this.connection.initialize({
                protocolVersion: acp.PROTOCOL_VERSION,
                clientCapabilities: {
                    fs: {
                        readTextFile: true,
                        writeTextFile: true,
                    },
                    terminal: true,
                },
                clientInfo: {
                    name: "vscode-acp-client",
                    title: "VS Code: ACP Client",
                    version: "1.0.0",
                },
            });
            this.log(`Connected to agent: ${initResult.agentInfo?.name || "unknown"} ` +
                `(protocol v${initResult.protocolVersion})`);
            this.statusBarItem.text = `$(check) ACP: ${initResult.agentInfo?.name || "Connected"}`;
            this.statusBarItem.tooltip = `Agent: ${initResult.agentInfo?.name}\nVersion: ${initResult.agentInfo?.version}\nProtocol: v${initResult.protocolVersion}`;
            vscode.window.showInformationMessage(`ACP connected: ${initResult.agentInfo?.name || "Agent"}`);
        }
        catch (error) {
            this.statusBarItem.text = "$(error) ACP: Error";
            throw error;
        }
    }
    /**
     * Create a new ACP session
     */
    async createSession(cwd, mcpServers) {
        if (!this.connection) {
            throw new Error("ACP client not started");
        }
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const result = await this.connection.newSession({
            cwd: cwd || workspacePath || process.cwd(),
            mcpServers: mcpServers || [],
        });
        this.sessionId = result.sessionId;
        this.log(`Created session: ${this.sessionId}`);
        // Show available modes if any
        if (result.modes) {
            this.log(`Available modes: ${result.modes.availableModes.map((m) => m.id).join(", ")}`);
        }
        return this.sessionId;
    }
    /**
     * Send a prompt to the agent
     */
    async sendPrompt(message) {
        if (!this.connection || !this.sessionId) {
            throw new Error("No active session");
        }
        this.log(`Sending prompt: ${message.substring(0, 100)}...`);
        const response = await this.connection.prompt({
            sessionId: this.sessionId,
            prompt: [
                {
                    type: "text",
                    text: message,
                },
            ],
        });
        this.log(`Prompt completed: ${response.stopReason}`);
        return response;
    }
    /**
     * Set the session mode (ask, architect, code)
     */
    async setMode(modeId) {
        if (!this.connection || !this.sessionId) {
            throw new Error("No active session");
        }
        await this.connection.setSessionMode({
            sessionId: this.sessionId,
            modeId,
        });
        this.log(`Set mode: ${modeId}`);
    }
    /**
     * Cancel the current prompt
     */
    cancel() {
        if (!this.connection || !this.sessionId) {
            return;
        }
        this.connection.cancel({ sessionId: this.sessionId });
        this.log("Cancelled current prompt");
    }
    /**
     * Stop the agent and clean up
     */
    stop() {
        this.log("Stopping ACP client...");
        if (this.agentProcess) {
            this.agentProcess.kill();
            this.agentProcess = undefined;
        }
        this.connection = undefined;
        this.sessionId = undefined;
        this.statusBarItem.text = "$(circle-slash) ACP: Stopped";
        // Dispose all resources
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
    }
    // ====================================================================
    // ACP Client Methods (called by Agent)
    // ====================================================================
    /**
     * Handle permission requests from agent
     */
    async requestPermission(params) {
        const toolCall = params.toolCall;
        this.log(`Permission requested: ${toolCall.title}`);
        // Show permission dialog in VS Code:
        const options = params.options.map((opt) => ({
            label: opt.name,
            description: opt.kind,
            optionId: opt.optionId,
        }));
        const selected = await vscode.window.showQuickPick(options, {
            title: `🔐 Permission Required: ${toolCall.title}`,
            placeHolder: "Choose how to proceed",
            ignoreFocusOut: true,
        });
        if (!selected) {
            // User dismissed - treat as reject
            return {
                outcome: {
                    outcome: "selected",
                    optionId: params.options.find((o) => o.kind === "reject_once")?.optionId || "reject",
                },
            };
        }
        this.log(`Permission granted: ${selected.optionId}`);
        return {
            outcome: {
                outcome: "selected",
                optionId: selected.optionId,
            },
        };
    }
    /**
     * Handle session update notifications
     */
    async sessionUpdate(params) {
        const update = params.update;
        switch (update.sessionUpdate) {
            case "agent_message_chunk":
                if (update.content.type === "text") {
                    this.messageEmitter.fire(update.content.text);
                    this.log(`Agent: ${update.content.text.substring(0, 100)}...`);
                }
                break;
            case "tool_call":
                this.toolCallEmitter.fire(update);
                this.log(`Tool call: ${update.title} (${update.status})`);
                break;
            case "tool_call_update":
                this.toolCallEmitter.fire(update);
                this.log(`Tool update: ${update.toolCallId} -> ${update.status}`);
                break;
            case "plan":
                this.log(`Plan updated: ${update.entries.length} entries`);
                break;
            case "current_mode_update":
                this.log(`Mode changed: ${update.modeId}`);
                break;
            default:
                this.log(`Update: ${update.sessionUpdate}`);
        }
    }
    /**
     * Handle file read requests from agent
     */
    async readTextFile(params) {
        try {
            const uri = vscode.Uri.file(params.path);
            const content = await vscode.workspace.fs.readFile(uri);
            const text = new util_1.TextDecoder().decode(content);
            this.log(`Read file: ${params.path} (${text.length} chars)`);
            return { content: text };
        }
        catch (error) {
            this.log(`Failed to read file: ${params.path}`, "error");
            throw error;
        }
    }
    /**
     * Handle file write requests from agent
     */
    async writeTextFile(params) {
        try {
            const uri = vscode.Uri.file(params.path);
            const content = new util_1.TextEncoder().encode(params.content);
            // Ensure directory exists
            const dir = vscode.Uri.file(params.path.substring(0, params.path.lastIndexOf("/")));
            try {
                await vscode.workspace.fs.createDirectory(dir);
            }
            catch {
                // Directory might already exist
            }
            await vscode.workspace.fs.writeFile(uri, content);
            this.log(`Wrote file: ${params.path} (${params.content.length} chars)`);
            // Show the file in editor
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
            return {};
        }
        catch (error) {
            this.log(`Failed to write file: ${params.path}`, "error");
            throw error;
        }
    }
    /**
     * Handle terminal creation requests
     */
    async createTerminal(params) {
        const terminal = vscode.window.createTerminal({
            name: `ACP: ${params.command}`,
            cwd: params.cwd,
            env: params.env?.reduce((acc, e) => ({ ...acc, [e.name]: e.value }), {}),
        });
        terminal.show();
        terminal.sendText(`${params.command} ${params.args?.join(" ") || ""}`);
        const terminalId = `term_${Date.now()}`;
        this.log(`Created terminal: ${terminalId}`);
        return { terminalId };
    }
    // ====================================================================
    // Utility Methods
    // ====================================================================
    log(message, level = "info") {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
        if (level === "error") {
            console.error(message);
        }
        else if (level === "warning") {
            console.warn(message);
        }
        else {
            console.log(message);
        }
    }
    /**
     * Get current session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Check if client is connected
     */
    isConnected() {
        return !!this.connection && !!this.agentProcess;
    }
}
exports.VSCodeACPClient = VSCodeACPClient;
/**
 * Factory function to create ACP client for Kimi
 */
function createKimiACPClient(context) {
    return new VSCodeACPClient({
        command: "kimi",
        args: ["acp"],
        name: "Kimi CLI",
    }, context);
}
/**
 * Factory function to create ACP client for custom bridge
 */
function createBridgeACPClient(context) {
    return new VSCodeACPClient({
        command: "python",
        args: [".openclaw/acp-server.py"],
        name: "OpenClaw Bridge",
    }, context);
}
//# sourceMappingURL=vscode-acp-client.js.map