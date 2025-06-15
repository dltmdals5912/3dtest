export const vParticleShader = /*glsl*/`
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_force_strength;
varying float v_d;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  v_d = distance(mv.xy, u_mouse);
  float push = smoothstep(20.0, 0.0, v_d) * u_force_strength;
  mv.xyz += normalize(mv.xyz - vec3(u_mouse, mv.z)) * push;
  mv.x += sin(u_time * 0.2 + position.y * 0.5) * 0.3;
  mv.y += cos(u_time * 0.2 + position.x * 0.5) * 0.3;
  gl_PointSize = (100.0 / -mv.z) * 0.3;
  gl_Position = projectionMatrix * mv;
}`;

export const fParticleShader = /*glsl*/`
uniform float u_opacity;
varying float v_d;
void main() {
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  float g = smoothstep(5.0, 0.0, v_d);
  vec3 col = vec3(0.6, 0.7, 1.0) * (s + g);
  gl_FragColor = vec4(col, s * u_opacity);
}`;
