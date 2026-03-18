import * as vscode from "vscode";

export interface VSCodeACPClient {
  start(): Promise<void>;
  stop(): void;
  isConnected(): boolean;
  sendPrompt(prompt: string): Promise<any>;
  createSession(): Promise<string>;
  setMode(mode: string): Promise<void>;
  cancel(): void;
  onMessage(callback: (text: string) => void): void;
  onToolCall(callback: (tool: any) => void): void;
}

export function createKimiACPClient(
  context: vscode.ExtensionContext,
): VSCodeACPClient {
  return {
    start: async () => {
      console.log("Kimi ACP started");
    },
    stop: () => {
      console.log("Kimi ACP stopped");
    },
    isConnected: () => true,
    sendPrompt: async (prompt: string) => {
      return { response: `Mock Kimi response to: ${prompt}` };
    },
    createSession: async () => "mock-session-id",
    setMode: async (mode: string) => {
      console.log(`Mode set to ${mode}`);
    },
    cancel: () => {
      console.log("Cancelled");
    },
    onMessage: (callback) => {},
    onToolCall: (callback) => {},
  };
}

export function createBridgeACPClient(
  context: vscode.ExtensionContext,
): VSCodeACPClient {
  return {
    start: async () => {
      console.log("Bridge ACP started");
    },
    stop: () => {
      console.log("Bridge ACP stopped");
    },
    isConnected: () => true,
    sendPrompt: async (prompt: string) => {
      return { response: `Mock Bridge response to: ${prompt}` };
    },
    createSession: async () => "mock-bridge-session-id",
    setMode: async (mode: string) => {
      console.log(`Bridge mode set to ${mode}`);
    },
    cancel: () => {
      console.log("Bridge cancelled");
    },
    onMessage: (callback) => {},
    onToolCall: (callback) => {},
  };
}
