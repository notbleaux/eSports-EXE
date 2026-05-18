"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKimiACPClient = createKimiACPClient;
exports.createBridgeACPClient = createBridgeACPClient;
function createKimiACPClient(context) {
    return {
        start: async () => {
            console.log("Kimi ACP started");
        },
        stop: () => {
            console.log("Kimi ACP stopped");
        },
        isConnected: () => true,
        sendPrompt: async (prompt) => {
            return { response: `Mock Kimi response to: ${prompt}` };
        },
        createSession: async () => "mock-session-id",
        setMode: async (mode) => {
            console.log(`Mode set to ${mode}`);
        },
        cancel: () => {
            console.log("Cancelled");
        },
        onMessage: (callback) => { },
        onToolCall: (callback) => { },
    };
}
function createBridgeACPClient(context) {
    return {
        start: async () => {
            console.log("Bridge ACP started");
        },
        stop: () => {
            console.log("Bridge ACP stopped");
        },
        isConnected: () => true,
        sendPrompt: async (prompt) => {
            return { response: `Mock Bridge response to: ${prompt}` };
        },
        createSession: async () => "mock-bridge-session-id",
        setMode: async (mode) => {
            console.log(`Bridge mode set to ${mode}`);
        },
        cancel: () => {
            console.log("Bridge cancelled");
        },
        onMessage: (callback) => { },
        onToolCall: (callback) => { },
    };
}
//# sourceMappingURL=vscode-acp-client.js.map