/**
 * ACP Client Connector for VS Code:
 * Implements the Client-side of the Agent Client Protocol
 * 
 * This client:
 * - Spawns ACP agents (like kimi acp or our bridge)
 * - Handles fs/read_text_file, fs/write_text_file
 * - Handles terminal/* methods
 * - Streams session updates to VS Code: UI
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class ACPClient extends EventEmitter {
    constructor(agentCommand, agentArgs = []) {
        super();
        this.agentCommand = agentCommand;
        this.agentArgs = agentArgs;
        this.agentProcess = null;
        this.requestId = 0;
        this.pendingRequests = new Map();
        this.sessionId = null;
        this.initialized = false;
    }

    /**
     * Start the agent and initialize ACP connection
     */
    async start() {
        return new Promise((resolve, reject) => {
            console.log(`[ACP Client] Starting agent: ${this.agentCommand}`);
            
            // Spawn agent process
            this.agentProcess = spawn(this.agentCommand, this.agentArgs, {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Handle agent output
            let buffer = '';
            this.agentProcess.stdout.on('data', (data) => {
                buffer += data.toString();
                
                // Process complete JSON-RPC messages (newline-delimited)
                let lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.trim()) {
                        this._handleMessage(line.trim());
                    }
                }
            });

            this.agentProcess.stderr.on('data', (data) => {
                console.log(`[Agent stderr] ${data.toString().trim()}`);
            });

            this.agentProcess.on('error', (err) => {
                reject(new Error(`Failed to start agent: ${err.message}`));
            });

            this.agentProcess.on('close', (code) => {
                console.log(`[ACP Client] Agent exited with code ${code}`);
                this.emit('disconnected', code);
            });

            // Initialize ACP connection
            this._initialize().then(resolve).catch(reject);
        });
    }

    /**
     * Initialize ACP connection (version and capability negotiation)
     */
    async _initialize() {
        const response = await this._sendRequest('initialize', {
            protocolVersion: 1,
            clientCapabilities: {
                fs: {
                    readTextFile: true,
                    writeTextFile: true
                },
                terminal: true
            },
            clientInfo: {
                name: 'openclaw-vscode-client',
                title: 'OpenClaw VS Code: Client',
                version: '1.0.0'
            }
        });

        console.log(`[ACP Client] Connected to agent: ${response.agentInfo?.name || 'unknown'}`);
        this.initialized = true;
        this.emit('initialized', response);
        return response;
    }

    /**
     * Create a new session
     */
    async createSession(cwd, mcpServers = []) {
        const response = await this._sendRequest('session/new', {
            cwd: cwd,
            mcpServers: mcpServers
        });

        this.sessionId = response.sessionId;
        console.log(`[ACP Client] Session created: ${this.sessionId}`);
        this.emit('sessionCreated', response);
        return response;
    }

    /**
     * Send a prompt to the agent
     */
    async sendPrompt(message) {
        if (!this.sessionId) {
            throw new Error('No active session. Call createSession() first.');
        }

        return this._sendRequest('session/prompt', {
            sessionId: this.sessionId,
            prompt: [
                {
                    type: 'text',
                    text: message
                }
            ]
        });
    }

    /**
     * Set session mode (ask, architect, code)
     */
    async setMode(modeId) {
        if (!this.sessionId) {
            throw new Error('No active session');
        }

        return this._sendRequest('session/set_mode', {
            sessionId: this.sessionId,
            modeId: modeId
        });
    }

    /**
     * Cancel current prompt
     */
    cancel() {
        if (!this.sessionId) return;

        this._sendNotification('session/cancel', {
            sessionId: this.sessionId
        });
    }

    /**
     * Stop the agent
     */
    stop() {
        if (this.agentProcess) {
            this.agentProcess.kill();
            this.agentProcess = null;
        }
    }

    // ====================================================================
    // Private Methods
    // ====================================================================

    _sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            
            const message = {
                jsonrpc: '2.0',
                id: id,
                method: method,
                params: params
            };

            this.pendingRequests.set(id, { resolve, reject });
            
            // Set timeout
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request timeout: ${method}`));
                }
            }, 60000);

            // Send to agent
            this._sendRaw(message);
        });
    }

    _sendNotification(method, params) {
        this._sendRaw({
            jsonrpc: '2.0',
            method: method,
            params: params
        });
    }

    _sendRaw(message) {
        if (!this.agentProcess) {
            throw new Error('Agent not running');
        }

        const json = JSON.stringify(message);
        this.agentProcess.stdin.write(json + '\n');
    }

    _handleMessage(line) {
        try {
            const message = JSON.parse(line);
            
            // Handle responses (has id and result or error)
            if (message.id !== undefined) {
                if (message.error) {
                    // Error response
                    const pending = this.pendingRequests.get(message.id);
                    if (pending) {
                        pending.reject(new Error(message.error.message));
                        this.pendingRequests.delete(message.id);
                    }
                } else if (message.result !== undefined) {
                    // Success response
                    const pending = this.pendingRequests.get(message.id);
                    if (pending) {
                        pending.resolve(message.result);
                        this.pendingRequests.delete(message.id);
                    }
                }
            }
            // Handle notifications (no id, has method)
            else if (message.method) {
                this._handleNotification(message.method, message.params);
            }
        } catch (err) {
            console.error(`[ACP Client] Failed to parse message: ${err.message}`);
        }
    }

    _handleNotification(method, params) {
        console.log(`[ACP Client] Notification: ${method}`);

        switch (method) {
            case 'session/update':
                this._handleSessionUpdate(params);
                break;
            
            // Client methods (agent requests something from client)
            case 'fs/read_text_file':
                this._handleReadFile(params);
                break;
            
            case 'fs/write_text_file':
                this._handleWriteFile(params);
                break;
            
            case 'terminal/create':
                this._handleCreateTerminal(params);
                break;
            
            case 'session/request_permission':
                this._handlePermissionRequest(params);
                break;
            
            default:
                console.log(`[ACP Client] Unhandled notification: ${method}`);
        }
    }

    _handleSessionUpdate(params) {
        const update = params.update;
        
        switch (update.sessionUpdate) {
            case 'agent_message_chunk':
                this.emit('message', update.content?.text || '');
                break;
            
            case 'tool_call':
                this.emit('toolCall', {
                    id: update.toolCallId,
                    title: update.title,
                    kind: update.kind,
                    status: update.status
                });
                break;
            
            case 'tool_call_update':
                this.emit('toolCallUpdate', {
                    id: update.toolCallId,
                    status: update.status,
                    content: update.content
                });
                break;
            
            case 'plan':
                this.emit('plan', update.entries);
                break;
            
            case 'current_mode_update':
                this.emit('modeChange', update.modeId);
                break;
        }
    }

    _handleReadFile(params) {
        const filePath = params.path;
        const id = params._acp_request_id; // Would need to track this
        
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Would need to send response back...
            console.log(`[ACP Client] Read file: ${filePath}`);
        } catch (err) {
            console.error(`[ACP Client] Failed to read file: ${err.message}`);
        }
    }

    _handleWriteFile(params) {
        const filePath = params.path;
        const content = params.content;
        
        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content);
            console.log(`[ACP Client] Wrote file: ${filePath}`);
        } catch (err) {
            console.error(`[ACP Client] Failed to write file: ${err.message}`);
        }
    }

    _handleCreateTerminal(params) {
        console.log(`[ACP Client] Create terminal: ${params.command} ${params.args?.join(' ')}`);
        // Would spawn actual terminal in VS Code:
    }

    _handlePermissionRequest(params) {
        console.log(`[ACP Client] Permission request: ${params.toolCall?.title}`);
        this.emit('permissionRequest', params);
    }
}


// ====================================================================
// CLI Test Interface
// ====================================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
Usage: node acp-client.js <command> [options]

Commands:
  test-bridge    Test with our Python bridge server
  test-kimi      Test with kimi acp
  interactive    Interactive mode
        `);
        process.exit(0);
    }

    let client;

    if (command === 'test-bridge') {
        // Test with our Python bridge
        client = new ACPClient('python', ['.openclaw/acp-server.py']);
    } else if (command === 'test-kimi') {
        // Test with kimi acp
        client = new ACPClient('kimi', ['acp']);
    } else {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    // Set up event handlers
    client.on('initialized', (info) => {
        console.log('[Test] Agent initialized:', info);
    });

    client.on('message', (text) => {
        console.log('[Agent Message]:', text);
    });

    client.on('toolCall', (tool) => {
        console.log('[Tool Call]:', tool.title, `(${tool.status})`);
    });

    client.on('toolCallUpdate', (update) => {
        console.log('[Tool Update]:', update.id, '->', update.status);
    });

    try {
        await client.start();
        console.log('[Test] ACP connection established');

        // Create session
        const session = await client.createSession(process.cwd());
        console.log('[Test] Session:', session);

        // Send a test prompt
        if (command === 'interactive') {
            // Interactive mode
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log('\nEnter messages (type "exit" to quit):\n');

            const ask = () => {
                rl.question('You: ', async (input) => {
                    if (input.toLowerCase() === 'exit') {
                        client.stop();
                        rl.close();
                        return;
                    }

                    try {
                        const result = await client.sendPrompt(input);
                        console.log('[Result]:', result);
                    } catch (err) {
                        console.error('[Error]:', err.message);
                    }

                    ask();
                });
            };

            ask();
        } else {
            // Single test prompt
            const result = await client.sendPrompt('Hello from VS Code: ACP Client!');
            console.log('[Test] Result:', result);
            
            // Wait a bit for notifications
            setTimeout(() => {
                client.stop();
                process.exit(0);
            }, 3000);
        }

    } catch (err) {
        console.error('[Test] Error:', err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { ACPClient };
