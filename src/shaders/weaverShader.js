// src/shaders/weaverShader.js

export const vWeaverShader = /*glsl*/`
  attribute vec3 startPosition;
  attribute vec3 finalPosition;
  
  uniform float u_progress;
  
  varying vec3 v_color;

  void main() {
    vec3 p = mix(startPosition, finalPosition, u_progress);

    vec3 travelDir = normalize(finalPosition - startPosition);
    vec3 sideVector = normalize(cross(travelDir, vec3(0.0, 1.0, 0.0)));
    float curve = sin(u_progress * 3.14159) * 5.0;
    p += sideVector * curve;
    
    v_color = vec3(u_progress, finalPosition.y * 0.1 + 0.4, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (150.0 / -mvPosition.z) * (1.0 - u_progress * 0.5);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fWeaverShader = /*glsl*/`
  uniform float u_opacity;
  varying vec3 v_color;

  void main() {
    float alpha = 1.0 - distance(gl_PointCoord, vec2(0.5));
    alpha = smoothstep(0.0, 0.5, alpha);
    
    vec3 finalColor = v_color * vec3(1.2, 1.1, 0.8);

    gl_FragColor = vec4(finalColor, alpha * u_opacity);
  }
`;