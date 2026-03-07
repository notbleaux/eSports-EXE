/**
 * WebGL Renderer Base Class
 * 
 * Provides foundation for WebGL-based visualization layers.
 * Handles context creation, shader compilation, and basic rendering loop.
 */
export abstract class WebGLRenderer {
  protected canvas: HTMLCanvasElement;
  protected gl: WebGL2RenderingContext;
  protected program: WebGLProgram | null = null;
  protected animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('webgl2');
    
    if (!ctx) {
      throw new Error('WebGL2 not supported');
    }
    
    this.gl = ctx;
    this.init();
  }

  /**
   * Initialize WebGL context and resources
   */
  protected init(): void {
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.clearColor(0, 0, 0, 0);
  }

  /**
   * Compile shader from source
   */
  protected compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    
    if (!shader) {
      throw new Error('Failed to create shader');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  /**
   * Create shader program from vertex and fragment shaders
   */
  protected createProgram(
    vertexSource: string, 
    fragmentSource: string
  ): WebGLProgram {
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(
      this.gl.FRAGMENT_SHADER, 
      fragmentSource
    );

    const program = this.gl.createProgram();
    
    if (!program) {
      throw new Error('Failed to create program');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      throw new Error(`Program linking failed: ${error}`);
    }

    return program;
  }

  /**
   * Abstract render method - implement in subclasses
   */
  abstract render(deltaTime: number): void;

  /**
   * Start render loop
   */
  start(): void {
    const loop = (timestamp: number) => {
      this.render(timestamp);
      this.animationId = requestAnimationFrame(loop);
    };
    
    this.animationId = requestAnimationFrame(loop);
  }

  /**
   * Stop render loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resize canvas and viewport
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    
    if (this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

export default WebGLRenderer;
