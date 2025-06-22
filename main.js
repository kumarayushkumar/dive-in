import * as THREE from 'three';

class GLSLPlayground {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true 
        });
        
        // Canvas is now fullscreen
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        this.geometry = new THREE.PlaneGeometry(2, 2);
        this.material = null;
        this.mesh = null;
        
        this.startTime = Date.now();
        this.uniforms = {
            time: { value: 0.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            mouse: { value: new THREE.Vector2(0.5, 0.5) }
        };
        
        this.currentExample = 0;
        this.examples = this.createExamples();
        this.isControlsVisible = true;
        this.autoHideTimeout = null;
        
        this.setupEventListeners();
        this.loadExample(0);
        this.animate();
        this.startAutoHideTimer();
    }
    
    setupEventListeners() {
        document.querySelectorAll('.p-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => this.loadExample(index));
        });
        
        // Toggle button functionality
        document.getElementById('toggleBtn').addEventListener('click', () => {
            this.toggleControls();
        });
        
        // Show controls on mouse movement near left edge
        document.addEventListener('mousemove', (event) => {
            if (event.clientX < 50) {
                this.showControls();
                this.startAutoHideTimer();
            }
        });
        
        // Keep controls visible when hovering over them
        const controlsSection = document.getElementById('controls');
        controlsSection.addEventListener('mouseenter', () => {
            this.clearAutoHideTimer();
        });
        
        controlsSection.addEventListener('mouseleave', () => {
            this.startAutoHideTimer();
        });
        
        window.addEventListener('resize', () => {
            // Canvas is always fullscreen now
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        });
        
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = 1.0 - (event.clientY - rect.top) / rect.height;
            this.uniforms.mouse.value.set(x, y);
        });
    }
    
    showControls() {
        const controls = document.getElementById('controls');
        controls.classList.remove('hidden');
        this.isControlsVisible = true;
        // Canvas stays fullscreen
    }
    
    hideControls() {
        const controls = document.getElementById('controls');
        controls.classList.add('hidden');
        this.isControlsVisible = false;
        // Canvas stays fullscreen
    }
    
    toggleControls() {
        if (this.isControlsVisible) {
            this.hideControls();
            this.clearAutoHideTimer();
        } else {
            this.showControls();
            this.startAutoHideTimer();
        }
    }
    
    startAutoHideTimer() {
        this.clearAutoHideTimer();
        this.autoHideTimeout = setTimeout(() => {
            this.hideControls();
        }, 3000); // Hide after 3 seconds of inactivity
    }
    
    clearAutoHideTimer() {
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }
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
            },
            {
                name: "Ego Dissolution",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

// Fractal noise for consciousness dissolution
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float fbm(vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(st * frequency + time * 0.1);
        frequency *= 2.17;
        amplitude *= 0.47;
    }
    return value;
}

// Consciousness-altering color palette
vec3 egoColors(float t, float intensity) {
    // Colors that trigger ego dissolution experiences
    vec3 void_state = vec3(0.0, 0.0, 0.1);        // Deep void
    vec3 consciousness = vec3(0.8, 0.0, 0.9);     // Purple consciousness
    vec3 enlightenment = vec3(1.0, 1.0, 0.2);     // Golden light
    vec3 unity = vec3(0.0, 0.9, 0.8);             // Cyan unity
    vec3 transcendence = vec3(1.0, 0.4, 0.0);     // Orange transcendence
    
    float cycle = fract(t * 2.0 + time * 0.05) * intensity;
    
    if (cycle < 0.2) return mix(void_state, consciousness, cycle * 5.0);
    else if (cycle < 0.4) return mix(consciousness, enlightenment, (cycle - 0.2) * 5.0);
    else if (cycle < 0.6) return mix(enlightenment, unity, (cycle - 0.4) * 5.0);
    else if (cycle < 0.8) return mix(unity, transcendence, (cycle - 0.6) * 5.0);
    else return mix(transcendence, void_state, (cycle - 0.8) * 5.0);
}

