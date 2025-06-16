// src/modules/setupGalaxyField.js

import * as THREE from 'three';

export function setupGalaxyField(scene) {
  const GALAXY_COUNT = 20000; // 점처럼 보일 은하의 개수
  const positions = new Float32Array(GALAXY_COUNT * 3);
  const colors = new Float32Array(GALAXY_COUNT * 3);

  const radius = 1500; // 매우 넓은 반경

  for (let i = 0; i < GALAXY_COUNT; i++) {
    const i3 = i * 3;
    
    // 구 형태의 공간에 무작위로 배치
    const r = Math.random() * radius;
    const phi = Math.random() * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);

    // 은은한 색상 부여
    const color = new THREE.Color();
    color.setHSL(Math.random() * 0.2 + 0.55, 0.8, 0.7); // 푸른색~보라색 계열
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 5,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0, // 처음엔 보이지 않음
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    depthWrite: false,
  });

  const galaxyField = new THREE.Points(geometry, material);
  galaxyField.visible = false;
  scene.add(galaxyField);

  return { galaxyField };
}