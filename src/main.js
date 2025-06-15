/* ───────────────────────── main.js ─────────────────────────
 Three.js r155 + GSAP + Vite
 ▶ 스크롤 기반 인터랙티브 포트폴리오 (최종 완성본)
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Text } from 'troika-three-text';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

/* ── 이미지 애셋 ─────────────────────────────────────────── */
import profileImg from '/src/assets/profile.png';
import projectAuraImg from '/src/assets/project-aura.png';
import projectOdysseyImg from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';
import cssIcon from '/src/assets/tech/css.png';
import htmlIcon from '/src/assets/tech/html.png';
import jsIcon from '/src/assets/tech/js.png';
import nodeIcon from '/src/assets/tech/node.png';
import reactIcon from '/src/assets/tech/react.png';
import threeIcon from '/src/assets/tech/three.png';

gsap.registerPlugin(ScrollTrigger);

let tl;

/* ── Scene / Camera / Renderer ─────────────────────────── */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 3000); // far 값을 늘려 폭발 후 은하가 잘 보이도록 함
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app'),
  alpha: true,
  antialias: true
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

/* ── Post-processing ───────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.85);
composer.addPass(bloomPass);
const glitchPass = new GlitchPass();
glitchPass.enabled = false;
composer.addPass(glitchPass);

/* ── 입력 / 리사이즈 ───────────────────────────────────── */
const mousePos = new THREE.Vector2(10000, 10000);
const targetMousePos = mousePos.clone();
const raycaster = new THREE.Raycaster();
let hoveredIcon = null;

addEventListener('mousemove', e => {
  targetMousePos.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});
