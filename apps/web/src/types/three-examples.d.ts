/**
 * Type declarations for Three.js examples
 * These are stub declarations to resolve TS2307 errors
 */

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
    target: import('three').Vector3;
    mouseButtons: {
      LEFT: number;
      MIDDLE: number;
      RIGHT: number;
    };
    update(): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, Group, AnimationClip } from 'three';
  export interface GLTF {
    scene: Group;
    scenes: Group[];
    cameras: import('three').Camera[];
    animations: AnimationClip[];
    asset: object;
  }
  export class GLTFLoader extends Loader {
    setDRACOLoader(dracoLoader: unknown): void;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent | unknown) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/OBJLoader' {
  import { Loader, Group } from 'three';
  export class OBJLoader extends Loader {
    load(
      url: string,
      onLoad: (group: Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent | unknown) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/FBXLoader' {
  import { Loader, Group } from 'three';
  export class FBXLoader extends Loader {
    load(
      url: string,
      onLoad: (group: Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent | unknown) => void
    ): void;
  }
}

declare module 'three/examples/jsm/loaders/DRACOLoader' {
  import { Loader } from 'three';
  export class DRACOLoader extends Loader {
    setDecoderPath(path: string): void;
  }
}

declare module 'three/examples/jsm/loaders/KTX2Loader' {
  import { Loader, CompressedTexture } from 'three';
  export class KTX2Loader extends Loader {
    setTranscoderPath(path: string): void;
    detectSupport(renderer: import('three').WebGLRenderer): this;
    load(
      url: string,
      onLoad: (texture: CompressedTexture) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent | unknown) => void
    ): void;
  }
}
