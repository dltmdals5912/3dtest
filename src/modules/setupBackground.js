// 📁 src/modules/setupBackground.js

import * as THREE from 'three';
import { gsap } from 'gsap';

const texLoader = new THREE.TextureLoader();
const loadTex = (u) => texLoader.load(u);

/**
 * 별(star) 필드 생성
 */
function createStars(N, size, dist) {
  const v = [];
  for (let i = 0; i < N; i++) {
    v.push(
      (Math.random() - 0.5) * dist,
      (Math.random() - 0.5) * dist,
      (Math.random() - 0.5) * dist
    );
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size,
      transparent: true,
      opacity: 0.7
    })
  );
}

/**
 * 단일 spark 포인트 생성
 */
function createSpark() {
  return new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0], 3)
    ),
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    })
  );
}

/**
 * 반짝이는 twinkle 효과를 위한 Plane 그룹 생성
 */
function createTwinkles() {
  const twinkleGrp = new THREE.Group();
  const twinkleTex = loadTex(
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png'
  );

  for (let i = 0; i < 150; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: twinkleTex,
      color: 0xffffff,
      transparent: true,
      opacity: Math.random() * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);

    const R = 300;
    const r = R * Math.sqrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    mesh.position.set(r * Math.cos(th), r * Math.sin(th), (Math.random() - 0.5) * R);
    mesh.isTwinkling = false;

    twinkleGrp.add(mesh);
  }

  return twinkleGrp;
}

/**
 * shooting star 포인트 생성
 */
function createShootingStar() {
  return new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0], 3)
    ),
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    })
  );
}

let shooting = false;
function fireStar(shootingStar) {
  if (shooting) return;
  shooting = true;

  const sx = Math.random() * 200 - 100;
  const ex = Math.random() * 200 - 100;
  const z  = Math.random() * -400 - 100;

  shootingStar.position.set(sx, 100, z);
  shootingStar.material.opacity = 1;

  gsap.to(shootingStar.position, {
    x: ex,
    y: -100,
    duration: Math.random() * 1.5 + 0.5,
    ease: 'power2.in',
    onComplete: () => {
      shootingStar.material.opacity = 0;
      shooting = false;
    }
  });
}

/**
 * 배경(Starfield + Spark + Twinkles + Shooting Star + BGM) 셋업
 */
export function setupBackground(scene, camera) {
  // ── 1) AudioListener & BGM 로드 ──
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const bgm = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    '/bgm.mp3',      // public/bgm.mp3 위치
    (buffer) => {
      bgm.setBuffer(buffer);
      bgm.setLoop(true);
      bgm.setVolume(0.5);
      bgm.play();
    },
    undefined,
    (err) => {
      console.error('BGM 로드 실패:', err);
    }
  );

  // ── 2) Starfield ──
  const starfield = createStars(1500, 1.5, 1500);
  scene.add(starfield);

  // ── 3) Spark ──
  const spark = createSpark();
  spark.position.set(0, 0, -300);
  scene.add(spark);

  // ── 4) Twinkles ──
  const twinkleGrp = createTwinkles();
  scene.add(twinkleGrp);

  // ── 5) Shooting Star ──
  const shootingStar = createShootingStar();
  scene.add(shootingStar);

  return { starfield, spark, twinkleGrp, shootingStar };
}

/**
 * 배경 애니메이션 (매 프레임마다 호출)
 */
export function animateBackground(elements, t) {
  const { twinkleGrp, shootingStar } = elements;

  // twinkle 애니메이션
  twinkleGrp.children.forEach((q) => {
    if (!q.isTwinkling && Math.random() > 0.998) {
      q.isTwinkling = true;
      const d = Math.random() * 0.5 + 0.5;

      gsap.to(q.scale, {
        x: 1.5,
        y: 1.5,
        duration: d,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        onComplete: () => {
          q.isTwinkling = false;
        }
      });

      gsap.to(q.material, {
        opacity: 0.8,
        duration: d,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      });
    }
  });

  // shooting star 트리거
  if (Math.random() < 0.003 && !shooting) {
    fireStar(shootingStar);
  }
}
