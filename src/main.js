// --- 라이브러리 임포트 ---
import * as THREE from 'three';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { Text } from 'troika-three-text';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

gsap.registerPlugin(ScrollTrigger);

// --- 씬, 카메라, 렌더러, 포스트 프로세싱 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#app'), antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- 텍스처 로더 ---
const textureLoader = new THREE.TextureLoader();

// --- 월드 오브젝트 선언 ---
function createStars(count, size, depth) { const vertices = []; for (let i = 0; i < count; i++) { vertices.push((Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth ); } const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); const material = new THREE.PointsMaterial({ color: 0xaaaaaa, size, transparent: true, opacity: 0.7 }); return new THREE.Points(geometry, material); }
scene.add(createStars(1500, 1.5, 1500));

const shootingStar = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0}));
scene.add(shootingStar);
let isShooting = false;
function fireShootingStar() {
    if (isShooting) return;
    isShooting = true;
    const startX = Math.random() * 200 - 100;
    const startY = 100;
    const endX = Math.random() * 200 - 100;
    const endY = -100;
    const zPos = Math.random() * -400 - 100;
    shootingStar.position.set(startX, startY, zPos);
    shootingStar.material.opacity = 1;
    gsap.to(shootingStar.position, {
        x: endX,
        y: endY,
        duration: Math.random() * 1.5 + 0.5,
        ease: 'power2.in',
        onComplete: () => {
            shootingStar.material.opacity = 0;
            isShooting = false;
        }
    });
}

const twinkleGroup = new THREE.Group();
const twinkleCount = 150;
const twinkleTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');

for (let i = 0; i < twinkleCount; i++) {
    const twinkleMat = new THREE.MeshBasicMaterial({ map: twinkleTexture, color: 0xffffff, transparent: true, opacity: Math.random() * 0.5, blending: THREE.AdditiveBlending, depthWrite: false, });
    const twinkle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), twinkleMat);
    const R = 300; const r = R * Math.sqrt(Math.random()); const theta = Math.random() * 2 * Math.PI;
    const x = r * Math.cos(theta); const y = r * Math.sin(theta); const z = (Math.random() - 0.5) * R;
    twinkle.position.set(x, y, z);
    twinkle.isTwinkling = false;
    twinkleGroup.add(twinkle);
}
scene.add(twinkleGroup);

// 시작점(Spark)
const spark = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true }));
scene.add(spark);


// --- 인트로 & 프로필 & 프로젝트 관련 오브젝트 ---

// 1. 초기 텍스트
const coordinatesText = new Text(); scene.add(coordinatesText); coordinatesText.text = '[35.1796° N, 129.0756° E]'; coordinatesText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coordinatesText.fontSize = 1.5; coordinatesText.color = 0xffffff; coordinatesText.anchorX = 'center'; coordinatesText.material.transparent = true; coordinatesText.material.opacity = 0; coordinatesText.sync();
const uniqueIDText = new Text(); scene.add(uniqueIDText); uniqueIDText.text = 'OBJECT LSM-2002'; uniqueIDText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; uniqueIDText.fontSize = 2.5; uniqueIDText.color = 0xffffff; uniqueIDText.anchorX = 'center'; uniqueIDText.material.transparent = true; uniqueIDText.material.opacity = 0; uniqueIDText.sync();
const coreComponentsText = new Text(); scene.add(coreComponentsText); coreComponentsText.text = 'LOGIC | CREATIVITY | DIMENSION'; coreComponentsText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coreComponentsText.fontSize = 1.5; coreComponentsText.color = 0xffffff; coreComponentsText.anchorX = 'center'; coreComponentsText.material.transparent = true; coreComponentsText.material.opacity = 0; coreComponentsText.sync();

// 2. 시스템 메시지
const accessCompleteText = new Text(); scene.add(accessCompleteText); accessCompleteText.text = 'SYSTEM ACCESS: COMPLETE'; accessCompleteText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; accessCompleteText.fontSize = 2; accessCompleteText.color = 0xffffff; accessCompleteText.anchorX = 'center'; accessCompleteText.material.transparent = true; accessCompleteText.material.opacity = 0; accessCompleteText.sync();

