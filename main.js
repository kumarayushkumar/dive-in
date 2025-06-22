import * as THREE from 'three';

class GLSLPlayground {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true 
        });
        
        const canvasWidth = window.innerWidth - 200;
        this.renderer.setSize(canvasWidth, window.innerHeight);
        
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.material = null;
        this.mesh = null;
        
        this.startTime = Date.now();
        this.uniforms = {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(canvasWidth, window.innerHeight) },
            mouse: { value: new THREE.Vector2(0.5, 0.5) }
        };
        
        this.currentExample = 0;
        this.examples = this.createExamples();
        
        this.setupEventListeners();
        this.loadExample(0);
        this.animate();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.example-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => this.loadExample(index));
        });
        
        window.addEventListener('resize', () => {
            const width = window.innerWidth - 200;
            const height = window.innerHeight;
            this.renderer.setSize(width, height);
            this.uniforms.resolution.value.set(width, height);
        });
        
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = 1.0 - (event.clientY - rect.top) / rect.height;
            this.uniforms.mouse.value.set(x, y);
        });
    }
    
    createExamples() {
        const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`.trim();

        return [
            {
                name: "Infinite Psychedelic",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

// Time-based random that never repeats
float timeRandom(vec2 st, float t) {
    return fract(sin(dot(st.xy + t * 0.1, vec2(12.9898 + sin(t * 0.01), 78.233 + cos(t * 0.013)))) * (43758.5453123 + t));
}

// Fractal noise with time variation
float noise(vec2 st, float t) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = timeRandom(i, t);
    float b = timeRandom(i + vec2(1.0, 0.0), t);
    float c = timeRandom(i + vec2(0.0, 1.0), t);
    float d = timeRandom(i + vec2(1.0, 1.0), t);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Psychedelic color palette that evolves with time
vec3 psychedelicPalette(float t, float timeVar) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(
        1.0 + sin(timeVar * 0.001) * 0.2,
        1.0 + sin(timeVar * 0.0013) * 0.2,
        1.0 + sin(timeVar * 0.0017) * 0.2
    );
    vec3 d = vec3(
        0.263 + sin(timeVar * 0.002) * 0.1,
        0.416 + sin(timeVar * 0.0023) * 0.1,
        0.557 + sin(timeVar * 0.0027) * 0.1
    );
    
    return a + b * cos(6.28318 * (c * t + d + timeVar * 0.0001));
}

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    
    float slowTime = time * 0.1;
    float mediumTime = time * 0.3;
    float fastTime = time * 0.7;
    
    // Spiral distortion that evolves
    vec2 toCenter = uv - center;
    float angle = atan(toCenter.y, toCenter.x);
    float radius = length(toCenter);
    
    float spiralPattern = sin(
        angle * (3.0 + sin(time * 0.01)) + 
        radius * (20.0 + sin(time * 0.007) * 5.0) - 
        mediumTime * (2.0 + sin(time * 0.003))
    );
    
    // Multiple noise layers
    float pattern1 = noise(uv * 3.0, time);
    float pattern2 = noise(uv * 6.0 + vec2(100.0), time * 1.3);
    
    float combined = mix(pattern1, pattern2 + spiralPattern * 0.3, sin(fastTime) * 0.5 + 0.5);
    
    // Mouse interaction
    float mouseDist = length(uv - mouse);
    float mouseEffect = exp(-mouseDist * 3.0) * sin(mouseDist * 15.0 - fastTime * 3.0);
    combined += mouseEffect * 0.4;
    
    vec3 color = psychedelicPalette(combined, time);
    
    // Add highlights
    float highlight = pow(max(0.0, sin(combined * 10.0 + fastTime)), 3.0);
    color += highlight * psychedelicPalette(combined + 0.5, time * 1.7) * 0.3;
    
    // Breathing effect
    color *= sin(slowTime) * 0.1 + 1.0;
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            },
            {
                name: "Cosmic Kaleidoscope",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

// Kaleidoscope transformation
vec2 kaleidoscope(vec2 uv, float segments) {
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    angle = mod(angle, 6.28318 / segments);
    if (mod(floor(atan(uv.y, uv.x) / (6.28318 / segments)), 2.0) == 1.0) {
        angle = 6.28318 / segments - angle;
    }
    
    return vec2(cos(angle), sin(angle)) * radius;
}

// Cosmic color palette
vec3 cosmicPalette(float t) {
    vec3 purple = vec3(0.5, 0.0, 1.0);
    vec3 pink = vec3(1.0, 0.2, 0.8);
    vec3 cyan = vec3(0.0, 0.8, 1.0);
    vec3 gold = vec3(1.0, 0.8, 0.0);
    
    float phase = fract(t + time * 0.001);
    
    if (phase < 0.25) return mix(purple, pink, phase * 4.0);
    else if (phase < 0.5) return mix(pink, cyan, (phase - 0.25) * 4.0);
    else if (phase < 0.75) return mix(cyan, gold, (phase - 0.5) * 4.0);
    else return mix(gold, purple, (phase - 0.75) * 4.0);
}

void main() {
    vec2 uv = vUv - 0.5;
    
    // Apply kaleidoscope effect
    uv = kaleidoscope(uv, 8.0 + sin(time * 0.1) * 2.0);
    
    float radius = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Create cosmic patterns
    float pattern1 = sin(radius * 10.0 - time * 2.0);
    float pattern2 = sin(angle * 5.0 + time * 1.5);
    float pattern3 = sin((radius + angle) * 8.0 - time * 3.0);
    
    float combined = (pattern1 + pattern2 + pattern3) / 3.0;
    
    // Mouse interaction creates cosmic bursts
    float mouseDist = length((vUv - 0.5) - (mouse - 0.5));
    float mouseBurst = exp(-mouseDist * 4.0) * sin(mouseDist * 20.0 - time * 5.0);
    combined += mouseBurst * 0.5;
    
    // Tunnel effect
    float tunnel = sin(1.0 / (radius + 0.1) * 3.0 - time * 2.0);
    combined += tunnel * 0.3;
    
    vec3 color = cosmicPalette(combined);
    
    // Add starfield effect
    float stars = step(0.98, sin(uv.x * 100.0) * sin(uv.y * 100.0));
    color += stars * vec3(1.0, 1.0, 0.8) * 0.5;
    
    // Cosmic glow
    color += exp(-radius * 2.0) * cosmicPalette(combined + 0.5) * 0.3;
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            },
            {
                name: "Liquid Dreams",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

// Simple noise for liquid effects
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Liquid color palette
vec3 liquidPalette(float t) {
    vec3 deep = vec3(0.0, 0.1, 0.3);
    vec3 mid = vec3(0.0, 0.5, 0.8);
    vec3 bright = vec3(0.4, 0.8, 1.0);
    vec3 foam = vec3(0.9, 0.9, 1.0);
    
    float phase = fract(t);
    
    if (phase < 0.33) return mix(deep, mid, phase * 3.0);
    else if (phase < 0.66) return mix(mid, bright, (phase - 0.33) * 3.0);
    else return mix(bright, foam, (phase - 0.66) * 3.0);
}

void main() {
    vec2 uv = vUv;
    
    // Create flowing liquid distortion
    vec2 flow = vec2(
        sin(uv.y * 3.0 + time * 0.5) * 0.1,
        cos(uv.x * 2.0 + time * 0.3) * 0.15
    );
    
    uv += flow;
    
    // Multiple layers of liquid motion
    float layer1 = noise(uv * 4.0 + time * 0.2);
    float layer2 = noise(uv * 8.0 - time * 0.15);
    float layer3 = noise(uv * 16.0 + time * 0.1);
    
    // Combine layers with different weights
    float combined = layer1 * 0.5 + layer2 * 0.3 + layer3 * 0.2;
    
    // Add wave patterns
    float waves = sin(uv.x * 8.0 + time) * sin(uv.y * 6.0 + time * 0.7);
    combined += waves * 0.2;
    
    // Mouse creates ripples
    float mouseDist = length(uv - mouse);
    float ripples = sin(mouseDist * 15.0 - time * 3.0) * exp(-mouseDist * 2.0);
    combined += ripples * 0.3;
    
    // Depth effect
    float depth = length(uv - 0.5);
    combined -= depth * 0.3;
    
    vec3 color = liquidPalette(combined + time * 0.01);
    
    // Add surface reflections
    float reflection = pow(max(0.0, sin(combined * 12.0 + time * 2.0)), 2.0);
    color += reflection * vec3(0.8, 0.9, 1.0) * 0.4;
    
    // Caustic patterns
    float caustics = sin(uv.x * 20.0 + time) * sin(uv.y * 20.0 + time * 1.3);
    caustics = pow(max(0.0, caustics), 3.0);
    color += caustics * vec3(0.5, 0.8, 1.0) * 0.3;
    
    // Underwater glow
    color *= 0.8 + 0.4 * sin(time * 0.5);
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            }
        ];
    }
    
    loadExample(index) {
        this.currentExample = index;
        const example = this.examples[index];
        
        document.querySelectorAll('.example-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
        
        this.compileShaders(example.vertexShader, example.fragmentShader);
    }
    
    compileShaders(vertexShader, fragmentShader) {
        try {
            if (this.mesh) {
                this.scene.remove(this.mesh);
                this.material.dispose();
            }
            
            this.material = new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });
            
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.scene.add(this.mesh);
            
            console.log(`Example "${this.examples[this.currentExample].name}" loaded successfully!`);
            
        } catch (error) {
            console.error('Shader compilation error:', error);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.uniforms.time.value = (Date.now() - this.startTime) / 1000.0;
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => new GLSLPlayground());
