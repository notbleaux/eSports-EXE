/** [Ver001.000] */
/**
 * MSW Server Setup
 * ================
 * Configures Mock Service Worker for Node.js (testing) environment.
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create server instance with our handlers
export const server = setupServer(...handlers)
