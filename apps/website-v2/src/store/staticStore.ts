/**
 * Static Store - Grid Configuration (Never Changes After Init)
 * [Ver001.000]
 */
import { create } from 'zustand'

export interface GridConfig {
  cols: number
  rowHeight: number
  margin: [number, number]
  containerPadding: [number, number]
  minW: number
  minH: number
  maxW: number
  maxH: number
}

const DEFAULT_CONFIG: GridConfig = {
  cols: 6,
  rowHeight: 80,
  margin: [16, 16],
  containerPadding: [16, 16],
  minW: 2,
  minH: 2,
  maxW: 6,
  maxH: 8,
}

export const useStaticStore = create<GridConfig>(() => DEFAULT_CONFIG)

// Selector hooks for granular access
export const useGridConfig = () => useStaticStore((state) => state)
export const useCols = () => useStaticStore((state) => state.cols)
export const useRowHeight = () => useStaticStore((state) => state.rowHeight)
