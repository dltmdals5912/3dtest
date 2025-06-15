/* ───────────────────────── main.js ─────────────────────────
 * Three.js r155 + GSAP + Vite
 * ▶ 스크롤 기반 인터랙티브 포트폴리오 (모듈화 최종본)
 * ──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

import { setupBackground, animateBackground } from './modules/setupBackground.js';
import { setupProfile, layoutProfile } from './modules/setupProfile.js';
import { setupProjects } from './modules/setupProjects.js';
import { setupFinale, animateFinale } from './modules/setupFinale.js';
import { setupPlanet, animatePlanet, checkPlanetInteraction } from './modules/setupPlanet.js';
import { setupBigBang, animateBigBang } from './modules/setupBigBang.js';
import { createTimeline } from './modules/setupTimeline.js';

gsap.registerPlugin(ScrollTrigger);

/* ────────────────── 기본 설정 ────────────────── */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 3000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app'),
  alpha: true,
  antialias: true
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

/* ────────────────── 포스트 프로세싱 ────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.85);
composer.addPass(bloomPass);
const glitchPass = new GlitchPass();
glitchPass.enabled = false;
composer.addPass(glitchPass);

/* ────────────────── 입력 / 리사이즈 ────────────────── */
const mousePos = new THREE.Vector2(10000, 10000);
addEventListener('mousemove', e => {
  mousePos.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
addEventListener('mouseout', () => {
  mousePos.set(10000, 10000);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ────────────────── 모듈별 객체 생성 ────────────────── */
const backgroundElements = setupBackground(scene);
const profileElements = setupProfile(scene, renderer);
const projectsElements = setupProjects(scene, renderer);
const finaleElements = setupFinale(scene);
const planetElements = setupPlanet(scene, renderer, camera);
const bigBangElements = setupBigBang(scene);

const allTextNodes = [
  ...profileElements.profileNodes,
  ...projectsElements.projectGroups.flatMap(p => p.userData.txtNodes), // .projects -> .projectGroups
  planetElements.reactNativeText
];
// 프로필 레이아웃이 먼저 계산되어야 타임라인 생성 가능
profileElements.pSlogan.sync(() => {
  layoutProfile(profileElements);

  createTimeline({
    camera,
    bloomPass,
    glitchPass,
    scrollContainer: document.querySelector('#scroll-container'),
    initialScreen: document.querySelector('#initial-screen'),
    ...backgroundElements,
    ...profileElements,
    ...projectsElements,
    ...finaleElements,
    ...planetElements,
    ...bigBangElements,
    allTextNodes
  });

  ScrollTrigger.refresh();
});

/* ────────────────── 렌더링 루프 ────────────────── */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const timeline = ScrollTrigger.getById('mainTimeline')?.animation;

  animateBackground(backgroundElements, t);
  if (finaleElements.finaleGrp.visible) {
    animateFinale(finaleElements, t, mousePos, camera);
  }
  if (planetElements.planetGrp.visible) {
    const isTimelineActive = timeline && timeline.isActive();
    checkPlanetInteraction(planetElements, mousePos, camera);
    animatePlanet(planetElements, t, camera, isTimelineActive);
  }
  if (bigBangElements.bigBangGrp.visible) {
    animateBigBang(bigBangElements, mousePos);
  }

  composer.render();
}

animate();