// 3. 최종 프로필 내용
const profileGroup = new THREE.Group();
const profileTitle = new Text(); profileTitle.text = 'Creative Developer 이승민'; profileTitle.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; profileTitle.fontSize = 2.2; profileTitle.color = 0xffffff; profileTitle.anchorX = 'left'; profileTitle.material.transparent = true; profileTitle.material.opacity = 0; profileTitle.sync();
const profileSlogan = new Text(); profileSlogan.text = '복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.'; profileSlogan.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; profileSlogan.fontSize = 1; profileSlogan.color = 0xcccccc; profileSlogan.anchorX = 'left'; profileSlogan.lineHeight = 1.5; profileSlogan.material.transparent = true; profileSlogan.material.opacity = 0; profileSlogan.sync();
const profileEmail = new Text(); profileEmail.text = 'E-mail: rlaxodud5877@naver.com'; profileEmail.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; profileEmail.fontSize = 0.9; profileEmail.color = 0xcccccc; profileEmail.anchorX = 'left'; profileEmail.material.transparent = true; profileEmail.material.opacity = 0; profileEmail.sync();
const profileGithub = new Text(); profileGithub.text = 'GitHub: github.com/dltmdals5912'; profileGithub.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; profileGithub.fontSize = 0.9; profileGithub.color = 0xcccccc; profileGithub.anchorX = 'left'; profileGithub.material.transparent = true; profileGithub.material.opacity = 0; profileGithub.sync();
const profileImageMat = new THREE.MeshBasicMaterial({ map: textureLoader.load('src/profile.png'), transparent: true, opacity: 0, color: 0xdddddd });
const profileImage = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), profileImageMat);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
const verticalLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, -8, 0)]), lineMaterial.clone());
profileGroup.add(profileTitle, profileSlogan, profileEmail, profileGithub, profileImage, verticalLine);
scene.add(profileGroup);

// 4. 프로젝트 섹션
const projectsGroup = new THREE.Group();
const projectsData = [
    { title: "AURA: Generative Data Sculpture", role: "Lead Developer & Creative Technologist", description: "소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품. 데이터의 흐름과 감정의 파동을 통해 보이지 않는 언어의 이면을 탐험하고자 했습니다.", tech: "Three.js (WebGL), GSAP, Socket.IO, Python (NLP), AWS", imageUrl: "https://storage.googleapis.com/gemini-prod-us-west1-423901-d421/images/28320145-562a-430b-a636-6799042c139d.jpg" },
    { title: "RE;Commerce Platform UX Overhaul", role: "Frontend Lead & UX Prototyper", description: "기존 이커머스 플랫폼의 낮은 구매 전환율 문제 해결을 목표로, 사용자 여정 전체를 재설계했습니다. 3D 제품 프리뷰와 인터랙티브한 장바구니 경험을 도입하여, 고객 인게이지먼트를 40% 이상 향상시켰습니다.", tech: "Next.js, TypeScript, Three.js, GraphQL, Framer Motion", imageUrl: "https://storage.googleapis.com/gemini-prod-us-west1-423901-d421/images/3f55095d-79e5-4702-861d-721200fa447c.jpg" },
    { title: "FlowField: Real-time Audio-Reactive Art", role: "Sole Developer & Artist", description: "Web Audio API를 통해 실시간으로 사운드를 분석하고, 그 주파수와 비트 데이터를 GLSL 셰이더로 전달하여 유기적인 비주얼을 생성하는 미디어 아트. 온라인 갤러리 'CODED CANVAS'에 전시되었습니다.", tech: "TypeScript, p5.js, Web Audio API, GLSL, Vite", imageUrl: "https://storage.googleapis.com/gemini-prod-us-west1-423901-d421/images/b6537651-c1e0-40e1-b4f0-46eb132470ba.jpg" }
];

projectsData.forEach((project, i) => {
    const projectGroup = new THREE.Group();
    const imageMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(project.imageUrl), transparent: true, opacity: 0 });
    const imageMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), imageMat);
    imageMesh.position.set(-15, 1, 0);
    const title = new Text(); title.text = project.title; title.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; title.fontSize = 2; title.color = 0xffffff; title.anchorX = 'left'; title.position.set(5, 6, 0); title.material.transparent = true; title.material.opacity = 0; title.sync();
    const role = new Text(); role.text = project.role; role.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; role.fontSize = 1; role.color = 0x00BFFF; role.anchorX = 'left'; role.position.set(5, 3.5, 0); role.material.transparent = true; role.material.opacity = 0; role.sync();
    const desc = new Text(); desc.text = project.description; desc.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; desc.fontSize = 1; desc.color = 0xcccccc; desc.anchorX = 'left'; desc.position.set(5, 0, 0); desc.maxWidth = 20; desc.lineHeight = 1.5; desc.material.transparent = true; desc.material.opacity = 0; desc.sync();
    const tech = new Text(); tech.text = `Tech: ${project.tech}`; tech.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; tech.fontSize = 0.8; tech.color = 0xcccccc; tech.anchorX = 'left'; tech.position.set(5, -5, 0); tech.material.transparent = true; tech.material.opacity = 0; tech.sync();
    projectGroup.add(imageMesh, title, role, desc, tech);
    projectGroup.position.z = -80 * (i + 1);
    projectsGroup.add(projectGroup);
});
scene.add(projectsGroup);


// --- 애니메이션 타임라인 설정 ---
camera.position.z = 100;
document.querySelector('#scroll-container').style.height = '2000vh';
const tl = gsap.timeline({ scrollTrigger: { trigger: "#scroll-container", start: "top top", end: "bottom bottom", scrub: 1.5, } });