void main() {
    vec2 uv = vUv - 0.5;
    
    // Breathing reality effect - induces dissociation
    float breath = sin(time * 0.3) * 0.2 + 1.0;
    uv *= breath;
    
    // Multiple reality layers dissolving into each other
    float layer1 = fbm(uv * 2.0, 6);
    float layer2 = fbm(uv * 4.0 + vec2(5.2, 1.3), 5);
    float layer3 = fbm(uv * 8.0 + vec2(23.15, 42.65), 4);
    
    // Ego dissolution pattern - self boundaries disappear
    float dissolution = sin(layer1 * 6.28 + time * 0.5) * 
                       cos(layer2 * 4.0 + time * 0.3) * 
                       sin(layer3 * 8.0 + time * 0.7);
    
    // Consciousness fragmentation
    vec2 fragUv = uv;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        fragUv = abs(fragUv) - 0.1 - sin(time * 0.1 + fi) * 0.05;
        fragUv *= 1.2 + sin(time * 0.07 + fi) * 0.1;
    }
    
    float fragmentation = sin(length(fragUv) * 20.0 - time * 2.0);
    
    float combined = (dissolution + fragmentation + layer1) / 3.0;
    
    // Mouse represents conscious intention dissolving into the void
    float mouseDist = length(uv - (mouse - 0.5) * 2.0);
    float consciousness_leak = exp(-mouseDist * 1.5) * sin(time * 4.0) * 0.8;
    combined += consciousness_leak;
    
    // Intensity builds toward complete ego death
    float intensity = 1.0 + sin(time * 0.2) * 0.5;
    
    // Colors that trigger altered consciousness
    vec3 color = egoColors(combined, intensity);
    
    // Reality fractures - sense of self breaks apart
    float fracture = step(0.95, noise(uv * 100.0 + time * 3.0));
    color += fracture * vec3(3.0, 3.0, 3.0);
    
    // Transcendental glow - experience of unity consciousness
    float transcendence = exp(-length(uv) * 0.8) * sin(time * 1.5);
    color += transcendence * egoColors(combined + 0.5, intensity) * 0.6;
    
    // Breathing light - mystical experience
    color *= 0.7 + 0.5 * sin(time * 0.8);
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            },
            {
                name: "Synaptic Chaos",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Neural network firing patterns
float neuralNoise(vec2 st, float t) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i + sin(t * 0.1));
    float b = random(i + vec2(1.0, 0.0) + sin(t * 0.13));
    float c = random(i + vec2(0.0, 1.0) + sin(t * 0.17));
    float d = random(i + vec2(1.0, 1.0) + sin(t * 0.19));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Psychedelic brain chemistry colors
vec3 synapticColors(float t, float chaos) {
    // Colors representing neurotransmitter floods
    vec3 dopamine = vec3(1.0, 0.3, 0.8);     // Pink dopamine rush
    vec3 serotonin = vec3(0.2, 0.9, 0.3);    // Green serotonin
    vec3 dmt = vec3(0.9, 0.1, 1.0);          // Purple DMT
    vec3 norepinephrine = vec3(1.0, 0.8, 0.0); // Yellow norepinephrine
    vec3 gaba = vec3(0.0, 0.6, 1.0);         // Blue GABA calm
    
    float neurotransmitter = fract(t * chaos + time * 0.1);
    
    if (neurotransmitter < 0.2) return mix(dopamine, serotonin, neurotransmitter * 5.0);
    else if (neurotransmitter < 0.4) return mix(serotonin, dmt, (neurotransmitter - 0.2) * 5.0);
    else if (neurotransmitter < 0.6) return mix(dmt, norepinephrine, (neurotransmitter - 0.4) * 5.0);
    else if (neurotransmitter < 0.8) return mix(norepinephrine, gaba, (neurotransmitter - 0.6) * 5.0);
    else return mix(gaba, dopamine, (neurotransmitter - 0.8) * 5.0);
}

