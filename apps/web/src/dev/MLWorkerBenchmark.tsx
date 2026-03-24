/**
 * ML Worker Benchmark Tool
 * Tests Web Worker vs Main Thread performance for ML inference
 * 
 * [Ver001.000]
 */

import React, { useState, useCallback, useRef } from 'react'
import { useMLInference } from '../hooks/useMLInference'
import type { MLBatchResult } from '../types/worker'

interface BenchmarkResult {
  batchSize: number
  workerTime: number
  mainThreadTime: number
  workerThroughput: number
  mainThreadThroughput: number
  speedup: number
  uiBlocking: boolean
}

interface TestRun {
  id: string
  timestamp: Date
  results: BenchmarkResult[]
}

const BATCH_SIZES = [10, 50, 100, 250, 500]

export const MLWorkerBenchmark: React.FC = () => {
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [progress, setProgress] = useState(0)
  const [useWorkerForTest, setUseWorkerForTest] = useState(true)
  
  // Animation frame counter to detect UI blocking
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())
  const uiBlockedRef = useRef(false)
  
  const {
    loadModel,
    predictBatch,
    isModelReady,
    isModelLoading,
    isPredicting,
    error,
    useWorker,
    setUseWorker,
    workerStatus
  } = useMLInference({
    useWorker: useWorkerForTest,
    onProgress: (p) => setProgress(p.percentComplete)
  })

  // Start animation frame counter
  const startFrameCounter = useCallback(() => {
    frameCountRef.current = 0
    lastFrameTimeRef.current = performance.now()
    uiBlockedRef.current = false
    
    const countFrames = () => {
      const now = performance.now()
      const elapsed = now - lastFrameTimeRef.current
      
      // If frame took longer than 100ms, UI is likely blocked
      if (elapsed > 100 && frameCountRef.current > 0) {
        uiBlockedRef.current = true
      }
      
      lastFrameTimeRef.current = now
      frameCountRef.current++
      
      if (isRunning) {
        requestAnimationFrame(countFrames)
      }
    }
    
    requestAnimationFrame(countFrames)
  }, [isRunning])

  // Generate random test data
  const generateTestData = (batchSize: number): number[][] => {
    return Array.from({ length: batchSize }, () => 
      Array.from({ length: 3 }, () => Math.random())
    )
  }

  // Run benchmark for a single batch size
  const runBenchmark = async (batchSize: number, useWorkerMode: boolean): Promise<{ time: number; throughput: number }> => {
    const inputs = generateTestData(batchSize)
    
    // Set worker mode
    setUseWorker(useWorkerMode)
    
    // Wait for mode switch
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const startTime = performance.now()
    const result = await predictBatch(inputs)
    const endTime = performance.now()
    
    return {
      time: endTime - startTime,
      throughput: result.throughput
    }
  }

  // Run full benchmark suite
  const runFullBenchmark = useCallback(async () => {
    if (!isModelReady) {
      await loadModel('/models/default-model.json')
      return
    }
    
    setIsRunning(true)
    setCurrentTest('Initializing...')
    startFrameCounter()
    
    const results: BenchmarkResult[] = []
    
    try {
      for (const batchSize of BATCH_SIZES) {
        // Test with worker
        setCurrentTest(`Testing batch size ${batchSize} with Worker...`)
        setUseWorkerForTest(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const workerResult = await runBenchmark(batchSize, true)
        const workerBlocked = uiBlockedRef.current
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Test with main thread
        setCurrentTest(`Testing batch size ${batchSize} with Main Thread...`)
        uiBlockedRef.current = false
        lastFrameTimeRef.current = performance.now()
        
        const mainThreadResult = await runBenchmark(batchSize, false)
        const mainThreadBlocked = uiBlockedRef.current
        
        results.push({
          batchSize,
          workerTime: workerResult.time,
          mainThreadTime: mainThreadResult.time,
          workerThroughput: workerResult.throughput,
          mainThreadThroughput: mainThreadResult.throughput,
          speedup: mainThreadResult.time / workerResult.time,
          uiBlocking: mainThreadBlocked && !workerBlocked
        })
        
        // Delay between batch sizes
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Save test run
      setTestRuns(prev => [{
        id: `run-${Date.now()}`,
        timestamp: new Date(),
        results
      }, ...prev].slice(0, 5))
      
    } finally {
      setIsRunning(false)
      setCurrentTest('')
      setProgress(0)
    }
  }, [isModelReady, loadModel, predictBatch, startFrameCounter])

  // Quick test with specific batch size
  const runQuickTest = useCallback(async (batchSize: number) => {
    if (!isModelReady) {
      await loadModel('/models/default-model.json')
      return
    }
    
    setIsRunning(true)
    startFrameCounter()
    
    try {
      setCurrentTest(`Running ${batchSize} predictions with ${useWorker ? 'Worker' : 'Main Thread'}...`)
      
      const inputs = generateTestData(batchSize)
      const startTime = performance.now()
      
      await predictBatch(inputs)
      
      const totalTime = performance.now() - startTime
      const throughput = batchSize / (totalTime / 1000)
      
      setTestRuns(prev => [{
        id: `quick-${Date.now()}`,
        timestamp: new Date(),
        results: [{
          batchSize,
          workerTime: useWorker ? totalTime : 0,
          mainThreadTime: useWorker ? 0 : totalTime,
          workerThroughput: useWorker ? throughput : 0,
          mainThreadThroughput: useWorker ? 0 : throughput,
          speedup: 1,
          uiBlocking: uiBlockedRef.current
        }]
      }, ...prev].slice(0, 5))
      
    } finally {
      setIsRunning(false)
      setCurrentTest('')
      setProgress(0)
    }
  }, [isModelReady, loadModel, predictBatch, useWorker, startFrameCounter])

  if (isModelLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">ML Worker Benchmark</h1>
        <div className="p-4 rounded-lg bg-gray-800">
          <p className="text-gray-400">Loading model...</p>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">ML Worker Benchmark</h1>
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50">
          <p className="text-red-400">Error: {error.message}</p>
          <button
            onClick={() => loadModel('/models/default-model.json')}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">ML Worker Benchmark</h1>
      <p className="text-gray-400 mb-6">
        Compare Web Worker vs Main Thread performance for ML inference
      </p>

      {/* Controls */}
      <div className="mb-6 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Mode:</span>
            <button
              onClick={() => setUseWorkerForTest(true)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                useWorkerForTest 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Web Worker
            </button>
            <button
              onClick={() => setUseWorkerForTest(false)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !useWorkerForTest 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Main Thread
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2 py-1 rounded ${
              workerStatus === 'idle' ? 'bg-green-500/20 text-green-400' :
              workerStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {workerStatus}
            </span>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Quick Test:</p>
          <div className="flex gap-2">
            {[10, 50, 100].map(size => (
              <button
                key={size}
                onClick={() => runQuickTest(size)}
                disabled={isRunning || !isModelReady}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {size} Predictions
              </button>
            ))}
          </div>
        </div>

        {/* Full Benchmark Button */}
        <button
          onClick={runFullBenchmark}
          disabled={isRunning || !isModelReady}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 transition-all"
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {currentTest}
            </span>
          ) : (
            'Run Full Benchmark Suite'
          )}
        </button>

        {/* Progress */}
        {isRunning && progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {testRuns.length > 0 && (
        <div className="space-y-6">
          {testRuns.map(run => (
            <div key={run.id} className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  {run.results.length > 1 ? 'Full Benchmark Results' : 'Quick Test Result'}
                </h3>
                <span className="text-sm text-gray-500">
                  {run.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-3">Batch Size</th>
                      {run.results[0]?.workerTime > 0 && (
                        <>
                          <th className="text-right py-2 px-3">Worker Time</th>
                          <th className="text-right py-2 px-3">Worker Throughput</th>
                        </>
                      )}
                      {run.results[0]?.mainThreadTime > 0 && (
                        <>
                          <th className="text-right py-2 px-3">Main Thread Time</th>
                          <th className="text-right py-2 px-3">Main Thread Throughput</th>
                        </>
                      )}
                      {run.results[0]?.speedup !== 1 && (
                        <th className="text-right py-2 px-3">Speedup</th>
                      )}
                      <th className="text-center py-2 px-3">UI Blocking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.results.map((result, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50 last:border-0">
                        <td className="py-3 px-3 text-white font-medium">{result.batchSize}</td>
                        {result.workerTime > 0 && (
                          <>
                            <td className="text-right py-3 px-3 text-green-400">
                              {result.workerTime.toFixed(1)}ms
                            </td>
                            <td className="text-right py-3 px-3 text-green-400">
                              {result.workerThroughput.toFixed(0)}/s
                            </td>
                          </>
                        )}
                        {result.mainThreadTime > 0 && (
                          <>
                            <td className="text-right py-3 px-3 text-blue-400">
                              {result.mainThreadTime.toFixed(1)}ms
                            </td>
                            <td className="text-right py-3 px-3 text-blue-400">
                              {result.mainThreadThroughput.toFixed(0)}/s
                            </td>
                          </>
                        )}
                        {result.speedup !== 1 && (
                          <td className="text-right py-3 px-3">
                            <span className={result.speedup > 1 ? 'text-green-400' : 'text-yellow-400'}>
                              {result.speedup.toFixed(2)}x
                            </span>
                          </td>
                        )}
                        <td className="text-center py-3 px-3">
                          {result.uiBlocking ? (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                              YES
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                              NO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
        <h3 className="text-sm font-medium text-blue-400 mb-2">About This Benchmark</h3>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Web Worker runs ML inference off the main thread, keeping UI responsive</li>
          <li>Main Thread may cause UI freezing during heavy inference workloads</li>
          <li>Speedup {'>'} 1 means Worker is faster; {'<'} 1 means Main Thread is faster</li>
          <li>UI Blocking detection uses requestAnimationFrame to detect frame drops</li>
          <li>Results may vary based on device capabilities and browser implementation</li>
        </ul>
      </div>
    </div>
  )
}

export default MLWorkerBenchmark
