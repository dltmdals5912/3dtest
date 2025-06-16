import { gsap } from 'gsap'; // ✨ 이 줄을 추가하세요.
import * as THREE from 'three';
// ✨ 셰이더 임포트 경로는 weaverShader.js로 변경해야 합니다. (다음 단계에서 생성)
import { vWeaverShader, fWeaverShader } from '../shaders/weaverShader.js';

// 함수 이름은 main.js와 호환되도록 그대로 둡니다.
export function setupBigBang(scene) {
  const PARTICLE_COUNT = 50000;
  
  // 1. 최종 도착 지점(TorusKnot) 모양 정의
  const finalGeom = new THREE.TorusKnotGeometry(10, 3, 128, 20);
  const finalPositions = finalGeom.attributes.position.array;

  // 2. 파티클들의 시작 지점 정의 (거대한 구 형태)
  const startPositions = new Float32Array(PARTICLE_COUNT * 3);
  const radius = 100;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = Math.random() * radius + 40;
    const phi = Math.random() * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    startPositions.set([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ], i * 3);
  }

  // 3. 파티클 지오메트리 생성
  const particlesGeom = new THREE.BufferGeometry();
  particlesGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3));
  particlesGeom.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3));
  
  const weaverFinalPositions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const index = (i * 3) % finalPositions.length;
    weaverFinalPositions.set([finalPositions[index], finalPositions[index+1], finalPositions[index+2]], i * 3);
  }
  particlesGeom.setAttribute('finalPosition', new THREE.BufferAttribute(weaverFinalPositions, 3));
  
  // 4. 셰이더 머티리얼 생성
  const weaverMat = new THREE.ShaderMaterial({
    uniforms: {
      u_progress: { value: 0.0 },
      u_opacity: { value: 0.0 },
      u_time: { value: 0.0 },
    },
    vertexShader: vWeaverShader,
    fragmentShader: fWeaverShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const weaverSystem = new THREE.Points(particlesGeom, weaverMat);
  
  const bigBangGrp = new THREE.Group();
  bigBangGrp.add(weaverSystem);
  bigBangGrp.visible = false;
  scene.add(bigBangGrp);

  return { bigBangGrp, bangMat: weaverMat };
}

export function animateBigBang(elements, mousePos) {
  const { bigBangGrp } = elements;
  if (!bigBangGrp.visible) return;

  gsap.to(bigBangGrp.rotation, {
    x: -mousePos.y * 0.1,
    y: -mousePos.x * 0.1,
    duration: 1.5,
    ease: 'power2.out'
  });
}