addEventListener('mouseout', () => {
  targetMousePos.set(10000, 10000);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ── 헬퍼 ─────────────────────────────────────────────── */
const texLoader = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const loadTex = u => {
  const t = texLoader.load(u);
  t.anisotropy = maxAniso;
  return t;
};
const placeInFront = (obj, dist) => {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  obj.position.copy(camera.position).add(dir.multiplyScalar(dist));
};

/* ── GLSL 셰이더 ─────────────────────────────────────── */
const vShader = /*glsl*/ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fShader = /*glsl*/ `
uniform sampler2D u_texture;
uniform float u_radius;
uniform float u_brightness_clamp;
uniform float u_opacity;
varying vec2 vUv;
float rSDF(vec2 p, vec2 b, float r) {
  return length(max(abs(p) - b, 0.0)) - r;
}
void main() {
  vec4 c = texture2D(u_texture, vUv);
  c.rgb = min(c.rgb, vec3(u_brightness_clamp));
  vec2 h = vec2(0.5);
  float d = rSDF(vUv - h, h - u_radius, u_radius);
  float a = 1.0 - smoothstep(0.0, 0.005, d);
  gl_FragColor = vec4(c.rgb, c.a * a * u_opacity);
}`;

const vParticleShader = /*glsl*/ `
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

const fParticleShader = /*glsl*/ `
uniform float u_opacity;
varying float v_d;
void main() {
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  float g = smoothstep(5.0, 0.0, v_d);
  vec3 col = vec3(0.6, 0.7, 1.0) * (s + g);
  gl_FragColor = vec4(col, s * u_opacity);
}`;

const vGalaxyShader = /*glsl*/ `
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

const fGalaxyShader = /*glsl*/ `
varying vec3 v_col;
void main() {
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  gl_FragColor = vec4(v_col, s);
}`;

/* ── [추가] 빅뱅 효과를 위한 GLSL 셰이더 ──────────────── */
const vBangShader = /*glsl*/ `
    attribute vec3 startPosition;
    attribute vec3 color;
    uniform float u_progress;
    uniform float u_size;
    varying vec3 v_color;

    void main() {
        v_color = color;
        vec3 p = mix(startPosition, position, u_progress);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (300.0 / -mvPosition.z) * u_size * (1.0 - u_progress * 0.3);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fBangShader = /*glsl*/ `
    uniform float u_opacity;
    varying vec3 v_color;

    void main() {
        float alpha = 1.0 - distance(gl_PointCoord, vec2(0.5));
        alpha = smoothstep(0.0, 0.5, alpha);
        gl_FragColor = vec4(v_color, alpha * u_opacity);
    }
`;


/* ── Starfield / Spark / Twinkles / Shooting-star ───────── */
function stars(N, size, dist) {
  const v = [];
  for (let i = 0; i < N; i++) v.push((Math.random() - .5) * dist, (Math.random() - .5) * dist, (Math.random() - .5) * dist);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size,
    transparent: true,
    opacity: 0.7
  }));
}
scene.add(stars(1500, 1.5, 1500));

const spark = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  })
);
spark.position.set(0, 0, -300);
scene.add(spark);

const twinkleGrp = new THREE.Group();
scene.add(twinkleGrp);
const twinkleTex = loadTex('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
for (let i = 0; i < 150; i++) {
  const m = new THREE.MeshBasicMaterial({
    map: twinkleTex,
    color: 0xffffff,
    transparent: true,
    opacity: Math.random() * 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  const R = 300,
    r = R * Math.sqrt(Math.random()),
    th = Math.random() * Math.PI * 2;
  q.position.set(r * Math.cos(th), r * Math.sin(th), (Math.random() - .5) * R);
  q.isTwinkling = false;
  twinkleGrp.add(q);
}

let shooting = false;
const shootingStar = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  })
);
scene.add(shootingStar);

function fireStar() {
  if (shooting) return;
  shooting = true;
  const sx = Math.random() * 200 - 100,
    ex = Math.random() * 200 - 100,
    z = Math.random() * -400 - 100;
  shootingStar.position.set(sx, 100, z);
  shootingStar.material.opacity = 1;
  gsap.to(shootingStar.position, {
    x: ex,
    y: -100,
    duration: Math.random() * 1.5 + .5,
    ease: 'power2.in',
    onComplete: () => {
      shootingStar.material.opacity = 0;
      shooting = false;
    }
  });
}

/* ── Troika 텍스트 ────────────────────────────────────── */
const makeText = (str, size, color = 0xffffff) => {
  const t = new Text();
  t.text = str;
  t.fontSize = size;
  t.color = color;
  t.anchorX = 'left';
  t.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
  t.material.transparent = true;
  t.material.opacity = 0;
  t.sync();
  scene.add(t);
  return t;
};

/* HUD 텍스트 */
const coordTxt = makeText('[35.1796° N, 129.0756° E]', 1.5);
coordTxt.anchorX = 'center';
const idTxt = makeText('OBJECT LSM-2002', 2.5);
idTxt.anchorX = 'center';
const coreTxt = makeText('LOGIC | CREATIVITY | DIMENSION', 1.5);
coreTxt.anchorX = 'center';
const accessTxt = makeText('SYSTEM ACCESS: COMPLETE', 2);
accessTxt.anchorX = 'center';

/* 프로필 그룹 */
const profileGrp = new THREE.Group();
scene.add(profileGrp);
const mkShaderMat = img => new THREE.ShaderMaterial({
  uniforms: {
    u_texture: {
      value: loadTex(img)
    },
    u_radius: {
      value: .05
    },
    u_brightness_clamp: {
      value: .65
    },
    u_opacity: {
      value: 0
    }
  },
  vertexShader: vShader,
  fragmentShader: fShader,
  transparent: true
});
const profilePlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mkShaderMat(profileImg));
profilePlane.position.set(-26, -1.2, -10);
const vLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 7, -10), new THREE.Vector3(0, -7, -10)]),
  new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0
  })
);
vLine.position.set(-8, 0, -10);

const pTitle = makeText('Creative Developer 이승민', 1.8);
const pSlogan = makeText('복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.', 1, 0xcccccc);
pSlogan.lineHeight = 2.2;
const emailL = makeText('E-mail:', 0.9);
const emailV = makeText('rlaxodud5877@naver.com', 0.9, 0xcccccc);
const gitL = makeText('GitHub:', 0.9);
const gitV = makeText('github.com/dltmdals5912', 0.9, 0xcccccc);

const profileNodes = [pTitle, pSlogan, emailL, emailV, gitL, gitV];
const profileMats = profileNodes.map(n => n.material);
profileGrp.add(profilePlane, vLine, ...profileNodes);
profileGrp.visible = false;

function layoutProfile() {
  const sx = -1,
    gx = 6,
    gy = 1;
  let y = 3.2;
  pTitle.position.set(sx, y, -10);
  y -= 2.5;
  pSlogan.position.set(sx, y, -10);
  y -= pSlogan.geometry.boundingBox.max.y - pSlogan.geometry.boundingBox.min.y + 1;
  emailL.position.set(sx, y, -10);
  emailV.position.set(sx + gx, y, -10);
  y -= gy;
  gitL.position.set(sx, y, -10);
  gitV.position.set(sx + gx, y, -10);
}

/* 프로젝트 그룹 */
const projectsGrp = new THREE.Group();
scene.add(projectsGrp);
const projects = [{
  title: 'AURA: Generative Data Sculpture',
  role: 'Lead Developer & Creative Technologist',
  desc: '소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품...',
  tech: 'Three.js, GSAP, Socket.IO, Python, AWS',
  img: projectAuraImg
}, {
  title: 'Project: ODYSSEY',
  role: 'Lead 3D Developer & Narrative Designer',
  desc: '소행성 ‘2025-ODYSSEY’ 탐사 로버의 로그를 따라가는 3D 웹 스토리텔링...',
  tech: 'Three.js, Blender, GSAP, GLSL',
  img: projectOdysseyImg
}, {
  title: 'FlowField: Real-time Audio-Reactive Art',
  role: 'Sole Developer & Artist',
  desc: 'Web Audio API로 실시간 사운드를 분석해 유기적 비주얼을 만드는 미디어 아트...',
  tech: 'TypeScript, p5.js, Web Audio API, GLSL, Vite',
  img: projectFlowfieldImg
}];
projects.forEach((p, i) => {
  const g = new THREE.Group();
  g.visible = false;
  g.position.z = -100 * (i + 1);
  const thumb = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mkShaderMat(p.img));
  thumb.position.set(-18, 1, -12);
  g.userData.thumb = thumb;
  const tTitle = makeText(p.title, 2);
  tTitle.position.set(0, 6.5, -12);
  const tRole = makeText(p.role, 1, 0x00bfff);
  tRole.position.set(0, 4, -12);
  const tDesc = makeText(p.desc, 1, 0xcccccc);
  tDesc.maxWidth = 20;
  tDesc.lineHeight = 1.6;
  tDesc.position.set(0, 0.5, -12);
  const tLab = makeText('tech:', 1);
  const tTech = makeText(p.tech, 0.9, 0xcccccc);
  tTech.maxWidth = 20;
  tTech.lineHeight = 1.5;
  g.userData.txtNodes = [tTitle, tRole, tDesc, tLab, tTech];
  tDesc.sync(() => {
    const h = tDesc.geometry.boundingBox.max.y - tDesc.geometry.boundingBox.min.y;
    tLab.position.set(0, tDesc.position.y - h - 1.4, -12);
    tTech.position.set(0, tLab.position.y - 1.2, -12);
  });
  g.add(thumb, tTitle, tRole, tDesc, tLab, tTech);
  projectsGrp.add(g);
});

/* 최종 연출 텍스트 */
const reactNativeText = makeText('React Native', 2, 0x61dafb);
reactNativeText.anchorX = 'center';
reactNativeText.visible = false;

/* 텍스트 모음 */
const ALL_TEXT_NODES = [
  ...profileNodes,
  ...projectsGrp.children.flatMap(g => g.userData.txtNodes),
  reactNativeText
];

/* Finale: Force-field & Galaxy */
const finaleGrp = new THREE.Group();
finaleGrp.visible = false;
scene.add(finaleGrp);
const FF = 30000,
  ffArr = new Float32Array(FF * 3);
for (let i = 0; i < FF; i++) ffArr.set([(Math.random() - .5) * 100, (Math.random() - .5) * 100, (Math.random() - .5) * 100], i * 3);
const ffGeom = new THREE.BufferGeometry();
ffGeom.setAttribute('position', new THREE.BufferAttribute(ffArr, 3));
const ffMat = new THREE.ShaderMaterial({
  uniforms: {
    u_time: {
      value: 0
    },
    u_mouse: {
      value: new THREE.Vector2(10000, 10000)
    },
    u_force_strength: {
      value: 0
    },
    u_opacity: {
      value: 0
    }
  },
  vertexShader: vParticleShader,
  fragmentShader: fParticleShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
finaleGrp.add(new THREE.Points(ffGeom, ffMat));

const GAL = 250000,
  galArr = new Float32Array(GAL * 3);
for (let i = 0; i < GAL; i++) {
  const r = Math.random() * 60,
    a = Math.random() * Math.PI * 2,
    z = (Math.random() - .5) * 60;
  galArr.set([r * Math.cos(a), r * Math.sin(a) * 0.7, z], i * 3);
}
const galGeom = new THREE.BufferGeometry();
galGeom.setAttribute('position', new THREE.BufferAttribute(galArr, 3));
const galMat = new THREE.ShaderMaterial({
  uniforms: {
    u_time: {
      value: 0
    },
    u_mouse: {
      value: new THREE.Vector2()
    },
    u_progress: {
      value: 0
    }
  },
  vertexShader: vGalaxyShader,
  fragmentShader: fGalaxyShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const galaxy = new THREE.Points(galGeom, galMat);
galaxy.scale.set(0.8, 0.8, 0.8);
finaleGrp.add(galaxy);

/* ── [수정] Big Bang & New Universe ────────────────────────── */
const bigBangGrp = new THREE.Group();
scene.add(bigBangGrp);
bigBangGrp.visible = false;
const BANG_CNT = 400000;
const bangPoints = new Float32Array(BANG_CNT * 3);
const bangColors = new Float32Array(BANG_CNT * 3);
const colorChoices = [new THREE.Color(0xff8888), new THREE.Color(0x88ff88), new THREE.Color(0x8888ff), new THREE.Color(0xffff88), new THREE.Color(0x88ffff), new THREE.Color(0xff88ff)];

for (let i = 0; i < BANG_CNT; i++) {
  const armIndex = i % 4;
  const dist = Math.random() * 200 + 20;
  const angle = (dist / 220) * 10 + (armIndex * Math.PI / 2);
  const randomZ = (Math.random() - 0.5) * 25;
  const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 10;
  const y = Math.sin(angle) * dist * 0.7 + (Math.random() - 0.5) * 10; // 은하를 약간 타원형으로
  const z = randomZ;
  bangPoints.set([x, y, z], i * 3);
  const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
  bangColors.set([color.r, color.g, color.b], i * 3);
}

const bangGeom = new THREE.BufferGeometry();
// 최종 위치를 'finalPosition'이라는 이름의 attribute로 저장
bangGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BANG_CNT * 3), 3)); // 시작은 빈 버퍼
bangGeom.setAttribute('finalPosition', new THREE.BufferAttribute(bangPoints, 3));
bangGeom.setAttribute('color', new THREE.BufferAttribute(bangColors, 3));

// PointsMaterial 대신 ShaderMaterial 사용으로 변경
const bangMat = new THREE.ShaderMaterial({
  uniforms: {
    u_progress: { value: 0.0 },
    u_opacity: { value: 0.0 },
    u_size: { value: 0.4 }
  },
  vertexShader: /*glsl*/ `
        attribute vec3 finalPosition;
        uniform float u_progress;
        uniform float u_size;
        varying vec3 v_color;

        void main() {
            v_color = color; // Three.js가 제공하는 color 변수를 사용합니다.
            vec3 p = mix(vec3(0.0), finalPosition, u_progress);
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (400.0 / -mvPosition.z) * u_size * (1.0 - u_progress * 0.3);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
  fragmentShader: fBangShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexColors: true // 이 옵션이 켜져 있으므로 'color' 속성을 자동으로 받습니다.
});

const bigBangSystem = new THREE.Points(bangGeom, bangMat);
bigBangGrp.add(bigBangSystem);


/* ── Planet ───────────────────────────────────────────── */
const planetGrp = new THREE.Group();
planetGrp.visible = false;
scene.add(planetGrp);

const SPHERE_CNT = 6000,
  RADIUS = 8,
  pts = new Float32Array(SPHERE_CNT * 3);
for (let i = 0; i < SPHERE_CNT; i++) {
  const r = RADIUS * Math.cbrt(Math.random());
  const u = Math.random(),
    v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  pts.set([x, y, z], i * 3);
}
const particleSphereMat = new THREE.PointsMaterial({
  color: 0x4466ff,
  size: 0.22,
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const particleSphere = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pts, 3)),
  particleSphereMat
);
planetGrp.add(particleSphere);

