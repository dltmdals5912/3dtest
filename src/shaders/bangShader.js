export const vBangShader = /*glsl*/`
    attribute vec3 finalPosition;
    uniform float u_progress;
    uniform float u_size;
    varying vec3 v_color;

    void main() {
        v_color = color;
        vec3 p = mix(vec3(0.0), finalPosition, u_progress);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        // 파티클 크기 완화
        gl_PointSize = (250.0 / -mvPosition.z) * u_size * (1.0 - u_progress * 0.3);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

export const fBangShader = /*glsl*/`
    uniform float u_opacity;
    varying vec3 v_color;

    void main() {
        float alpha = 1.0 - distance(gl_PointCoord, vec2(0.5));
        alpha = smoothstep(0.0, 0.5, alpha);
        gl_FragColor = vec4(v_color, alpha * u_opacity);
    }
`;
