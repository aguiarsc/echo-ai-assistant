"use client";

import { useEffect, useRef } from 'react';

const NeuroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<any>(null);
  
  const pointer = useRef({
    x: 0,
    y: 0,
    tX: 0,
    tY: 0,
  });

  // Vertex shader source
  const vertexShaderSource = `
    precision mediump float;
    
    varying vec2 vUv;
    attribute vec2 a_position;
    
    void main() {
        vUv = .5 * (a_position + 1.);
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader source
  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec2 vUv;
    uniform float u_time;
    uniform float u_ratio;
    uniform vec2 u_pointer_position;
    uniform float u_scroll_progress;
    
    vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
    }
    
    float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.);
        vec2 res = vec2(0.);
        float scale = 8.;
        
        for (int j = 0; j < 15; j++) {
            uv = rotate(uv, 1.);
            sine_acc = rotate(sine_acc, 1.);
            vec2 layer = uv * scale + float(j) + sine_acc - t;
            sine_acc += sin(layer) + 2.4 * p;
            res += (.5 + .5 * cos(layer)) / scale;
            scale *= (1.2);
        }
        return res.x + res.y;
    }
    
    void main() {
        vec2 uv = .5 * vUv;
        uv.x *= u_ratio;
        
        vec2 pointer_pos = vUv - u_pointer_position;
        pointer_pos.x *= u_ratio;
        float p = clamp(length(pointer_pos), 0., 1.);
        p = .5 * pow(1. - p, 2.);
        
        float t = .0003 * u_time;
        vec3 color = vec3(0.);
        
        float noise = neuro_shape(uv, t, 0.1);
        
        noise = 1.2 * pow(noise, 3.);
        noise += pow(noise, 10.);
        noise = max(.0, noise - .5);
        noise *= (1. - length(vUv - .5));
        
        color = normalize(vec3(.2 + .3 * cos(3. * u_scroll_progress), .3 + .2 * cos(3. * u_scroll_progress), .8 + .2 * sin(3. * u_scroll_progress)));
        
        color = color * noise;
        
        gl_FragColor = vec4(color, noise);
    }
  `;

  const initShader = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      console.error('WebGL is not supported by your browser.');
      return null;
    }

    const createShader = (gl: WebGLRenderingContext, sourceCode: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = createShader(gl as WebGLRenderingContext, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl as WebGLRenderingContext, fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const createShaderProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
      const program = gl.createProgram();
      if (!program) return null;
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
      }

      return program;
    };

    const shaderProgram = createShaderProgram(gl as WebGLRenderingContext, vertexShader, fragmentShader);
    if (!shaderProgram) return null;

    const getUniforms = (program: WebGLProgram) => {
      const uniforms: { [key: string]: WebGLUniformLocation | null } = {};
      const uniformCount = (gl as WebGLRenderingContext).getProgramParameter(program, (gl as WebGLRenderingContext).ACTIVE_UNIFORMS);
      
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = (gl as WebGLRenderingContext).getActiveUniform(program, i);
        if (uniformInfo) {
          uniforms[uniformInfo.name] = (gl as WebGLRenderingContext).getUniformLocation(program, uniformInfo.name);
        }
      }
      return uniforms;
    };

    uniformsRef.current = getUniforms(shaderProgram);

    const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);

    const glContext = gl as WebGLRenderingContext;
    const vertexBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);

    glContext.useProgram(shaderProgram);

    const positionLocation = glContext.getAttribLocation(shaderProgram, "a_position");
    glContext.enableVertexAttribArray(positionLocation);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);

    return glContext;
  };

  const render = () => {
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    
    if (!gl || !uniforms) return;

    const currentTime = performance.now();

    // Smooth pointer movement
    pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
    pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;

    // Update uniforms
    gl.uniform1f(uniforms.u_time, currentTime);
    gl.uniform2f(
      uniforms.u_pointer_position,
      0.5,
      0.5
    );
    gl.uniform1f(
      uniforms.u_scroll_progress,
      window.pageYOffset / (4 * window.innerHeight)
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animationFrameRef.current = requestAnimationFrame(render);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    
    if (!canvas || !gl || !uniforms) return;

    const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
    
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    
    gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const updateMousePosition = (eX: number, eY: number) => {
    pointer.current.tX = eX;
    pointer.current.tY = eY;
  };

  const setupEvents = () => {
    // No mouse events needed anymore
    return () => {
      // No cleanup needed
    };
  };

  useEffect(() => {
    const gl = initShader();
    if (!gl) return;
    
    glRef.current = gl as WebGLRenderingContext;
    
    const cleanupEvents = setupEvents();
    resizeCanvas();
    
    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    
    render();

    return () => {
      cleanupEvents();
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-95"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default NeuroCanvas;
