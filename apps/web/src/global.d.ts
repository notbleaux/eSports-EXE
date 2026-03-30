// Type declarations for missing modules

// Three.js - Use ambient module augmentation
declare module 'three' {
  export class Scene {
    add(object: unknown): void;
  }
  export class Camera {}
  export class WebGLRenderer {
    constructor(options?: { antialias?: boolean; alpha?: boolean });
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
    domElement: HTMLCanvasElement;
    dispose(): void;
  }
  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    position: Vector3;
    fov: number;
    updateProjectionMatrix(): void;
  }
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): void;
  }
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }
  export class Color {
    constructor(color?: string | number);
    r: number;
    g: number;
    b: number;
  }
  export class Mesh {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
  }
  export class Group {
    add(object: unknown): void;
  }
  export class Raycaster {
    setFromCamera(coords: Vector2, camera: Camera): void;
    intersectObjects(objects: unknown[]): Intersection[];
  }
  export interface Intersection {
    object: Object3D;
    point: Vector3;
  }
  export class Object3D {
    position: Vector3;
    visible: boolean;
  }
  export class Plane {
    constructor(normal?: Vector3, constant?: number);
  }
  export const DoubleSide: number;
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
  }
}

// D3 - Use ambient module augmentation  
declare module 'd3' {
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
    transform(selection: T, transform: unknown): void;
  }
  export function select(selector: string): unknown;
  export function zoom(): ZoomBehavior<unknown, unknown>;
  export function forceSimulation<T>(nodes?: T[]): Simulation<T>;
  export function forceLink<T, L>(links?: L[]): unknown;
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
