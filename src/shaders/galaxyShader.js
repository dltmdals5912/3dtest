export const vGalaxyShader = /*glsl*/`
uniform float u_time;
uniform float u_progress;
varying vec3 v_col;
void main() {
  vec3 p = mix(vec3(0.0), position, u_progress);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = length(mv.xy * 0.1);
  float a = atan(mv.y, mv.x);
  float sp = sin(d * 5.0 - a * 2.0 + u_time * 0.1);
  mv.z += sp * 2.0;
  v_col = mix(vec3(0.1, 0.2, 0.5), vec3(0.8, 0.3, 0.6), smoothstep(-0.5, 0.5, sp));
  gl_PointSize = (100.0 / -mv.z) * 0.25;
  gl_Position = projectionMatrix * mv;
}`;

export const fGalaxyShader = /*glsl*/`
varying vec3 v_col;
void main() {
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  gl_FragColor = vec4(v_col, s);
}`;
