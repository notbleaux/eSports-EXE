// Type declarations for missing modules

// Three.js - Use ambient module augmentation
declare module 'three' {
  export class Scene {
    add(object: unknown): void;
    children: unknown[];
  }
  export class Camera {
    position: Vector3;
  }
  export class WebGLRenderer {
    constructor(options?: { 
      antialias?: boolean; 
      alpha?: boolean;
      canvas?: HTMLCanvasElement;
      premultipliedAlpha?: boolean;
    });
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
    domElement: HTMLCanvasElement;
    dispose(): void;
    setPixelRatio(ratio: number): void;
    setClearColor(color: string | number, alpha?: number): void;
    clear(): void;
    shadowMap: {
      enabled: boolean;
      type: number;
    };
  }
  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    aspect: number;
    fov: number;
    near: number;
    far: number;
    position: Vector3;
    updateProjectionMatrix(): void;
    lookAt(target: Vector3 | { x: number; y: number; z: number }): void;
  }
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    setScalar(s: number): this;
    copy(v: Vector3): this;
    clone(): Vector3;
    add(v: Vector3): this;
    sub(v: Vector3): this;
    multiplyScalar(s: number): this;
    distanceTo(v: Vector3): number;
  }
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): void;
  }
  export class Color {
    constructor(color?: string | number | Color, g?: number, b?: number);
    r: number;
    g: number;
    b: number;
    set(color: string | number): this;
    getHexString(): string;
    clone(): Color;
  }
  export class Mesh {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    visible: boolean;
    geometry: unknown;
    material: unknown;
    castShadow: boolean;
    receiveShadow: boolean;
  }
  export class Group {
    add(object: unknown): void;
    remove(object: unknown): void;
    position: Vector3;
    visible: boolean;
    getWorldPosition(target: Vector3): Vector3;
    children: unknown[];
  }
  export class Raycaster {
    setFromCamera(coords: Vector2, camera: Camera): void;
    intersectObjects(objects: unknown[], recursive?: boolean): Intersection[];
  }
  export interface Intersection {
    object: Object3D;
    point: Vector3;
    distance: number;
  }
  export class Object3D {
    position: Vector3;
    visible: boolean;
    userData: Record<string, unknown>;
  }
  export class Plane {
    constructor(normal?: Vector3, constant?: number);
    normal: Vector3;
    constant: number;
  }
  export const DoubleSide: number;
  export const FrontSide: number;
  export const BackSide: number;
  export const PCFSoftShadowMap: number;
}

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
