# GLSL Playground

A modern web-based environment for writing, compiling, and running GLSL shaders using Three.js.

## Features

- **Live Shader Editor**: Write vertex and fragment shaders with syntax highlighting
- **Real-time Compilation**: Compile and run shaders instantly
- **Interactive Uniforms**: Built-in time, resolution, and mouse position uniforms
- **Error Display**: Clear error messages for debugging
- **Responsive Design**: Split-panel layout with editor and preview

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the local server address (usually `http://localhost:5173`)

## Usage

### Writing Shaders

The playground provides two editor panels:

- **Vertex Shader**: Processes vertex data
- **Fragment Shader**: Determines pixel colors

### Built-in Uniforms

The following uniforms are automatically available in your shaders:

- `uniform float time` - Elapsed time in seconds
- `uniform vec2 resolution` - Canvas resolution in pixels
- `uniform vec2 mouse` - Mouse position (0.0 to 1.0)

### Keyboard Shortcuts

- `Ctrl/Cmd + Enter` - Compile and run shaders

### Example Shaders

#### Simple Color Animation
```glsl
// Fragment Shader
uniform float time;
varying vec2 vUv;

void main() {
    vec3 color = vec3(
        sin(time) * 0.5 + 0.5,
        cos(time * 1.5) * 0.5 + 0.5,
        sin(time * 2.0) * 0.5 + 0.5
    );
    gl_FragColor = vec4(color, 1.0);
}
```

#### Interactive Mouse Effect
```glsl
// Fragment Shader
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 vUv;

void main() {
    float dist = distance(vUv, mouse);
    vec3 color = vec3(1.0 - dist);
    gl_FragColor = vec4(color, 1.0);
}
```

## Project Structure

```
glsl/
├── index.html          # Main HTML file
├── main.js             # Three.js setup and shader compilation
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Dependencies

- **Three.js**: 3D graphics library for WebGL
- **Vite**: Fast development server and build tool

## Tips

1. Use `vUv` varying to get UV coordinates (0.0 to 1.0)
2. The `time` uniform is perfect for animations
3. Use `mouse` uniform for interactive effects
4. Check the browser console for detailed error messages
5. Start with simple shaders and gradually add complexity

## Common GLSL Functions

- `sin()`, `cos()`, `tan()` - Trigonometric functions
- `length()`, `distance()` - Vector operations
- `mix()` - Linear interpolation
- `smoothstep()` - Smooth transitions
- `fract()` - Fractional part
- `abs()` - Absolute value
- `clamp()` - Constrain values to range

Happy shader coding! 🎨
