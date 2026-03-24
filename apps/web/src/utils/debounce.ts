/**
 * Debounce utility functions
 * 
 * [Ver001.000]
 */

/**
 * Creates a debounced version of a function that delays invoking func until
 * after wait milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
  immediate: boolean = false
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
} {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let args: Parameters<T> | null = null
  let context: ThisParameterType<T> | null = null
  let result: ReturnType<T> | undefined

  const later = function () {
    timeout = null
    if (!immediate) {
      result = func.apply(context!, args!)
    }
  }

  const debounced = function (
    this: ThisParameterType<T>,
    ...callArgs: Parameters<T>
  ) {
    context = this
    args = callArgs

    const callNow = immediate && !timeout

    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)

    if (callNow) {
      result = func.apply(context, args)
    }

    return result
  }

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = null
    args = null
    context = null
  }

  debounced.flush = function () {
    if (timeout) {
      clearTimeout(timeout)
      result = func.apply(context!, args!)
      timeout = null
      args = null
      context = null
    }
    return result
  }

  return debounced
}

/**
 * Creates a throttled version of a function that only invokes func at most once
 * per every wait milliseconds.
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
} {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let previous = 0
  let args: Parameters<T> | null = null
  let context: ThisParameterType<T> | null = null
  let result: ReturnType<T> | undefined

  const { leading = true, trailing = true } = options

  const later = function () {
    previous = leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context!, args!)
    if (!timeout) {
      args = null
      context = null
    }
  }

  const throttled = function (
    this: ThisParameterType<T>,
    ...callArgs: Parameters<T>
  ) {
    const now = Date.now()
    if (!previous && leading === false) {
      previous = now
    }

    const remaining = wait - (now - previous)
    context = this
    args = callArgs

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) {
        args = null
        context = null
      }
    } else if (!timeout && trailing !== false) {
      timeout = setTimeout(later, remaining)
    }

    return result
  }

  throttled.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
    }
    previous = 0
    timeout = null
    args = null
    context = null
  }

  throttled.flush = function () {
    if (timeout) {
      clearTimeout(timeout)
      result = func.apply(context!, args!)
      previous = 0
      timeout = null
      args = null
      context = null
    }
    return result
  }

  return throttled
}

/**
 * Hook-compatible debounce for React useEffect dependencies
 * Returns a stable callback reference that won't cause re-renders
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
} {
  // Return a memoized debounced function
  // Note: In React, wrap this in useMemo to ensure stability
  return debounce(callback, delay)
}

/**
 * Promise-based debounce - returns a promise that resolves with the debounced function result
 */
export function debouncePromise<T extends (...args: Parameters<T>) => Promise<ReturnType<T>>>(
  func: T,
  wait: number
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): Promise<ReturnType<T>>
  cancel: () => void
} {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let resolveList: Array<(value: ReturnType<T>) => void> = []
  let rejectList: Array<(reason?: unknown) => void> = []

  const debounced = function (
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      resolveList.push(resolve)
      rejectList.push(reject)

      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(async () => {
        try {
          const result = await func.apply(this, args)
          resolveList.forEach(r => r(result))
        } catch (error) {
          rejectList.forEach(r => r(error))
        } finally {
          resolveList = []
          rejectList = []
          timeout = null
        }
      }, wait)
    })
  }

  debounced.cancel = function () {
    if (timeout) {
      clearTimeout(timeout)
      rejectList.forEach(r => r(new Error('Debounced function cancelled')))
      resolveList = []
      rejectList = []
      timeout = null
    }
  }

  return debounced
}
