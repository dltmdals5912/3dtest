import * as THREE from 'three';
import { vBangShader, fBangShader } from '../shaders/bangShader.js';

export function setupBigBang(scene) {
  const bigBangGrp = new THREE.Group();
  scene.add(bigBangGrp);
  bigBangGrp.visible = false;

  const BANG_CNT = 150000; // 파티클 개수 감소
  const bangPoints = new Float32Array(BANG_CNT * 3);
  const bangColors = new Float32Array(BANG_CNT * 3);
  const colorChoices = [new THREE.Color(0xff8888), new THREE.Color(0x88ff88), new THREE.Color(0x8888ff), new THREE.Color(0xffff88), new THREE.Color(0x88ffff), new THREE.Color(0xff88ff)];

  for (let i = 0; i < BANG_CNT; i++) {
    const armIndex = i % 4;
    const dist = Math.random() * 120 + 15; // 은하 크기 감소
    const angle = (dist / 135) * 10 + (armIndex * Math.PI / 2);
    const randomZ = (Math.random() - 0.5) * 20;
    const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 8;
    const y = Math.sin(angle) * dist * 0.7 + (Math.random() - 0.5) * 8;
    const z = randomZ;
    bangPoints.set([x, y, z], i * 3);
    const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
    bangColors.set([color.r, color.g, color.b], i * 3);
  }

  const bangGeom = new THREE.BufferGeometry();
  bangGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BANG_CNT * 3), 3));
  bangGeom.setAttribute('finalPosition', new THREE.BufferAttribute(bangPoints, 3));
  bangGeom.setAttribute('color', new THREE.BufferAttribute(bangColors, 3));

  const bangMat = new THREE.ShaderMaterial({
    uniforms: {
      u_progress: { value: 0.0 },
      u_opacity: { value: 0.0 },
      u_size: { value: 0.35 }
    },
    vertexShader: vBangShader,
    fragmentShader: fBangShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  });

  const bigBangSystem = new THREE.Points(bangGeom, bangMat);
  bigBangGrp.add(bigBangSystem);

  return { bigBangGrp, bangMat, bigBangSystem };
}

const targetRotation = new THREE.Euler(0, 0, 0);
export function animateBigBang(elements, mousePos) {
  const { bigBangGrp } = elements;
  if (!bigBangGrp.visible) return;

  targetRotation.y = -mousePos.x * 0.1;
  targetRotation.x = -mousePos.y * 0.1;

  bigBangGrp.rotation.x += (targetRotation.x - bigBangGrp.rotation.x) * 0.05;
  bigBangGrp.rotation.y += (targetRotation.y - bigBangGrp.rotation.y) * 0.05;
}