const RING_COLOR = 0x66ccff;
const ringMats = [];
const makeParticleRing = (radius, particleCount) => {
  const points = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const z = 0;
    points.push(x, y, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.PointsMaterial({
    color: RING_COLOR,
    size: 0.15,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  ringMats.push(material);
  return new THREE.Points(geometry, material);
};
const makePivot = (ring, tx, ty) => {
  const g = new THREE.Group();
  g.rotation.set(tx, ty, 0);
  g.add(ring);
  planetGrp.add(g);
  return g;
};
const ring1 = makeParticleRing(10, 2000),
  ring2 = makeParticleRing(12.5, 2500),
  ring3 = makeParticleRing(15, 3000);
const pivot1 = makePivot(ring1, 0, 0);
const pivot2 = makePivot(ring2, THREE.MathUtils.degToRad(30), 0);
const pivot3 = makePivot(ring3, 0, THREE.MathUtils.degToRad(45));

const techSkillsGroup = new THREE.Group();
techSkillsGroup.position.set(-23, 0, 0);
planetGrp.add(techSkillsGroup);

const iconImgs = [reactIcon, threeIcon, jsIcon, cssIcon, nodeIcon, htmlIcon];
const techNames = ['React', 'Three.js', 'JavaScript', 'CSS', 'Node.js', 'HTML'];
const skills = [90, 80, 76, 70, 60, 50];
const vSpacing = 5;
const iconMats = [],
  gaugeMats = [],
  gaugeFills = [],
  interactiveIcons = [];
const gaugeTextMats = [];
const gaugeTexts = [];
const ringInnerRadius = 1.4;
const ringOuterRadius = 1.7;
const tooltipText = makeText('', 0.7, 0xffffff);
tooltipText.visible = false;
tooltipText.renderOrder = 99;
planetGrp.add(tooltipText);

for (let i = 0; i < 6; i++) {
  const y = (2.5 - i) * vSpacing;
  const cardX = 0;
  const gaugeX = 5.5;
  const iconTexture = loadTex(iconImgs[i]);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x111122,
    roughness: 0.4,
    metalness: 0.8,
    emissive: 0xffffff,
    emissiveMap: iconTexture,
    emissiveIntensity: 0.8,
    alphaMap: iconTexture,
    transparent: true,
    opacity: 0,
  });
  iconMats.push(mat);
  const card = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.3), mat);
  card.position.set(cardX, y, 0);
  card.userData = {
    name: techNames[i],
    skill: skills[i]
  };
  techSkillsGroup.add(card);
  interactiveIcons.push(card);
  const bgGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
  const bgMat = new THREE.MeshBasicMaterial({
    color: 0x555555,
    transparent: true,
    opacity: 0
  });
  const gaugeBg = new THREE.Mesh(bgGeo, bgMat);
  gaugeBg.position.set(gaugeX, y, 0);
  techSkillsGroup.add(gaugeBg);
  const fillGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64, 1, -Math.PI / 2, 0);
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x00c0ff,
    transparent: true,
    opacity: 0
  });
  const gaugeFill = new THREE.Mesh(fillGeo, fillMat);
  gaugeFill.position.set(gaugeX, y, 0.01);
  techSkillsGroup.add(gaugeFill);
  const tPercent = makeText(`${skills[i]}%`, 0.9, 0xffffff);
  tPercent.anchorX = 'center';
  tPercent.anchorY = 'middle';
  tPercent.position.set(gaugeX, y, 0.02);
  tPercent.material.opacity = 0;
  techSkillsGroup.add(tPercent);
  gaugeTextMats.push(tPercent.material);
  gaugeTexts.push(tPercent);
  const targetAngle = (skills[i] / 100) * Math.PI * 2;
  gaugeFills.push({
    mesh: gaugeFill,
    targetAngle: targetAngle
  });
  gaugeMats.push(bgMat, fillMat);
  gsap.to(card.position, {
    y: card.position.y + 0.5,
    duration: 2,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
    delay: Math.random() * 2
  });
}

