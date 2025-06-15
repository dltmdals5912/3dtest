export const vShader = /*glsl*/`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const fShader = /*glsl*/`
uniform sampler2D u_texture;
uniform float u_radius;
uniform float u_brightness_clamp;
uniform float u_opacity;
varying vec2 vUv;
float rSDF(vec2 p, vec2 b, float r) {
  return length(max(abs(p) - b, 0.0)) - r;
}
void main() {
  vec4 c = texture2D(u_texture, vUv);
  c.rgb = min(c.rgb, vec3(u_brightness_clamp));
  vec2 h = vec2(0.5);
  float d = rSDF(vUv - h, h - u_radius, u_radius);
  float a = 1.0 - smoothstep(0.0, 0.005, d);
  gl_FragColor = vec4(c.rgb, c.a * a * u_opacity);
}`;
