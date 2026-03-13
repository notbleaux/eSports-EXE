/**
 * Grid Benchmark Suite - Performance Measurement Tool
 * [Ver001.000]
 */

export interface BenchmarkResult {
  panelCount: number
  renderTime: number
  scrollFps: number
  memoryBefore: number
  memoryAfter: number
  memoryDelta: number
  timestamp: number
}

export interface BenchmarkSuite {
  results: BenchmarkResult[]
  baseline?: BenchmarkResult
}

const STORAGE_KEY = '4njz4-grid-benchmarks'

/**
 * Measure render time for specific panel count
 */
export async function measureRender(
  panelCount: number,
  renderFn: (count: number) => Promise<void>
): Promise<BenchmarkResult> {
  const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0
  
  const startTime = performance.now()
  await renderFn(panelCount)
  const renderTime = performance.now() - startTime
  
  const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0
  
  return {
    panelCount,
    renderTime,
    scrollFps: 0, // Measured separately
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryAfter - memoryBefore,
    timestamp: Date.now(),
  }
}

/**
 * Measure scroll FPS during rapid scrolling
 */
export function measureScrollFps(
  scrollContainer: HTMLElement,
  durationMs: number = 2000
): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0
    let startTime: number
    const scrollHeight = scrollContainer.scrollHeight
    const containerHeight = scrollContainer.clientHeight
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      
      if (elapsed < durationMs) {
        frames++
        // Simulate rapid scroll
        const scrollPos = (elapsed / durationMs) * (scrollHeight - containerHeight)
        scrollContainer.scrollTop = scrollPos
        requestAnimationFrame(animate)
      } else {
        const fps = Math.round((frames / elapsed) * 1000)
        resolve(fps)
      }
    }
    
    requestAnimationFrame(animate)
  })
}

/**
 * Run full benchmark suite: 100 → 1000 → 5000 panels
 */
export async function runBenchmark(
  renderFn: (count: number) => Promise<void>,
  scrollContainer?: HTMLElement
): Promise<BenchmarkSuite> {
  const panelCounts = [100, 1000, 5000]
  const results: BenchmarkResult[] = []
  
  console.log('[Benchmark] Starting grid benchmark suite...')
  
  for (const count of panelCounts) {
    console.log(`[Benchmark] Testing ${count} panels...`)
    
    // Warm up
    await renderFn(count)
    await new Promise(r => setTimeout(r, 100))
    
    // Measure render
    const result = await measureRender(count, renderFn)
    
    // Measure scroll FPS if container provided
    if (scrollContainer && count <= 1000) {
      result.scrollFps = await measureScrollFps(scrollContainer, 1000)
    }
    
    results.push(result)
    
    console.log(`[Benchmark] ${count} panels: ${result.renderTime.toFixed(2)}ms render, ` +
                `${result.scrollFps} FPS, ${(result.memoryDelta / 1024 / 1024).toFixed(2)}MB memory`)
    
    // Cool down between tests
    await new Promise(r => setTimeout(r, 500))
  }
  
  const suite: BenchmarkSuite = { results }
  saveBenchmarks(suite)
  
  console.log('[Benchmark] Suite complete. Results saved to localStorage.')
  return suite
}

/**
 * Save benchmarks to localStorage
 */
export function saveBenchmarks(suite: BenchmarkSuite): void {
  try {
    const existing = loadBenchmarks()
    const allSuites = [...existing, suite]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSuites.slice(-10))) // Keep last 10
  } catch (e) {
    console.error('[Benchmark] Failed to save:', e)
  }
}

/**
 * Load benchmarks from localStorage
 */
export function loadBenchmarks(): BenchmarkSuite[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * Compare current result with baseline
 */
export function compareToBaseline(
  current: BenchmarkResult,
  baseline: BenchmarkResult
): { renderDelta: number; fpsDelta: number; memoryDelta: number } {
  return {
    renderDelta: current.renderTime - baseline.renderTime,
    fpsDelta: current.scrollFps - baseline.scrollFps,
    memoryDelta: current.memoryDelta - baseline.memoryDelta,
  }
}

/**
 * Export benchmark results as JSON
 */
export function exportBenchmarks(): string {
  const suites = loadBenchmarks()
  return JSON.stringify(suites, null, 2)
}

// Quick benchmark function for console use
export async function benchmark(
  renderFn: (count: number) => Promise<void>,
  scrollContainer?: HTMLElement
): Promise<void> {
  const suite = await runBenchmark(renderFn, scrollContainer)
  
  console.table(suite.results.map(r => ({
    Panels: r.panelCount,
    'Render (ms)': r.renderTime.toFixed(2),
    'Scroll FPS': r.scrollFps || 'N/A',
    'Memory (MB)': (r.memoryDelta / 1024 / 1024).toFixed(2),
  })))
}

export default { benchmark, measureRender, measureScrollFps, exportBenchmarks }
