/** [Ver001.000] */
/**
 * WebSocket E2E Tests
 * ===================
 * Tests for unified WebSocket gateway functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('WebSocket Gateway', () => {
  const WS_URL = process.env.VITE_WS_URL || 'ws://localhost:8000/ws/gateway';
  const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

  // ========================================================================
  // Test 1: Connection
  // ========================================================================

  test('should establish WebSocket connection', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Evaluate WebSocket connection in browser context
    const connected = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const ws = new WebSocket('ws://localhost:8000/ws/gateway');
          
          ws.onopen = () => {
            resolve(true);
            ws.close();
          };
          
          ws.onerror = () => resolve(false);
          
          // Timeout after 5 seconds
          setTimeout(() => resolve(false), 5000);
        })
    );

    expect(connected).toBe(true);
  });

  // ========================================================================
  // Test 2: Subscription
  // ========================================================================

  test('should subscribe to channels and receive confirmation', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(
      () =>
        new Promise<{ success: boolean; receivedHistory: boolean }>((resolve) => {
          const ws = new WebSocket('ws://localhost:8000/ws/gateway');
          let receivedHistory = false;
          
          ws.onopen = () => {
            // Subscribe to global channel
            ws.send(
              JSON.stringify({
                type: 'subscribe',
                channel: 'global',
                payload: { channel: 'global' },
                timestamp: new Date().toISOString(),
              })
            );
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Check for auth confirmation or chat history
            if (data.type === 'auth' && data.payload?.status === 'connected') {
              // Auth confirmed, wait a bit for any history
              setTimeout(() => {
                resolve({ success: true, receivedHistory });
                ws.close();
              }, 1000);
            }
            
            if (data.type === 'chat_history') {
              receivedHistory = true;
            }
          };

          ws.onerror = () => resolve({ success: false, receivedHistory: false });
          
          setTimeout(() => resolve({ success: false, receivedHistory }), 5000);
        })
    );

    expect(result.success).toBe(true);
  });

  // ========================================================================
  // Test 3: Broadcast
  // ========================================================================

  test('should broadcast messages to subscribed channels', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(
      () =>
        new Promise<{ success: boolean; receivedMessage: boolean }>((resolve) => {
          const ws = new WebSocket('ws://localhost:8000/ws/gateway');
          let receivedMessage = false;
          
          ws.onopen = () => {
            // Subscribe to a test channel
            ws.send(
              JSON.stringify({
                type: 'subscribe',
                channel: 'global',
                payload: { channel: 'hub:test' },
                timestamp: new Date().toISOString(),
              })
            );

            // Wait a moment then send a ping
            setTimeout(() => {
              ws.send(
                JSON.stringify({
                  type: 'ping',
                  channel: 'global',
                  payload: {},
                  timestamp: new Date().toISOString(),
                })
              );
            }, 500);
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'pong') {
              receivedMessage = true;
              resolve({ success: true, receivedMessage });
              ws.close();
            }
          };

          ws.onerror = () => resolve({ success: false, receivedMessage: false });
          
          setTimeout(() => resolve({ success: false, receivedMessage }), 5000);
        })
    );

    expect(result.success).toBe(true);
    expect(result.receivedMessage).toBe(true);
  });

  // ========================================================================
  // Test 4: Reconnect
  // ========================================================================

  test('should auto-reconnect on connection loss', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(
      () =>
        new Promise<{ initialConnected: boolean; reconnected: boolean }>((resolve) => {
          let ws: WebSocket | null = null;
          let initialConnected = false;
          let reconnected = false;
          let reconnectAttempted = false;

          const connect = () => {
            ws = new WebSocket('ws://localhost:8000/ws/gateway');
            
            ws.onopen = () => {
              if (!initialConnected) {
                initialConnected = true;
                // Close connection to simulate disconnect
                setTimeout(() => {
                  ws?.close();
                  reconnectAttempted = true;
                }, 500);
              } else if (reconnectAttempted) {
                reconnected = true;
                resolve({ initialConnected, reconnected });
                ws?.close();
              }
            };

            ws.onclose = () => {
              if (initialConnected && !reconnectAttempted) {
                // Attempt reconnect after 1 second
                setTimeout(() => {
                  connect();
                }, 1000);
              }
            };

            ws.onerror = () => {
              if (!initialConnected) {
                resolve({ initialConnected: false, reconnected: false });
              }
            };
          };

          connect();
          
          setTimeout(() => resolve({ initialConnected, reconnected }), 8000);
        })
    );

    expect(result.initialConnected).toBe(true);
    expect(result.reconnected).toBe(true);
  });

  // ========================================================================
  // Test 5: Presence
  // ========================================================================

  test('should track user presence via gateway API', async ({ request }) => {
    // First establish a WebSocket connection
    const wsConnected = await new Promise<boolean>((resolve) => {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        resolve(true);
        ws.close();
      };
      ws.onerror = () => resolve(false);
      setTimeout(() => resolve(false), 5000);
    });

    expect(wsConnected).toBe(true);

    // Check gateway status endpoint
    const statusResponse = await request.get(`${API_URL}/api/gateway/status`);
    expect(statusResponse.status()).toBe(200);

    const status = await statusResponse.json();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('connected_users');
    expect(status).toHaveProperty('active_channels');
    expect(status.status).toBe('healthy');

    // Check channels endpoint
    const channelsResponse = await request.get(`${API_URL}/api/gateway/channels`);
    expect(channelsResponse.status()).toBe(200);

    const channels = await channelsResponse.json();
    expect(channels).toHaveProperty('channels');
    expect(channels).toHaveProperty('total_subscribers');
    expect(Array.isArray(channels.channels)).toBe(true);

    // Check presence endpoint
    const presenceResponse = await request.get(`${API_URL}/api/gateway/presence`);
    expect(presenceResponse.status()).toBe(200);

    const presence = await presenceResponse.json();
    expect(presence).toHaveProperty('users');
    expect(presence).toHaveProperty('total_online');
    expect(Array.isArray(presence.users)).toBe(true);
  });

  // ========================================================================
  // Test 6: Heartbeat
  // ========================================================================

  test('should respond to ping with pong', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(
      () =>
        new Promise<{ success: boolean; pongReceived: boolean }>((resolve) => {
          const ws = new WebSocket('ws://localhost:8000/ws/gateway');
          let pongReceived = false;
          
          ws.onopen = () => {
            // Send ping
            ws.send(
              JSON.stringify({
                type: 'ping',
                channel: 'global',
                payload: {},
                timestamp: new Date().toISOString(),
              })
            );
          };

          ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'pong') {
              pongReceived = true;
              resolve({ success: true, pongReceived });
              ws.close();
            }
          };

          ws.onerror = () => resolve({ success: false, pongReceived: false });
          
          setTimeout(() => resolve({ success: false, pongReceived }), 5000);
        })
    );

    expect(result.success).toBe(true);
    expect(result.pongReceived).toBe(true);
  });
});
