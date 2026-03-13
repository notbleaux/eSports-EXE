/**
 * Dependency Monitor - Tracks package.json vs imports alignment
 * 
 * [Ver001.000]
 */

import packageJson from '../../../package.json'
import { logger } from '../../utils/logger'

interface DependencyReport {
  timestamp: string
  missingDependencies: string[]
  unusedDependencies: string[]
  versionMismatches: Array<{ pkg: string; expected: string; actual: string }>
}

export class DependencyMonitor {
  private report: DependencyReport = {
    timestamp: new Date().toISOString(),
    missingDependencies: [],
    unusedDependencies: [],
    versionMismatches: []
  }

  /**
   * Check for missing dependencies
   */
  check(): DependencyReport {
    this.report.timestamp = new Date().toISOString()
    
    // Check required ML dependencies
    const requiredDeps = [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-webgpu',
      '@tensorflow/tfjs-backend-wasm',
      'onnxruntime-web'
    ]
    
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    for (const dep of requiredDeps) {
      if (!deps[dep]) {
        this.report.missingDependencies.push(dep)
        logger.error(`[DependencyMonitor] Missing required dependency: ${dep}`)
      }
    }
    
    return this.report
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    const report = this.check()
    
    return `# Dependency Report
Generated: ${report.timestamp}

## Missing Dependencies
${report.missingDependencies.length > 0 
  ? report.missingDependencies.map(d => `- ❌ ${d}`).join('\n')
  : '✅ All dependencies present'}

## Recommendations
${report.missingDependencies.length > 0
  ? `Run: npm install ${report.missingDependencies.join(' ')}`
  : 'No action required'}
`
  }
}

export const dependencyMonitor = new DependencyMonitor()
export default dependencyMonitor