/* 조명 */
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dirL = new THREE.DirectionalLight(0xffffff, 0.7);
dirL.position.set(5, 10, 5);
scene.add(dirL);

/* ── GSAP 타임라인 ───────────────────────────────────── */
function createTimeline() {
  document.querySelector('#scroll-container').style.height = '15000vh';
  tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2
    }
  });
  const hideAll = () => {
    ALL_TEXT_NODES.forEach(n => {
      if (n !== tooltipText && n !== reactNativeText) n.visible = false;
    });
  };

  /* Act0 – 글리치 인트로 */
  tl.to('#initial-screen', {
    opacity: 0,
    duration: 10
  });
  tl.set(glitchPass, {
    enabled: true,
    goWild: false
  }, '<+4')
    .set(glitchPass, {
      enabled: false
    }, '>.2')
    .set(glitchPass, {
      enabled: true,
      goWild: true
    }, '>.5')
    .set(glitchPass, {
      enabled: false
    }, '>.4')
    .set('#initial-screen', {
      display: 'none'
    });

  /* Act1 – Spark */
  tl.addLabel('sparkStart');
  tl.to(spark.material, {
    opacity: 1,
    size: 0.4,
    duration: 0.5
  }, 'sparkStart');
  tl.to(camera.position, {
    z: 30,
    duration: 8,
    ease: 'power2.inOut'
  }, 'sparkStart');
  tl.to(spark.position, {
    z: 12,
    duration: 8,
    ease: 'power2.inOut'
  }, 'sparkStart');
  tl.to(spark.material, {
    size: 0.9,
    duration: 8,
    ease: 'power2.inOut'
  }, 'sparkStart');
  tl.to(spark.material, {
    opacity: 0,
    size: 0.4,
    duration: 1.8,
    ease: 'sine.in'
  }, 'sparkStart+=6.5');
  tl.set(spark, {
    visible: false
  }, 'sparkStart+=8');

  /* Act2 – HUD */
  coordTxt.position.set(-28, 0, -8);
  idTxt.position.set(0, 0, -8);
  coreTxt.position.set(28, 0, -8);
  tl.addLabel('hud');
  tl.to([coordTxt.material, idTxt.material, coreTxt.material], {
    opacity: 1,
    duration: 8,
    stagger: 0.5
  }, 'hud');
  tl.to({}, {
    duration: 10
  });

  /* Act3 – HUD merge & ACCESS */
  tl.addLabel('merge');
  tl.to([coordTxt.position, idTxt.position, coreTxt.position], {
    x: 0,
    duration: 8,
    ease: 'power2.in'
  }, 'merge');
  tl.to([coordTxt.material, idTxt.material, coreTxt.material], {
    opacity: 0,
    duration: 5,
    ease: 'power2.out'
  }, 'merge+=0.2');
  tl.to(accessTxt.material, {
    opacity: 1,
    duration: 3
  }, '>-2');
  tl.to(accessTxt.position, {
    z: -8
  }, '<');
  tl.to({}, {
    duration: 8
  });

  /* Act4 – Profile */
  tl.addLabel('profile');
  tl.to(accessTxt.material, {
    opacity: 0,
    duration: 3
  }, 'profile');
  profileGrp.visible = true;
  tl.to(camera.position, {
    x: -7,
    duration: 6,
    ease: 'power2.inOut'
  }, 'profile');
  tl.from(vLine.scale, {
    y: 0,
    duration: 5,
    ease: 'power2.out'
  }, 'profile+=1')
    .to(vLine.material, {
      opacity: 0.35,
      duration: 5
    }, '<')
    .to(profilePlane.material.uniforms.u_opacity, {
      value: 1,
      duration: 8
    }, 'profile+=2');
  profileNodes.forEach((n, i) => {
    const t = `profile+=${1+i*0.15-(i>2?0.15:0)}`;
    tl.from(n.position, {
      x: n.position.x + 40,
      duration: 6,
      ease: 'power3.out'
    }, t)
      .to(n.material, {
        opacity: 1,
        duration: 6,
        ease: 'power3.out'
      }, t);
  });
  tl.to(vLine.material, {
    opacity: 0,
    duration: 5
  }, 'profile+=9');
  tl.to({}, {
    duration: 10
  });

  /* Act5 – Projects */
  tl.addLabel('projects');
  tl.to([...profileMats, vLine.material], {
    opacity: 0,
    duration: 4,
    ease: 'power2.out'
  }, 'projects');
  tl.to(profilePlane.material.uniforms.u_opacity, {
    value: 0,
    duration: 4,
    ease: 'power2.out'
  }, '<');
  projectsGrp.children.forEach((g, i) => {
    const viewZ = g.position.z + 24;
    tl.to(camera.position, {
      x: 0,
      y: 0,
      z: viewZ,
      duration: 15,
      ease: 'power2.inOut'
    });
    tl.set(g, {
      visible: true
    }, '>');
    tl.to(g.userData.thumb.material.uniforms.u_opacity, {
      value: 1,
      duration: 8,
      stagger: 0.2
    }, '<');
    const mats = g.userData.txtNodes.map(n => n.material);
    tl.to(mats, {
      opacity: 1,
      duration: 8,
      stagger: 0.2
    }, '<');
    tl.to({}, {
      duration: 10
    });
    if (i < projectsGrp.children.length - 1) {
      tl.to(g.userData.thumb.material.uniforms.u_opacity, {
        value: 0,
        duration: 8,
        stagger: 0.05
      });
      tl.to(mats, {
        opacity: 0,
        duration: 8,
        stagger: 0.05
      }, '<');
      tl.set(g, {
        visible: false
      }, '>');
    }
  });

  /* Act6 – Force-field 블랙홀 */
  tl.addLabel('blackhole');
  const last = projectsGrp.children.at(-1);
  tl.to(last.userData.thumb.material.uniforms.u_opacity, {
    value: 0,
    duration: 5
  }, 'blackhole');
  tl.to(last.userData.txtNodes.map(n => n.material), {
    opacity: 0,
    duration: 5
  }, '<');
  tl.set(last, {
    visible: false
  });
  tl.call(hideAll, null, 'blackhole');
  tl.to(camera.position, {
    x: 0,
    y: 0,
    z: 50,
    duration: 10,
    ease: 'power2.inOut'
  }, 'blackhole+=2');
  tl.set(finaleGrp, {
    visible: true
  }, '<');
  tl.to(ffMat.uniforms.u_opacity, {
    value: 0.7,
    duration: 10
  }, '<');
  tl.to(ffMat.uniforms.u_force_strength, {
    value: 10,
    duration: 10,
    ease: 'power2.out'
  }, '<');

  /* Act7 – Galaxy Intro */
  tl.addLabel('galaxyIntro', 'blackhole+=');
  tl.to(ffMat.uniforms.u_opacity, {
    value: 0,
    duration: 6
  }, 'galaxyIntro');
  tl.to(galMat.uniforms.u_progress, {
    value: 1.0,
    duration: 8,
    ease: 'power2.out'
  }, 'galaxyIntro+=1');
  tl.to(camera.position, {
    z: 25,
    duration: 8,
    ease: 'power2.inOut'
  }, '<');
  tl.to(bloomPass, {
    strength: 1.8,
    duration: 8
  }, 'galaxyIntro');

  /* Act8 – Galaxy Fly */
  tl.addLabel('galaxyFly');
  tl.to(camera.position, {
    z: -80,
    duration: 20,
    ease: 'none'
  }, 'galaxyFly');
  tl.to(galaxy.rotation, {
    y: Math.PI * 2,
    duration: 20,
    ease: 'none'
  }, 'galaxyFly');
  tl.to(bloomPass, {
    strength: 2.5,
    duration: 20,
    ease: 'none'
  }, 'galaxyFly');

  /* Act9 – Planet */
  tl.addLabel('planetIntro', 'galaxyFly+=60');
  tl.call(() => placeInFront(planetGrp, 32), null, 'planetIntro');
  tl.set(planetGrp, {
    visible: true
  }, 'planetIntro');
  tl.to(bloomPass, {
    strength: 1.5,
    duration: 8,
    ease: 'power2.out'
  }, 'planetIntro');
  tl.from(particleSphere.material, {
    opacity: 0,
    duration: 4,
    ease: 'power2.out'
  }, 'planetIntro');
  tl.from(particleSphere.scale, {
    x: 0,
    y: 0,
    z: 0,
    duration: 6,
    ease: 'power3.out'
  }, 'planetIntro');
  tl.from(ringMats, {
    opacity: 0,
    duration: 4,
    stagger: 0.2,
    ease: 'power3.out'
  }, 'planetIntro+=0.5');
  tl.from([pivot1.scale, pivot2.scale, pivot3.scale], {
    x: 0,
    y: 0,
    z: 0,
    duration: 6,
    stagger: 0.4,
    ease: 'power3.out'
  }, 'planetIntro+=0.5');
  tl.to(iconMats, {
    opacity: 1,
    duration: 4
  }, 'planetIntro+=1');
  tl.to(gaugeMats, {
    opacity: 0.8,
    duration: 4
  }, 'planetIntro+=1');
  tl.to(gaugeTextMats, {
    opacity: 1,
    duration: 4
  }, 'planetIntro+=1');
  const gaugeAnimationState = {
    progress: 0
  };
  tl.to(gaugeAnimationState, {
    progress: 1,
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      gaugeFills.forEach(item => {
        const currentAngle = item.targetAngle * gaugeAnimationState.progress;
        item.mesh.geometry.dispose();
        item.mesh.geometry = new THREE.RingGeometry(
          ringInnerRadius, ringOuterRadius, 64, 1, -Math.PI / 2, currentAngle
        );
      });
    },
    onComplete: () => {
      gaugeFills.forEach(item => {
        item.mesh.geometry.dispose();
        item.mesh.geometry = new THREE.RingGeometry(
          ringInnerRadius, ringOuterRadius, 64, 1, -Math.PI / 2, item.targetAngle
        );
      });
    }
  }, 'planetIntro+=1.5');
  tl.to({}, {
    duration: 20
  });

  /* Act10 – React Native Finale */
  tl.addLabel('reactFinale');
  const allTechStuffMats = [...iconMats, ...gaugeMats, ...gaugeTextMats];
  tl.to(allTechStuffMats, {
    opacity: 0,
    duration: 8,
    ease: 'power2.out'
  }, 'reactFinale');
  const reactColor = new THREE.Color(0x61dafb);
  tl.to(particleSphereMat.color, {
    r: reactColor.r,
    g: reactColor.g,
    b: reactColor.b,
    duration: 12
  }, 'reactFinale');
  ringMats.forEach(m => {
    tl.to(m.color, {
      r: reactColor.r,
      g: reactColor.g,
      b: reactColor.b,
      duration: 12
    }, 'reactFinale');
    tl.to(m, {
      size: 0.2,
      duration: 12
    }, 'reactFinale');
  });
  const reactRotX = Math.PI / 2;
  tl.to(pivot1.rotation, {
    x: reactRotX,
    y: 0,
    z: 0,
    duration: 15,
    ease: 'power2.inOut'
  }, 'reactFinale');
  tl.to(pivot2.rotation, {
    x: reactRotX,
    y: 0,
    z: Math.PI / 3,
    duration: 15,
    ease: 'power2.inOut'
  }, 'reactFinale');
  tl.to(pivot3.rotation, {
    x: reactRotX,
    y: 0,
    z: -Math.PI / 3,
    duration: 15,
    ease: 'power2.inOut'
  }, 'reactFinale');
  tl.to([ring1.rotation, ring2.rotation, ring3.rotation], {
    x: 0,
    y: 0,
    z: 0,
    duration: 15,
    ease: 'power2.inOut'
  }, 'reactFinale');
  tl.to([ring1.scale, ring2.scale, ring3.scale], {
    x: 1,
    y: 1.05,
    z: 1,
    duration: 15,
    ease: 'power2.inOut'
  }, 'reactFinale');
  tl.to(bloomPass, {
    strength: 1.2,
    duration: 15,
    ease: 'power2.inOut'
  }, `reactFinale+=5`);
  tl.set(reactNativeText, {
    visible: true
  }, `reactFinale+=8`);
  tl.call(() => {
    const textPos = particleSphere.getWorldPosition(new THREE.Vector3());
    reactNativeText.position.set(textPos.x, textPos.y - 15, textPos.z);
  }, null, `reactFinale+=8`);
  tl.to(reactNativeText.material, {
    opacity: 1,
    duration: 10
  }, `reactFinale+=8`);
  tl.to({}, {
    duration: 15
  });

  /* Act11 – 최종 로고 해체 */
  const deconstructLabel = "deconstruct";
  tl.addLabel(deconstructLabel, ">");
  const deconstructDuration = 20;
  const ease = 'power2.inOut';
  tl.to(ring1.scale, {
    x: 0.5, y: 0.5, z: 0.5,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(ring2.scale, {
    x: 0.4, y: 0.4, z: 0.4,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(ring3.scale, {
    x: 0.333, y: 0.333, z: 0.333,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(particleSphere.scale, {
    x: 0.1, y: 0.1, z: 0.1,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(planetGrp.rotation, {
    x: `+=${Math.PI / 6}`,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(pivot2.rotation, {
    y: `-=${Math.PI / 4}`,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(pivot3.rotation, {
    y: `+=${Math.PI / 4}`,
    duration: deconstructDuration, ease: ease
  }, deconstructLabel);
  tl.to(reactNativeText.material, {
    opacity: 0,
    duration: deconstructDuration / 2, ease: ease
  }, deconstructLabel);
  tl.to({}, {
    duration: 20
  });

  /* Act12 - 응축 (Singularity) */
  const singularityLabel = "singularity";
  tl.addLabel(singularityLabel, ">");
  tl.to(planetGrp.scale, {
    x: 0.001, y: 0.001, z: 0.001,
    duration: 20, ease: 'power3.in'
  }, singularityLabel);
  tl.to(bloomPass, {
    strength: 7.0,
    duration: 22, ease: 'power3.in'
  }, singularityLabel);
  tl.call(() => {
    planetGrp.visible = false;
    reactNativeText.visible = false;
  }, null, ">-0.1");
  tl.to({}, { duration: 5 }); // 폭발 전 여백

  /* [수정] Act13 - 대폭발과 새로운 우주의 탄생 (GPU 가속) */
  const bigBangLabel = "bigBang";
  tl.addLabel(bigBangLabel, ">");

  // 카메라를 폭발의 중심으로 이동
  tl.call(() => {
    const singularityPos = planetGrp.getWorldPosition(new THREE.Vector3());
    camera.position.copy(singularityPos);
    bigBangGrp.position.copy(singularityPos); // 빅뱅 그룹도 같은 위치에서 시작
    bigBangGrp.visible = true;
  }, null, bigBangLabel);

  // 블룸 효과 및 파티클 투명도 조절
  tl.to(bloomPass, {
    strength: 2.0,
    duration: 25, ease: 'power2.out'
  }, bigBangLabel);
  tl.to(bangMat.uniforms.u_opacity, {
    value: 0.9,
    duration: 25, ease: 'power1.out'
  }, bigBangLabel);

  // 카메라를 뒤로 빼면서 웅장한 은하의 모습을 보여줌
  tl.to(camera.position, {
    z: camera.position.z + 400, // 멀리 후퇴
    duration: 50,
    ease: 'power3.out'
  }, bigBangLabel)

  // Shader의 u_progress 값을 0에서 1로 애니메이션하여 폭발 실행
  tl.to(bangMat.uniforms.u_progress, {
    value: 1,
    duration: 50,
    ease: 'power3.out',
  }, bigBangLabel);
}

/* ── 타임라인 생성 ───────────────────────────────────── */
pSlogan.sync(() => {
  layoutProfile();
  createTimeline();
  ScrollTrigger.refresh();
});

/* ── Render Loop ───────────────────────────────────────── */
const clock = new THREE.Clock();
const targetRotation = new THREE.Euler(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  mousePos.lerp(targetMousePos, 0.1);

  if (planetGrp.visible) {
    raycaster.setFromCamera(mousePos, camera);
    const intersects = raycaster.intersectObjects(interactiveIcons);
    const newlyHoveredIcon = intersects.length > 0 ? intersects[0].object : null;
    if (newlyHoveredIcon !== hoveredIcon) {
      if (hoveredIcon) {
        gsap.to(hoveredIcon.material, {
          emissiveIntensity: 0.8,
          duration: 0.3
        });
      }
      if (newlyHoveredIcon) {
        gsap.to(newlyHoveredIcon.material, {
          emissiveIntensity: 1.2,
          duration: 0.3
        });
        gsap.killTweensOf(tooltipText.material);
        const { name, skill } = newlyHoveredIcon.userData;
        tooltipText.text = `${name} - ${skill}%`;
        tooltipText.visible = true;
        tooltipText.sync(() => {
          const iconWorldPos = new THREE.Vector3();
          newlyHoveredIcon.getWorldPosition(iconWorldPos);
          tooltipText.position.copy(iconWorldPos).add(new THREE.Vector3(0, -2.5, 0));
          tooltipText.lookAt(camera.position);
          gsap.to(tooltipText.material, {
            opacity: 1,
            duration: 0.4
          });
        });
      } else {
        gsap.killTweensOf(tooltipText.material);
        gsap.to(tooltipText.material, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            tooltipText.visible = false;
          }
        });
      }
      hoveredIcon = newlyHoveredIcon;
    }
  }

  if (finaleGrp.visible) {
    ffMat.uniforms.u_time.value = t;
    const v = new THREE.Vector3(mousePos.x, mousePos.y, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const dist = (finaleGrp.position.z - camera.position.z) / dir.z;
    const p = camera.position.clone().add(dir.multiplyScalar(dist));
    ffMat.uniforms.u_mouse.value.set(p.x, p.y);
    galMat.uniforms.u_time.value = t * 0.5;
    galMat.uniforms.u_mouse.value.set(p.x * 0.3, p.y * 0.3);
  }

  if (planetGrp.visible) {
    const inReactFinale = tl && tl.labels.reactFinale && tl.time() >= tl.labels.reactFinale;
    if (!inReactFinale) {
      const s = 1 + Math.sin(t * 0.5) * 0.08;
      particleSphere.scale.set(s, s, s);
      particleSphere.rotation.y += 0.0018;
      particleSphere.rotation.x += 0.0009;
      pivot1.rotation.z += 0.0008;
      ring1.rotation.y += 0.002;
      pivot2.rotation.z -= 0.0006;
      ring2.rotation.x += 0.002;
      pivot3.rotation.z += 0.0004;
      ring3.rotation.y += 0.0015;
    }
    techSkillsGroup.children.forEach(o => {
      if (o.isMesh) o.lookAt(camera.position);
    });
    if (tooltipText.visible) tooltipText.lookAt(camera.position);
    if (reactNativeText.visible) reactNativeText.lookAt(camera.position);
    gaugeTexts.forEach(t => t.lookAt(camera.position));
  }

  // [수정] animate 루프 내에서 GSAP 호출 대신 직접 회전값 보간
  if (bigBangGrp.visible) {
    // 마우스 위치에 따라 목표 회전값 설정
    targetRotation.y = -mousePos.x * 0.1;
    targetRotation.x = -mousePos.y * 0.1;

    // 현재 회전값을 목표 회전값으로 부드럽게 보간(lerp)
    bigBangGrp.rotation.x += (targetRotation.x - bigBangGrp.rotation.x) * 0.05;
    bigBangGrp.rotation.y += (targetRotation.y - bigBangGrp.rotation.y) * 0.05;
  }

  twinkleGrp.children.forEach(q => {
    if (!q.isTwinkling && Math.random() > .998) {
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

  if (Math.random() < 0.003 && !shooting) fireStar();

  composer.render();
}

animate();