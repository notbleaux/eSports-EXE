/** [Ver001.000]
 * Lock Manager Utility for Job Listing Board (JLB)
 * 
 * Provides atomic file locking to prevent concurrent modifications
 * in the filesystem-based coordination system.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const LOCKS_DIR = path.join('.job-board', 'locks');
const DEFAULT_TTL_MINUTES = 30;
const MAX_TTL_MINUTES = 120;

/**
 * Generate a lock file name from the target file path
 * @param {string} filePath - Path to the file being locked
 * @returns {string} Lock file name
 */
function getLockFileName(filePath) {
  const hash = crypto
    .createHash('md5')
    .update(filePath)
    .digest('base64')
    .replace(/[+/=]/g, '')
    .substring(0, 16);
  return `${hash}.lock`;
}

/**
 * Get full path to lock file
 * @param {string} filePath - Path to the file being locked
 * @returns {string} Full path to lock file
 */
function getLockFilePath(filePath) {
  return path.join(LOCKS_DIR, getLockFileName(filePath));
}

/**
 * Check if a lock exists and is valid
 * @param {string} filePath - Path to check
 * @returns {Object|null} Lock info if locked, null if not locked
 */
function check(filePath) {
  const lockPath = getLockFilePath(filePath);
  
  if (!fs.existsSync(lockPath)) {
    return null;
  }
  
  try {
    const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const now = new Date();
    const expiresAt = new Date(lockData.expiresAt);
    
    if (now > expiresAt) {
      // Lock expired, clean it up
      fs.unlinkSync(lockPath);
      return null;
    }
    
    return lockData;
  } catch (error) {
    // Corrupted lock file, remove it
    try {
      fs.unlinkSync(lockPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Acquire a lock on a file
 * @param {string} filePath - Path to the file to lock
 * @param {string} agentId - ID of the agent acquiring the lock
 * @param {string} reason - Reason for locking
 * @param {number} ttlMinutes - Time to live in minutes (default: 30, max: 120)
 * @returns {Object} Lock result { success: boolean, lock?: Object, error?: string }
 */
function acquire(filePath, agentId, reason, ttlMinutes = DEFAULT_TTL_MINUTES) {
  // Validate inputs
  if (!filePath || !agentId) {
    return { success: false, error: 'filePath and agentId are required' };
  }
  
  // Cap TTL at maximum
  const ttl = Math.min(ttlMinutes, MAX_TTL_MINUTES);
  
  // Ensure locks directory exists
  if (!fs.existsSync(LOCKS_DIR)) {
    fs.mkdirSync(LOCKS_DIR, { recursive: true });
  }
  
  // Check if already locked
  const existingLock = check(filePath);
  if (existingLock) {
    return { 
      success: false, 
      error: `File is locked by ${existingLock.agentId} until ${existingLock.expiresAt}`,
      existingLock 
    };
  }
  
  // Create lock
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 60000);
  
  const lockData = {
    filePath: filePath.replace(/\\/g, '/'),
    agentId,
    reason: reason || 'No reason provided',
    acquiredAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  
  const lockPath = getLockFilePath(filePath);
  
  try {
    // Write lock file atomically
    const tempPath = `${lockPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(lockData, null, 2));
    fs.renameSync(tempPath, lockPath);
    
    return { success: true, lock: lockData };
  } catch (error) {
    return { success: false, error: `Failed to create lock: ${error.message}` };
  }
}

/**
 * Release a lock on a file
 * @param {string} filePath - Path to the file to unlock
 * @param {string} agentId - ID of the agent releasing the lock
 * @returns {Object} Release result { success: boolean, error?: string }
 */
function release(filePath, agentId) {
  if (!filePath || !agentId) {
    return { success: false, error: 'filePath and agentId are required' };
  }
  
  const lockPath = getLockFilePath(filePath);
  
  // Check if lock exists
  if (!fs.existsSync(lockPath)) {
    return { success: true, message: 'Lock did not exist' };
  }
  
  try {
    const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    
    // Verify agent owns the lock
    if (lockData.agentId !== agentId) {
      return { 
        success: false, 
        error: `Lock owned by ${lockData.agentId}, cannot release as ${agentId}` 
      };
    }
    
    // Remove lock file
    fs.unlinkSync(lockPath);
    return { success: true, message: 'Lock released successfully' };
  } catch (error) {
    return { success: false, error: `Failed to release lock: ${error.message}` };
  }
}

/**
 * Clean up expired locks
 * @param {number} ttlMinutes - TTL threshold for cleanup (default: 30)
 * @returns {Object} Cleanup result { cleaned: number, errors: string[] }
 */
function cleanupExpired(ttlMinutes = DEFAULT_TTL_MINUTES) {
  const result = { cleaned: 0, errors: [] };
  
  if (!fs.existsSync(LOCKS_DIR)) {
    return result;
  }
  
  const files = fs.readdirSync(LOCKS_DIR);
  const now = new Date();
  
  for (const file of files) {
    if (!file.endsWith('.lock')) continue;
    
    const lockPath = path.join(LOCKS_DIR, file);
    
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      const expiresAt = new Date(lockData.expiresAt);
      
      if (now > expiresAt) {
        fs.unlinkSync(lockPath);
        result.cleaned++;
      }
    } catch (error) {
      // Corrupted or unreadable lock file, remove it
      try {
        fs.unlinkSync(lockPath);
        result.cleaned++;
      } catch (e) {
        result.errors.push(`Failed to remove ${file}: ${e.message}`);
      }
    }
  }
  
  return result;
}

/**
 * List all active locks
 * @returns {Array} Array of active lock objects
 */
function listActive() {
  if (!fs.existsSync(LOCKS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(LOCKS_DIR);
  const locks = [];
  const now = new Date();
  
  for (const file of files) {
    if (!file.endsWith('.lock')) continue;
    
    const lockPath = path.join(LOCKS_DIR, file);
    
    try {
      const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      const expiresAt = new Date(lockData.expiresAt);
      const isExpired = now > expiresAt;
      
      locks.push({
        ...lockData,
        lockFile: file,
        isExpired,
        minutesRemaining: isExpired ? 0 : Math.floor((expiresAt - now) / 60000)
      });
    } catch (error) {
      // Skip corrupted files
    }
  }
  
  return locks.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
}

// CLI Interface
function printUsage() {
  console.log(`
Lock Manager Utility for JLB

Usage:
  node lock-manager.js <command> [args...]

Commands:
  acquire <file-path> <agent-id> [reason] [ttl-minutes]
    Acquire a lock on a file
    
  release <file-path> <agent-id>
    Release a lock on a file
    
  check <file-path>
    Check if a file is locked
    
  list
    List all active locks
    
  cleanup [ttl-minutes]
    Clean up expired locks (default TTL: 30 minutes)

Examples:
  node lock-manager.js acquire 01_LISTINGS/ACTIVE/TASK-2026-0001.json agent-001 "Updating task"
  node lock-manager.js release 01_LISTINGS/ACTIVE/TASK-2026-0001.json agent-001
  node lock-manager.js check 01_LISTINGS/ACTIVE/TASK-2026-0001.json
  node lock-manager.js list
  node lock-manager.js cleanup
`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    printUsage();
    process.exit(1);
  }
  
  switch (command) {
    case 'acquire': {
      const [filePath, agentId, reason, ttl] = args.slice(1);
      if (!filePath || !agentId) {
        console.error('Error: file-path and agent-id are required');
        printUsage();
        process.exit(1);
      }
      const result = acquire(filePath, agentId, reason, ttl ? parseInt(ttl) : undefined);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    }
    
    case 'release': {
      const [filePath, agentId] = args.slice(1);
      if (!filePath || !agentId) {
        console.error('Error: file-path and agent-id are required');
        printUsage();
        process.exit(1);
      }
      const result = release(filePath, agentId);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    }
    
    case 'check': {
      const [filePath] = args.slice(1);
      if (!filePath) {
        console.error('Error: file-path is required');
        printUsage();
        process.exit(1);
      }
      const result = check(filePath);
      if (result) {
        console.log(JSON.stringify({ locked: true, lock: result }, null, 2));
      } else {
        console.log(JSON.stringify({ locked: false }, null, 2));
      }
      process.exit(0);
    }
    
    case 'list': {
      const locks = listActive();
      console.log(JSON.stringify({ count: locks.length, locks }, null, 2));
      process.exit(0);
    }
    
    case 'cleanup': {
      const [ttl] = args.slice(1);
      const result = cleanupExpired(ttl ? parseInt(ttl) : undefined);
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }
    
    default:
      console.error(`Error: Unknown command "${command}"`);
      printUsage();
      process.exit(1);
  }
}

// Export for use as module
module.exports = {
  LockManager: {
    acquire,
    release,
    check,
    cleanupExpired,
    listActive
  }
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}
