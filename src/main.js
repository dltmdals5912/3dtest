// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector('#app');
const scene  = new THREE.Scene();
const cam    = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
cam.position.z = 2.8;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setClearColor(0x111111, 1);
function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  renderer.setSize(width, height, false);
  cam.aspect = width / height;
  cam.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

/* 파티클 구 */
const CNT = 10000, R = 1.2;
const buf = new Float32Array(CNT * 3);
for (let i = 0; i < CNT; i++) {
  const u = Math.random(), v = Math.random();
  const θ = 2 * Math.PI * u, φ = Math.acos(2 * v - 1);
  buf.set([
    R * Math.sin(φ) * Math.cos(θ),
    R * Math.sin(φ) * Math.sin(θ),
    R * Math.cos(φ)
  ], i * 3);
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(buf, 3));
const mat = new THREE.PointsMaterial({
  size: 0.03,
  color: 0x00c8ff,
  blending: THREE.AdditiveBlending
});
const sphere = new THREE.Points(geo, mat);
scene.add(sphere);

/* 링 */
const RN = 2500, ringBuf = new Float32Array(RN * 3);
for (let i = 0; i < RN; i++) {
  const a = 2 * Math.PI * i / RN, r = 2;
  ringBuf.set([
    r * Math.cos(a),
    (Math.random() - 0.5) * 0.05,
    r * Math.sin(a)
  ], i * 3);
}
const ringGeo = new THREE.BufferGeometry();
ringGeo.setAttribute('position', new THREE.BufferAttribute(ringBuf, 3));
const ringMat = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xff9866,
  transparent: true,
  opacity: 0.75,
  depthWrite: false
});
const ring = new THREE.Points(ringGeo, ringMat);
ring.rotation.x = Math.PI / 3;
scene.add(ring);

/* 컨트롤 & 루프 */
const ctrl = new OrbitControls(cam, renderer.domElement);
ctrl.enablePan = false;
ctrl.enableZoom = false;
ctrl.autoRotate = true;
ctrl.autoRotateSpeed = 0.6;

function animate() {
  requestAnimationFrame(animate);
  sphere.rotation.y += 0.0025;
  ring.rotation.y   += 0.0018;
  ctrl.update();
  renderer.render(scene, cam);
}
animate();