void main() {
    vec2 uv = vUv;
    
    // Chaotic neural firing patterns
    float chaos_level = 2.0 + sin(time * 0.1) * 1.5;
    
    // Multiple overlapping neural networks
    float network1 = neuralNoise(uv * 8.0, time * 2.0);
    float network2 = neuralNoise(uv * 16.0 + vec2(10.0), time * 1.5);
    float network3 = neuralNoise(uv * 32.0 + vec2(20.0), time * 3.0);
    
    // Synaptic storms - rapid firing
    float storm1 = sin(uv.x * 40.0 + time * 8.0) * cos(uv.y * 30.0 + time * 6.0);
    float storm2 = cos(uv.x * 25.0 - time * 7.0) * sin(uv.y * 35.0 - time * 9.0);
    
    // Electrical discharges across synapses
    float discharge1 = step(0.8, sin(network1 * 20.0 + time * 10.0));
    float discharge2 = step(0.85, cos(network2 * 15.0 + time * 12.0));
    
    float neural_activity = (network1 + network2 + network3) / 3.0;
    neural_activity += (storm1 + storm2) * 0.3;
    neural_activity += (discharge1 + discharge2) * 0.5;
    
    // Mouse represents external stimuli overwhelming the nervous system
    float mouseDist = length(uv - mouse);
    float overstimulation = exp(-mouseDist * 3.0) * sin(time * 15.0) * chaos_level;
    neural_activity += overstimulation * 0.4;
    
    // Chaotic neurotransmitter floods
    vec3 color = synapticColors(neural_activity, chaos_level);
    
    // Electrical arcing between neurons
    float arc1 = exp(-abs(sin(uv.x * 20.0 + time * 5.0) - uv.y) * 30.0);
    float arc2 = exp(-abs(cos(uv.y * 15.0 + time * 4.0) - uv.x) * 25.0);
    
    color += (arc1 + arc2) * synapticColors(neural_activity + 0.3, chaos_level) * 0.6;
    
    // Action potential spikes
    float spike = step(0.9, neuralNoise(uv * 50.0, time * 5.0));
    color += spike * vec3(2.0, 2.0, 1.5);
    
    // Synaptic chaos intensity modulation
    float intensity = 0.8 + 0.6 * sin(time * 3.0) * sin(time * 1.7);
    color *= intensity;
    
    // Rapid neurotransmitter cycling
    float cycling = sin(time * 20.0) * 0.02;
    color.r += cycling;
    color.g -= cycling * 0.5;
    color.b += cycling * 0.7;
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            },
            {
                name: "The Lurking Fear",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Disturbing noise that never settles
float unsettlingNoise(vec2 st, float t) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Constantly shifting, never predictable
    float a = noise(i + sin(t * 0.7) * 10.0);
    float b = noise(i + vec2(1.0, 0.0) + cos(t * 0.83) * 10.0);
    float c = noise(i + vec2(0.0, 1.0) + sin(t * 1.1) * 10.0);
    float d = noise(i + vec2(1.0, 1.0) + cos(t * 1.3) * 10.0);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Horror color palette that triggers primal fear
vec3 fearColors(float t, float dread) {
    // Colors associated with fear, death, and the unknown
    vec3 void_black = vec3(0.02, 0.0, 0.05);      // Almost black void
    vec3 blood_red = vec3(0.6, 0.05, 0.1);        // Dried blood
    vec3 sickly_green = vec3(0.1, 0.3, 0.08);     // Decay green
    vec3 bone_white = vec3(0.9, 0.85, 0.8);       // Bone white
    vec3 bruise_purple = vec3(0.2, 0.1, 0.4);     // Bruise purple
    
    float fear_cycle = fract(t * dread + time * 0.03);
    
    if (fear_cycle < 0.2) return mix(void_black, blood_red, fear_cycle * 5.0);
    else if (fear_cycle < 0.4) return mix(blood_red, sickly_green, (fear_cycle - 0.2) * 5.0);
    else if (fear_cycle < 0.6) return mix(sickly_green, bone_white, (fear_cycle - 0.4) * 5.0);
    else if (fear_cycle < 0.8) return mix(bone_white, bruise_purple, (fear_cycle - 0.6) * 5.0);
    else return mix(bruise_purple, void_black, (fear_cycle - 0.8) * 5.0);
}

void main() {
    vec2 uv = vUv;
    
    // Creeping dread builds over time
    float dread_level = 1.0 + sin(time * 0.05) * 0.5 + time * 0.01;
    
    // Something moving in the shadows
    float shadow1 = unsettlingNoise(uv * 3.0, time * 0.3);
    float shadow2 = unsettlingNoise(uv * 6.0 + vec2(13.7, 9.1), time * 0.2);
    float shadow3 = unsettlingNoise(uv * 12.0 + vec2(27.3, 18.9), time * 0.5);
    
    // Presence watching you - creates paranoia
    vec2 eye_position1 = vec2(0.3 + sin(time * 0.1) * 0.1, 0.7 + cos(time * 0.13) * 0.1);
    vec2 eye_position2 = vec2(0.7 + sin(time * 0.17) * 0.1, 0.3 + cos(time * 0.11) * 0.1);
    
    float eye1 = exp(-length(uv - eye_position1) * 20.0) * (0.5 + 0.5 * sin(time * 2.0));
    float eye2 = exp(-length(uv - eye_position2) * 25.0) * (0.5 + 0.5 * sin(time * 2.3 + 3.14));
    
    // Crawling, writhing motion - like insects or tentacles
    float crawl1 = sin(uv.x * 30.0 + time * 1.5 + shadow1 * 10.0);
    float crawl2 = cos(uv.y * 25.0 + time * 1.2 + shadow2 * 8.0);
    
    // Things moving just out of sight
    float peripheral1 = step(0.95, unsettlingNoise(uv * 50.0, time * 3.0));
    float peripheral2 = step(0.97, unsettlingNoise(uv * 70.0 + vec2(50.0), time * 2.5));
    
    float lurking_presence = (shadow1 + shadow2 + shadow3) / 3.0;
    lurking_presence += (eye1 + eye2) * 2.0;
    lurking_presence += (crawl1 + crawl2) * 0.2;
    lurking_presence += (peripheral1 + peripheral2) * 0.5;
    
    // Mouse movement attracts the lurking horror
    float mouseDist = length(uv - mouse);
    float attraction = exp(-mouseDist * 2.0) * sin(time * 6.0) * dread_level;
    lurking_presence += attraction * 0.6;
    
    // Fear response colors
    vec3 color = fearColors(lurking_presence, dread_level);
    
    // Sudden flashes of terror
    float terror_flash = step(0.99, unsettlingNoise(vec2(time * 10.0), time));
    color += terror_flash * vec3(1.0, 0.8, 0.8) * 2.0;
    
    // Breathing darkness - claustrophobic effect
    float claustrophobia = 0.3 + 0.4 * sin(time * 0.7);
    color *= claustrophobia;
    
    // Something approaching from the edges
    float edge_distance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float approaching = exp(-edge_distance * 3.0) * sin(time * 1.0);
    color += approaching * fearColors(lurking_presence + 0.5, dread_level) * 0.3;
    
    // Paranoia flicker - makes you feel watched
    float paranoia = 0.9 + 0.2 * sin(time * 13.0) * sin(time * 7.0);
    color *= paranoia;
    
    // Desaturation toward terror
    float terror_desaturation = sin(time * 0.2) * 0.1;
    color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), terror_desaturation);
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            },
            {
                name: "Nightmare Flesh",
                vertexShader: vertexShader,
                fragmentShader: `
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec2 vUv;

float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Disturbing organic noise
float organicNoise(vec2 st, float t) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Pulsing, breathing randomness
    float a = noise(i + sin(t * 0.3) * 5.0);
    float b = noise(i + vec2(1.0, 0.0) + cos(t * 0.4) * 5.0);
    float c = noise(i + vec2(0.0, 1.0) + sin(t * 0.5) * 5.0);
    float d = noise(i + vec2(1.0, 1.0) + cos(t * 0.6) * 5.0);
    
    // Smooth interpolation with organic curves
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal flesh-like noise
float fleshNoise(vec2 st, float t) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * organicNoise(st * frequency, t + float(i) * 0.1);
        frequency *= 2.1;
        amplitude *= 0.45;
    }
    return value;
}

// Grotesque flesh colors that trigger disgust
vec3 fleshColors(float t, float corruption) {
    // Colors of decay, infection, and living flesh
    vec3 pale_flesh = vec3(0.8, 0.6, 0.5);        // Pale skin
    vec3 raw_meat = vec3(0.7, 0.2, 0.2);          // Raw flesh
    vec3 infected_yellow = vec3(0.6, 0.6, 0.1);   // Infection
    vec3 bruised_purple = vec3(0.4, 0.2, 0.4);    // Bruised flesh
    vec3 gangrene_black = vec3(0.1, 0.1, 0.05);   // Necrotic tissue
    vec3 blood_red = vec3(0.8, 0.1, 0.1);         // Fresh blood
    
    float flesh_cycle = fract(t * corruption + time * 0.02);
    
    if (flesh_cycle < 0.16) return mix(pale_flesh, raw_meat, flesh_cycle * 6.0);
    else if (flesh_cycle < 0.33) return mix(raw_meat, infected_yellow, (flesh_cycle - 0.16) * 6.0);
    else if (flesh_cycle < 0.5) return mix(infected_yellow, bruised_purple, (flesh_cycle - 0.33) * 6.0);
    else if (flesh_cycle < 0.66) return mix(bruised_purple, gangrene_black, (flesh_cycle - 0.5) * 6.0);
    else if (flesh_cycle < 0.83) return mix(gangrene_black, blood_red, (flesh_cycle - 0.66) * 6.0);
    else return mix(blood_red, pale_flesh, (flesh_cycle - 0.83) * 6.0);
}

void main() {
    vec2 uv = vUv;
    
    // Corruption level increases over time
    float corruption_level = 1.5 + sin(time * 0.03) * 0.8 + time * 0.005;
    
    // Flesh-like base texture
    float flesh_base = fleshNoise(uv * 4.0, time * 0.2);
    float flesh_detail = fleshNoise(uv * 12.0, time * 0.15);
    float flesh_fine = fleshNoise(uv * 32.0, time * 0.1);
    
    // Pulsing like a heartbeat
    float heartbeat = sin(time * 4.0) * 0.3 + 0.7;
    flesh_base *= heartbeat;
    
    // Veins and arteries
    float vein1 = abs(sin(uv.x * 20.0 + time * 0.5 + flesh_base * 5.0) - uv.y * 2.0 + 1.0);
    float vein2 = abs(cos(uv.y * 15.0 + time * 0.4 + flesh_detail * 4.0) - uv.x * 1.5 + 0.5);
    
    float veins = exp(-vein1 * 15.0) + exp(-vein2 * 20.0);
    
    // Tumorous growths
    float tumor1 = exp(-length(uv - vec2(0.3 + sin(time * 0.1) * 0.1, 0.7)) * 8.0);
    float tumor2 = exp(-length(uv - vec2(0.8, 0.2 + cos(time * 0.13) * 0.1)) * 12.0);
    float tumor3 = exp(-length(uv - vec2(0.1, 0.4 + sin(time * 0.07) * 0.08)) * 10.0);
    
    float tumors = (tumor1 + tumor2 + tumor3) * sin(time * 2.0);
    
    // Wounds and lacerations
    float wound1 = step(0.95, organicNoise(uv * 30.0, time * 1.0));
    float wound2 = step(0.97, organicNoise(uv * 25.0 + vec2(10.0), time * 0.8));
    
    // Maggots and parasites moving
    float parasite1 = sin(uv.x * 60.0 + time * 3.0 + flesh_base * 20.0);
    float parasite2 = cos(uv.y * 50.0 + time * 2.5 + flesh_detail * 15.0);
    float parasites = step(0.9, parasite1) + step(0.92, parasite2);
    
    float combined_flesh = flesh_base + flesh_detail * 0.5 + flesh_fine * 0.3;
    combined_flesh += veins * 0.8;
    combined_flesh += tumors * 0.6;
    combined_flesh += (wound1 + wound2) * 0.4;
    combined_flesh += parasites * 0.3;
    
    // Mouse creates infection spread
    float mouseDist = length(uv - mouse);
    float infection = exp(-mouseDist * 3.0) * sin(time * 8.0) * corruption_level;
    combined_flesh += infection * 0.7;
    
    // Disgust-inducing flesh colors
    vec3 color = fleshColors(combined_flesh, corruption_level);
    
    // Bleeding effect
    float bleeding = veins * sin(time * 6.0) * 0.5;
    color += bleeding * vec3(0.8, 0.1, 0.1);
    
    // Infection glow
    float infection_glow = tumors * sin(time * 3.0) * 0.3;
    color += infection_glow * vec3(0.6, 0.6, 0.0);
    
    // Necrosis spreading
    float necrosis = step(0.8, combined_flesh) * sin(time * 1.0);
    color = mix(color, vec3(0.05, 0.05, 0.02), necrosis * 0.6);
    
    // Organic breathing effect
    float breathing = 0.6 + 0.4 * sin(time * 1.5);
    color *= breathing;
    
    // Sickly desaturation
    float sickness = sin(time * 0.3) * 0.2;
    color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), sickness);
    
    // Random spasms and twitches
    float spasm = step(0.98, organicNoise(vec2(time * 15.0), time));
    color += spasm * vec3(1.5, 0.5, 0.5);
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`.trim()
            }
        ];
    }
    
    loadExample(index) {
        this.currentExample = index;
        const example = this.examples[index];
        
        document.querySelectorAll('.p-btn').forEach((btn, i) => {
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