// --- Act 1: 하나의 점(spark) 등장 및 소멸 ---
// [FIXED] 이전에 합의한 대로, 스크롤 길이를 길게(duration: 20) 유지하도록 복구
tl.to(camera.position, { z: 10, duration: 20, ease: "power1.in" });
tl.to(spark.material, { size: 2.0, duration: 20 }, "<");
tl.to(spark.material, { opacity: 0, duration: 3, ease: "power2.out" });


// --- Act 2: 카메라 구도 설정 및 텍스트 등장 ---
tl.to({}, {duration: 5});
tl.addLabel("setupView");
tl.to(camera.position, { z: 40, duration: 10 }, "setupView");
tl.to({}, {duration: 5});

tl.addLabel("textsAppear", ">");
const textPositions = { left: { x: -28, y: 0, z: 0 }, center: { x: 0, y: 0, z: 0 }, right: { x: 28, y: 0, z: 0 }, };
tl.set(coordinatesText.position, textPositions.left);
tl.set(uniqueIDText.position, textPositions.center);
tl.set(coreComponentsText.position, textPositions.right);
tl.to([coordinatesText.material, uniqueIDText.material, coreComponentsText.material], { opacity: 1, duration: 8, stagger: 0.5 }, "textsAppear");
tl.to({}, {duration: 10});

// --- Act 3: 접속 완료 ---
tl.addLabel("merge");
tl.to([coordinatesText.position, uniqueIDText.position, coreComponentsText.position], { x: 0, y: 0, z: 0, duration: 8, ease: 'power2.in' }, "merge");
tl.to([coordinatesText.material, uniqueIDText.material, coreComponentsText.material], { opacity: 0, duration: 5 }, "<");
tl.to(accessCompleteText.material, { opacity: 1, duration: 3 }, ">-2");
tl.to({}, {duration: 8});

// --- Act 4: 프로필 구성 ---
tl.addLabel("constructProfile");
tl.to(accessCompleteText.material, { opacity: 0, duration: 3 }, "constructProfile");
verticalLine.position.set(-7, 0, 0);
tl.from(verticalLine.scale, { y: 0, duration: 5, ease: 'power2.out' }, ">");
tl.to(verticalLine.material, { opacity: 0.3, duration: 5 }, "<");
profileImage.position.set(-15, 0, 0);
tl.to(profileImage.material, { opacity: 1, duration: 8 }, "constructProfile+=2");
tl.from(profileImage.scale, { x: 0.8, y: 0.8, duration: 8 }, "<");
profileTitle.position.set(-1, 4, 0);
profileSlogan.position.set(-1, 0.5, 0);
profileEmail.position.set(-1, -3, 0);
profileGithub.position.set(-1, -4.5, 0);
tl.to([profileTitle.material, profileSlogan.material, profileEmail.material, profileGithub.material], { opacity: 1, duration: 5, stagger: 0.5 }, "constructProfile+=4");
tl.from([profileTitle.position, profileSlogan.position, profileEmail.position, profileGithub.position], { x: '+=1', duration: 5, stagger: 0.5 }, "<");
tl.to(verticalLine.material, { opacity: 0, duration: 5 }, ">");
tl.to({}, {duration: 15});

// --- Act 5: 프로젝트 섹션으로 전환 ---
tl.addLabel("transitionToProjects");
tl.to(profileGroup.position, { y: -30, duration: 10, ease:'power2.in' }, "transitionToProjects");
tl.to(profileGroup.scale, { x: 0.8, y: 0.8, z: 0.8, duration: 10 }, "<");
tl.to(camera.position, { x: 0, y: 0, z: -255, duration: 40, ease: 'power1.inOut' }, "transitionToProjects+=5");

// --- Act 6: 프로젝트 탐색 ---
projectsGroup.children.forEach((projectGroup, i) => {
    tl.addLabel(`project${i}`, `>-=10`);
    tl.to(camera.position, {
        x: projectGroup.position.x, y: projectGroup.position.y, z: projectGroup.position.z + 25,
        duration: 15, ease: 'power2.inOut'
    }, `project${i}`);

    const projectElements = projectGroup.children;
    tl.to(projectElements.map(el=>el.material), { opacity: 1, duration: 10, stagger: 0.2 }, `project${i}+=5`);
    tl.from(projectElements.map(el=>el.position), { x: '+=5', duration: 10, stagger: 0.2, ease: 'power2.out' }, '<');
    tl.to({}, { duration: 25 });
});

// --- 렌더링 루프 ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    twinkleGroup.children.forEach(twinkle => {
        if (!twinkle.isTwinkling && Math.random() > 0.998) {
            twinkle.isTwinkling = true;
            const duration = Math.random() * 0.5 + 0.5;
            gsap.to(twinkle.scale, { x: 1.5, y: 1.5, duration: duration, ease: 'power2.out', yoyo: true, repeat: 1, onComplete: () => { twinkle.isTwinkling = false; } });
            gsap.to(twinkle.material, { opacity: 0.8, duration: duration, ease: 'power2.out', yoyo: true, repeat: 1 });
        }
    });
    if (Math.random() < 0.003 && !isShooting) {
        fireShootingStar();
    }
    composer.render();
}
animate();