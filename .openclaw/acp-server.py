#!/usr/bin/env python3
"""
ACP Bridge Server for OpenClaw + Kimi Multi-Agent Collaboration
Implements the Agent Client Protocol (ACP) v1.0

This server acts as an ACP-compliant agent that bridges to:
1. Kimi CLI Agent (local terminal)
2. Kimi VS Code: Agent (IDE)
3. OpenClaw Cloud Agent (remote)
"""

import json
import sys
import os
import subprocess
import threading
import queue
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid

# ACP Protocol Version
ACP_PROTOCOL_VERSION = 1

@dataclass
class Session:
    """ACP Session state"""
    session_id: str
    cwd: str
    created_at: str
    mode: str = "code"
    mcp_servers: List[Dict] = None
    
    def __post_init__(self):
        if self.mcp_servers is None:
            self.mcp_servers = []

class ACPBridgeServer:
    """
    ACP Bridge Server implementing the Agent Client Protocol
    
    This server:
    - Handles JSON-RPC 2.0 messages over stdio
    - Manages sessions for multiple agents
    - Bridges to Kimi CLI, Kimi VS Code:, and OpenClaw Cloud
    """
    
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.agent_capabilities = {
            "loadSession": True,
            "promptCapabilities": {
                "image": True,
                "audio": False,
                "embeddedContext": True
            },
            "mcpCapabilities": {
                "http": True,
                "sse": False
            },
            "sessionCapabilities": {
                "list": True,
                "modes": True
            }
        }
        self.agent_info = {
            "name": "openclaw-kimi-bridge",
            "title": "OpenClaw + Kimi ACP Bridge",
            "version": "1.0.0"
        }
        self.mcp_servers = {}
        self.running = True
        
    def send_message(self, message: Dict):
        """Send JSON-RPC message to stdout"""
        json_str = json.dumps(message, ensure_ascii=False)
        sys.stdout.write(json_str + "\n")
        sys.stdout.flush()
        
    def send_error(self, id: Any, code: int, message: str, data: Any = None):
        """Send JSON-RPC error response"""
        error = {
            "jsonrpc": "2.0",
            "id": id,
            "error": {
                "code": code,
                "message": message
            }
        }
        if data is not None:
            error["error"]["data"] = data
        self.send_message(error)
        
    def send_result(self, id: Any, result: Any):
        """Send JSON-RPC success response"""
        self.send_message({
            "jsonrpc": "2.0",
            "id": id,
            "result": result
        })
        
    def send_notification(self, method: str, params: Dict):
        """Send JSON-RPC notification (no id)"""
        self.send_message({
            "jsonrpc": "2.0",
            "method": method,
            "params": params
        })
    
    # ====================================================================
    # ACP Agent Methods
    # ====================================================================
    
    def handle_initialize(self, id: Any, params: Dict) -> Dict:
        """
        Handle initialize request
        
        Client sends:
        {
            "protocolVersion": 1,
            "clientCapabilities": {"fs": {...}, "terminal": true},
            "clientInfo": {"name": "...", "version": "..."}
        }
        """
        client_version = params.get("protocolVersion", 1)
        client_capabilities = params.get("clientCapabilities", {})
        client_info = params.get("clientInfo", {})
        
        # Log client info
        print(f"[ACP] Client connected: {client_info.get('name', 'unknown')} v{client_info.get('version', 'unknown')}", 
              file=sys.stderr)
        
        # Return agent capabilities
        return {
            "protocolVersion": min(client_version, ACP_PROTOCOL_VERSION),
            "agentCapabilities": self.agent_capabilities,
            "agentInfo": self.agent_info,
            "authMethods": []  # No auth required
        }
    
    def handle_session_new(self, id: Any, params: Dict) -> Dict:
        """Handle session/new request"""
        session_id = f"sess_{uuid.uuid4().hex[:16]}"
        cwd = params.get("cwd", os.getcwd())
        mcp_servers = params.get("mcpServers", [])
        
        # Create session
        session = Session(
            session_id=session_id,
            cwd=cwd,
            created_at=datetime.now().isoformat(),
            mcp_servers=mcp_servers
        )
        self.sessions[session_id] = session
        
        # Connect to MCP servers
        for server in mcp_servers:
            self._connect_mcp_server(session_id, server)
        
        print(f"[ACP] Created session: {session_id}", file=sys.stderr)
        
        return {
            "sessionId": session_id,
            "modes": {
                "currentModeId": "code",
                "availableModes": [
                    {"id": "ask", "name": "Ask", "description": "Request permission before changes"},
                    {"id": "architect", "name": "Architect", "description": "Design without implementation"},
                    {"id": "code", "name": "Code", "description": "Write and modify code"}
                ]
            }
        }
    
    def handle_session_load(self, id: Any, params: Dict) -> Dict:
        """Handle session/load request (resume previous session)"""
        session_id = params.get("sessionId")
        
        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Replay conversation history...
            print(f"[ACP] Loaded session: {session_id}", file=sys.stderr)
            return {"sessionId": session_id}
        else:
            self.send_error(id, -32001, f"Session not found: {session_id}")
            return None
    
    def handle_session_list(self, id: Any, params: Dict) -> Dict:
        """Handle session/list request"""
        sessions_list = []
        for sess in self.sessions.values():
            sessions_list.append({
                "sessionId": sess.session_id,
                "cwd": sess.cwd,
                "createdAt": sess.created_at
            })
        
        return {
            "sessions": sessions_list,
            "nextCursor": None
        }
    
    def handle_session_prompt(self, id: Any, params: Dict) -> Dict:
        """
        Handle session/prompt - Main interaction method
        
        This is where user messages are processed and agent responses are streamed
        """
        session_id = params.get("sessionId")
        prompt_blocks = params.get("prompt", [])
        
        if session_id not in self.sessions:
            self.send_error(id, -32001, f"Session not found: {session_id}")
            return None
        
        session = self.sessions[session_id]
        
        # Extract user message from prompt blocks
        user_message = ""
        for block in prompt_blocks:
            if block.get("type") == "text":
                user_message += block.get("text", "")
        
        print(f"[ACP] Session {session_id}: {user_message[:100]}...", file=sys.stderr)
        
        # Stream response back to client
        # 1. Send agent message chunks
        self.send_notification("session/update", {
            "sessionId": session_id,
            "update": {
                "sessionUpdate": "agent_message_chunk",
                "content": {
                    "type": "text",
                    "text": "I'll help you with that. Let me analyze your request..."
                }
            }
        })
        
        # 2. Send tool call (if needed)
        tool_call_id = f"call_{uuid.uuid4().hex[:8]}"
        self.send_notification("session/update", {
            "sessionId": session_id,
            "update": {
                "sessionUpdate": "tool_call",
                "toolCallId": tool_call_id,
                "title": "Processing request",
                "kind": "think",
                "status": "in_progress"
            }
        })
        
        # 3. Update tool call as completed
        self.send_notification("session/update", {
            "sessionId": session_id,
            "update": {
                "sessionUpdate": "tool_call_update",
                "toolCallId": tool_call_id,
                "status": "completed",
                "content": [{
                    "type": "content",
                    "content": {
                        "type": "text",
                        "text": f"Received message: {user_message[:50]}..."
                    }
                }]
            }
        })
        
        # 4. Send final agent message
        self.send_notification("session/update", {
            "sessionId": session_id,
            "update": {
                "sessionUpdate": "agent_message_chunk",
                "content": {
                    "type": "text",
                    "text": f"I'm the OpenClaw + Kimi ACP Bridge. You said: '{user_message}'. I can delegate this to other agents."
                }
            }
        })
        
        # Return stop reason
        return {
            "stopReason": "end_turn"
        }
    
    def handle_session_set_mode(self, id: Any, params: Dict) -> Dict:
        """Handle session/set_mode"""
        session_id = params.get("sessionId")
        mode_id = params.get("modeId")
        
        if session_id in self.sessions:
            self.sessions[session_id].mode = mode_id
            
            # Notify client of mode change
            self.send_notification("session/update", {
                "sessionId": session_id,
                "update": {
                    "sessionUpdate": "current_mode_update",
                    "modeId": mode_id
                }
            })
            
            return {"modeId": mode_id}
        else:
            self.send_error(id, -32001, f"Session not found: {session_id}")
            return None
    
    def handle_session_cancel(self, params: Dict):
        """Handle session/cancel notification (no response needed)"""
        session_id = params.get("sessionId")
        print(f"[ACP] Session cancelled: {session_id}", file=sys.stderr)
        # Cancel any ongoing operations...
    
    # ====================================================================
    # MCP Server Management
    # ====================================================================
    
    def _connect_mcp_server(self, session_id: str, server_config: Dict):
        """Connect to an MCP server"""
        server_name = server_config.get("name", "unnamed")
        transport = server_config.get("type", "stdio")
        
        print(f"[ACP] Connecting MCP server: {server_name} ({transport})", file=sys.stderr)
        
        if transport == "stdio":
            command = server_config.get("command")
            args = server_config.get("args", [])
            env = server_config.get("env", [])
            
            # TODO: Spawn MCP server process
            self.mcp_servers[server_name] = {
                "type": "stdio",
                "process": None  # Would store subprocess here
            }
    
    # ====================================================================
    # Main Loop
    # ====================================================================
    
    def run(self):
        """Main server loop - read JSON-RPC from stdin, write to stdout"""
        print(f"[ACP] OpenClaw + Kimi Bridge Server v1.0.0", file=sys.stderr)
        print(f"[ACP] Protocol Version: {ACP_PROTOCOL_VERSION}", file=sys.stderr)
        print(f"[ACP] Waiting for client connection...", file=sys.stderr)
        
        while self.running:
            try:
                # Read line from stdin
                line = sys.stdin.readline()
                if not line:
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                # Parse JSON-RPC message
                try:
                    message = json.loads(line)
                except json.JSONDecodeError as e:
                    self.send_error(None, -32700, f"Parse error: {e}")
                    continue
                
                # Handle message
                self._handle_message(message)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"[ACP] Error: {e}", file=sys.stderr)
                self.send_error(None, -32603, f"Internal error: {e}")
    
    def _handle_message(self, message: Dict):
        """Route JSON-RPC message to appropriate handler"""
        method = message.get("method")
        msg_id = message.get("id")
        params = message.get("params", {})
        
        # Map methods to handlers
        handlers = {
            "initialize": self.handle_initialize,
            "session/new": self.handle_session_new,
            "session/load": self.handle_session_load,
            "session/list": self.handle_session_list,
            "session/prompt": self.handle_session_prompt,
            "session/set_mode": self.handle_session_set_mode,
        }
        
        # Handle notifications (no id)
        if msg_id is None:
            if method == "session/cancel":
                self.handle_session_cancel(params)
            else:
                print(f"[ACP] Unhandled notification: {method}", file=sys.stderr)
            return
        
        # Handle requests
        handler = handlers.get(method)
        if handler:
            try:
                result = handler(msg_id, params)
                if result is not None:  # None means error already sent
                    self.send_result(msg_id, result)
            except Exception as e:
                print(f"[ACP] Handler error: {e}", file=sys.stderr)
                self.send_error(msg_id, -32603, f"Internal error: {e}")
        else:
            # Check for extension methods (prefixed with _)
            if method.startswith("_"):
                self._handle_extension_method(msg_id, method, params)
            else:
                self.send_error(msg_id, -32601, f"Method not found: {method}")
    
    def _handle_extension_method(self, id: Any, method: str, params: Dict):
        """Handle custom extension methods"""
        print(f"[ACP] Extension method: {method}", file=sys.stderr)
        # Extension methods can be implemented here
        self.send_error(id, -32601, f"Extension method not implemented: {method}")


def main():
    """Entry point"""
    server = ACPBridgeServer()
    server.run()


if __name__ == "__main__":
    main()
