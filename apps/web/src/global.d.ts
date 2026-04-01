// Type declarations for missing modules

// Note: Three.js types are provided by @types/three package
// Do NOT declare module 'three' here - it conflicts with the official types

// React Three Fiber - Extended types
declare module '@react-three/fiber' {
  import * as React from 'react';
  import { Vector3, Color, Mesh, Group } from 'three';
  
  export interface MeshProps {
    position?: Vector3 | [number, number, number];
    scale?: Vector3 | number;
    visible?: boolean;
    children?: React.ReactNode;
    ref?: React.Ref<Mesh>;
  }
  
  export interface GroupProps {
    position?: Vector3 | [number, number, number];
    scale?: Vector3 | number;
    visible?: boolean;
    children?: React.ReactNode;
    ref?: React.Ref<Group>;
  }
  
  export interface MaterialProps {
    color?: string | Color;
    transparent?: boolean;
    opacity?: number;
    side?: number;
    depthWrite?: boolean;
  }
  
  // Extended colors for React Three Fiber
  export type ExtendedColors<T> = T & {
    color?: string | Color;
    transparent?: boolean;
    opacity?: number;
    side?: number;
    depthWrite?: boolean;
  };
  
  // Hook exports
  export function useFrame(callback: (state: any, delta: number) => void): void;
  export function useThree(): any;
  export function useLoader(loader: any, url: string): any;
}

// Three.js examples
declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, Vector3 } from 'three';
  export class OrbitControls {
    constructor(camera: Camera, domElement: HTMLElement);
    target: Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    update(): void;
    dispose(): void;
    autoRotate: boolean;
    autoRotateSpeed: number;
  }
}

// D3 - Use proper types from @types/d3
declare module 'd3' {
  import { Selection, BaseType } from 'd3-selection';
  import { SimulationNodeDatum, SimulationLinkDatum, Simulation } from 'd3-force';
  import { ZoomBehavior } from 'd3-zoom';
  
  // Re-export types from specific d3 modules for better type safety
  export interface SimulationNodeDatum {
    id?: string | number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
  }
  
  export interface SimulationLinkDatum<T> {
    source: T | string | number;
    target: T | string | number;
  }
  
  export interface Simulation<T> {
    nodes(): T[];
    nodes(nodes: T[]): this;
    force(name: string, force: unknown): this;
    on(name: string, callback: (event: unknown) => void): this;
    stop(): this;
    restart(): this;
  }
  
  export interface ZoomBehavior<T, D> {
    transform(selection: Selection<T, D, BaseType, unknown>, transform: unknown): void;
  }
  
  // Return proper Selection type instead of unknown
  export function select<Datum = unknown>(selector: string): Selection<BaseType, Datum, HTMLElement, unknown>;
  export function select<Datum = unknown>(selector: BaseType | null): Selection<BaseType, Datum, null, undefined>;
  
  export function zoom<T extends BaseType, D>(): ZoomBehavior<T, D>;
  export function forceSimulation<T extends SimulationNodeDatum>(nodes?: T[]): Simulation<T>;
  export function forceLink<T extends SimulationNodeDatum, L extends SimulationLinkDatum<T>>(links?: L[]): unknown;
  export function forceManyBody(): unknown;
  export function forceCenter(x: number, y: number): unknown;
  export function forceCollide<T>(radius?: number | ((d: T) => number)): unknown;
  export function drag(): unknown;
}

declare module 'react-responsive' {
  import * as React from 'react';
  
  export interface MediaQueryProps {
    query?: string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    orientation?: 'portrait' | 'landscape';
    children?: React.ReactNode | ((matches: boolean) => React.ReactNode);
  }
  
  export class MediaQuery extends React.Component<MediaQueryProps> {}
  
  export function useMediaQuery(query: string | object): boolean;
}

declare module '@storybook/react' {
  export type Meta<T = unknown> = object;
  export type StoryObj<T = unknown> = object;
  export type StoryFn<T = unknown> = () => React.ReactElement;
}

declare module '@sentry/react' {
  export function captureException(error: unknown): void;
  export function showReportDialog(options?: object): void;
}
