/** [Ver001.000] */
/**
 * Predictive 4D WebGL Renderer
 * ============================
 * WebGL-based 4D predictive lensing with particle field.
 */

export interface PredictiveParticle {
  x: number
  y: number
  probability: number
  timeOffset: number
}

export class Predictive4DRenderer {
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null
  private isRunning: boolean = false

  private vertexShader = `
    attribute vec2 a_position;
    attribute float a_probability;
    varying float v_prob;
    void main() {
      v_prob = a_probability;
      gl_Position = vec4(a_position, 0.0, 1.0);
      gl_PointSize = 10.0 + a_probability * 20.0;
    }
  `

  private fragmentShader = `
    precision mediump float;
    varying float v_prob;
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      if (length(center) > 0.5) discard;
      vec3 color = mix(vec3(0.2, 0.5, 1.0), vec3(1.0, 0.3, 0.1), v_prob);
      gl_FragColor = vec4(color, v_prob * 0.7);
    }
  `

  initialize(canvas: HTMLCanvasElement): boolean {
    this.gl = canvas.getContext('webgl', { alpha: true })
    if (!this.gl) return false

    this.program = this.createProgram(this.gl)
    if (!this.program) return false

    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
    return true
  }

  private createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vs = this.createShader(gl, gl.VERTEX_SHADER, this.vertexShader)
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShader)
    if (!vs || !fs) return null

    const prog = gl.createProgram()
    if (!prog) return null

    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    return prog
  }

  private createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }

  render(particles: PredictiveParticle[]): void {
    if (!this.gl || !this.program) return

    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    const positions = new Float32Array(particles.length * 2)
    const probs = new Float32Array(particles.length)

    particles.forEach((p, i) => {
      positions[i * 2] = (p.x / 32) - 1
      positions[i * 2 + 1] = (p.y / 32) - 1
      probs[i] = p.probability
    })

    const posLoc = this.gl.getAttribLocation(this.program, 'a_position')
    const probLoc = this.gl.getAttribLocation(this.program, 'a_probability')

    const posBuf = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuf)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW)
    this.gl.enableVertexAttribArray(posLoc)
    this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0)

    const probBuf = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, probBuf)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, probs, this.gl.STATIC_DRAW)
    this.gl.enableVertexAttribArray(probLoc)
    this.gl.vertexAttribPointer(probLoc, 1, this.gl.FLOAT, false, 0, 0)

    this.gl.useProgram(this.program)
    this.gl.drawArrays(this.gl.POINTS, 0, particles.length)
  }

  static isSupported(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!canvas.getContext('webgl')
    } catch {
      return false
    }
  }
}

export default Predictive4DRenderer
