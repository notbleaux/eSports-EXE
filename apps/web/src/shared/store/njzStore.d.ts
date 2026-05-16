/**
 * EXE Store Types
 * [Ver001.000]
 */
import type { StoreApi } from 'zustand';

export interface EXEState {
  addNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export declare const useEXEStore: <T>(selector: (state: EXEState) => T) => T;

export interface HubState {
  state: Record<string, unknown>;
  setState: (hub: string, newState: Record<string, unknown>) => void;
}

export declare const useHubState: (hub: string) => HubState;
