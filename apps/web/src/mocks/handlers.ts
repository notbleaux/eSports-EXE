// @ts-nocheck
/** [Ver001.000] */
/**
 * MSW Handlers
 * ============
 * Mock Service Worker handlers for testing.
 * Includes WebSocket mocking for real-time features.
 */

import { ws } from 'msw'

export const websocketHandlers = [
  ws.link('ws://localhost:8000/v1/ws').addEventListener('connection', ({ client }) => {
    // Send initial connection acknowledgment
    client.send(JSON.stringify({ type: 'connected' }))
    
    // Handle incoming messages
    client.addEventListener('message', (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'subscribe') {
        // Acknowledge subscription
        client.send(JSON.stringify({ 
          type: 'subscribed', 
          channel: data.channel 
        }))
        
        // Simulate initial frame data
        client.send(JSON.stringify({
          type: 'frame_update',
          frame: {
            timestamp: Date.now(),
            roundNumber: 1,
            roundTime: 0,
            phase: 'buy',
            agentFrames: [],
            abilitiesActive: [],
            spikeStatus: 'base'
          }
        }))
      }
      
      if (data.type === 'seek') {
        client.send(JSON.stringify({
          type: 'seek_complete',
          timestamp: data.timestamp
        }))
      }
      
      if (data.type === 'ping') {
        client.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }))
      }
    })
  }),
]

// Export all handlers
export const handlers = [...websocketHandlers]
