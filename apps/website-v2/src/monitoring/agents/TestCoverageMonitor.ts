/**
 * Test Coverage Monitor - Tracks coverage by module
 * 
 * [Ver001.000]
 */

import { logger } from '../../utils/logger'

interface CoverageReport {
  timestamp: string
  overall: number
  statements: number
  branches: number
  functions: number
  lines: number
  modules: Array<{ name: string; coverage: number }>
  uncovered: string[]
}

export class TestCoverageMonitor {
  private report: CoverageReport = {
    timestamp: new Date().toISOString(),
    overall: 0,
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
    modules: [],
    uncovered: []
  }

  private targets = {
    overall: 80,
    critical: 90
  }

  /**
   * Record coverage data
   */
  recordCoverage(coverage: Partial<CoverageReport>): void {
    this.report = { ...this.report, ...coverage, timestamp: new Date().toISOString() }
    
    if (this.report.overall < this.targets.overall) {
      logger.warn(`[TestCoverageMonitor] Coverage ${this.report.overall}% below target ${this.targets.overall}%`)
    }
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    return `# Test Coverage Report
Generated: ${this.report.timestamp}

## Overall Coverage
- Total: ${this.report.overall}%
- Statements: ${this.report.statements}%
- Branches: ${this.report.branches}%
- Functions: ${this.report.functions}%
- Lines: ${this.report.lines}%

## Targets
- Overall: ${this.targets.overall}% ${this.report.overall >= this.targets.overall ? '✅' : '⚠️'}
- Critical paths: ${this.targets.critical}%

## Module Coverage
${this.report.modules.map(m => `- ${m.name}: ${m.coverage}% ${m.coverage >= this.targets.overall ? '✅' : '⚠️'}`).join('\n')}

## Uncovered Files
${this.report.uncovered.length > 0
  ? this.report.uncovered.map(f => `- ${f}`).join('\n')
  : '✅ All files have coverage'}
`
  }
}

export const testCoverageMonitor = new TestCoverageMonitor()
export default testCoverageMonitor
