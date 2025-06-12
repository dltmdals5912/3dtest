// --- 라이브러리 임포트 ---
import * as THREE from 'three';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { Text } from 'troika-three-text';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';

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

const glitchPass = new GlitchPass();
glitchPass.enabled = false;
composer.addPass(glitchPass);

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
scene.add(createStars(1000, 2.0, 1000));
const spark = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true }));
scene.add(spark);
const coordinatesText = new Text(); scene.add(coordinatesText); coordinatesText.text = '[35.1796° N, 129.0756° E]'; coordinatesText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coordinatesText.fontSize = 1.5; coordinatesText.color = 0xffffff; coordinatesText.anchorX = 'center'; coordinatesText.material.transparent = true; coordinatesText.material.opacity = 0; coordinatesText.sync();
const uniqueIDText = new Text(); scene.add(uniqueIDText); uniqueIDText.text = 'OBJECT LSM-2002'; uniqueIDText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; uniqueIDText.fontSize = 2; uniqueIDText.color = 0xffffff; uniqueIDText.anchorX = 'center'; uniqueIDText.material.transparent = true; uniqueIDText.material.opacity = 0; uniqueIDText.sync();
const coreComponentsText = new Text(); scene.add(coreComponentsText); coreComponentsText.text = 'LOGIC | CREATIVITY | DIMENSION'; coreComponentsText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coreComponentsText.fontSize = 1.8; coreComponentsText.color = 0xffffff; coreComponentsText.anchorX = 'center'; coreComponentsText.material.transparent = true; coreComponentsText.material.opacity = 0; coreComponentsText.sync();
const descriptionText = new Text(); coreComponentsText.add(descriptionText); descriptionText.text = 'JavaScript, Algorithm | AI Art, Storytelling | 3D, Interactive Space'; descriptionText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; descriptionText.fontSize = 0.8; descriptionText.color = 0xbbbbbb; descriptionText.anchorX = 'center'; descriptionText.position.y = -1.5; descriptionText.material.transparent = true; descriptionText.material.opacity = 0; descriptionText.sync();

// =======================================================
// == 새로운 자기소개 섹션 오브젝트 (NEW)
// =======================================================
const profileGroup = new THREE.Group();
profileGroup.visible = false;
scene.add(profileGroup);

// 프로필 이미지
const profileImageMat = new THREE.MeshBasicMaterial({
    map: textureLoader.load('src/profile.png'), // 파일명 확인!
    transparent: true,
    opacity: 0
});
const profileImage = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), profileImageMat);
profileGroup.add(profileImage);

// 프로필 텍스트 함수
function createProfileText(text, size, yPos) {
    const newText = new Text();
    newText.text = text;
    newText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
    newText.fontSize = size;
    newText.color = 0xffffff;
    newText.anchorX = 'center';
    newText.position.y = yPos;
    newText.material.transparent = true;
    newText.material.opacity = 0;
    newText.sync();
    profileGroup.add(newText);
    return newText;
}

// 텍스트 생성
const tagline1Text = createProfileText('기술과 비즈니스를 융합한 Tech Connection', 1, 6);
const nameText = createProfileText('이승민입니다.', 1.5, -5.5);
const tagline2Text = createProfileText('저는 정리자이자 연결자입니다.', 0.8, -7.5);
const contactText = createProfileText('Tel: 010-4009-6329  |  Birth: 2002.06.21  |  E-mail: rlaxodud5877@naver.com', 0.6, -9.5);


// 스킬 허브 오브젝트
const skillHubContainer = new THREE.Group();
skillHubContainer.visible = false;
scene.add(skillHubContainer);

function createRing(radius) { const ring = new THREE.Points( new THREE.TorusGeometry(radius, 0.05, 64, 200), new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0 }) ); ring.scale.set(0, 0, 0); skillHubContainer.add(ring); return ring; }
const outerRing = createRing(14);
const innerRing = createRing(9);
skillHubContainer.rotation.x = Math.PI / 3;

function createSkill(logoUrl, proficiency, radius, angleOffset) {
    const group = new THREE.Group();
    
    const iconMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(logoUrl), transparent: true, opacity: 0, side: THREE.DoubleSide });
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), iconMat);
    group.add(icon);

    const gaugeWidth = 5; 
    const gaugeHeight = 0.2;
    const gaugeMargin = 0.5; 
    const gaugeStartX = 1.8 / 2 + gaugeMargin;

    const gaugeBgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const gaugeBg = new THREE.Mesh(new THREE.PlaneGeometry(gaugeWidth, gaugeHeight), gaugeBgMat);
    gaugeBg.position.set(gaugeStartX + gaugeWidth / 2, 0, -0.01);
    group.add(gaugeBg);
    
    const gaugeMat = new THREE.MeshBasicMaterial({ color: '#00BFFF', transparent: true, opacity: 0, depthWrite: false });
    const gauge = new THREE.Mesh(new THREE.PlaneGeometry(gaugeWidth, gaugeHeight), gaugeMat);
    gauge.position.set(gaugeStartX, 0, 0);
    gauge.scale.x = 0;
    gauge.geometry.translate(gaugeWidth / 2, 0, 0);
    group.add(gauge);

    skillHubContainer.add(group);
    return { group, icon, gaugeBg, gauge, proficiency, radius, angleOffset, currentAngle: angleOffset };
}

const skillsData = [
    { name: 'HTML5', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg', proficiency: 0.95, ring: 'inner' }, { name: 'JavaScript', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png', proficiency: 0.9, ring: 'inner' }, { name: 'React', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg', proficiency: 0.85, ring: 'inner' },
    { name: 'Node.js', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg', proficiency: 0.6, ring: 'outer' }, { name: 'VS Code', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg', proficiency: 0.9, ring: 'outer' }, { name: 'Illustrator', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Adobe_Illustrator_CC_icon.svg/1051px-Adobe_Illustrator_CC_icon.svg.png', proficiency: 0.7, ring: 'outer' },
];
const skills = skillsData.map(data => { const radius = data.ring === 'inner' ? 9 : 14; const ringSkills = skillsData.filter(s => s.ring === data.ring); const skillIndexInRing = ringSkills.findIndex(s => s.name === data.name); const totalInRing = ringSkills.length; const angle = (skillIndexInRing / totalInRing) * Math.PI * 2 + (data.ring === 'outer' ? Math.PI / totalInRing : 0); return createSkill(data.logo, data.proficiency, radius, angle); });

const convergingParticles = new THREE.Group(); scene.add(convergingParticles); for (let i = 0; i < 200; i++) { const particle = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, blending: THREE.AdditiveBlending, transparent: true, opacity: 0 }) ); const radius = Math.random() * 50 + 20; const theta = Math.random() * Math.PI * 2; const phi = Math.acos((Math.random() * 2) - 1); particle.position.set( radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi) ); convergingParticles.add(particle); }
const shootingStar = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0})); scene.add(shootingStar); let isShooting = false; function fireShootingStar() { if (isShooting) return; isShooting = true; const startX = Math.random() * 200 - 100; const startY = 100; const endX = Math.random() * 200 - 100; const endY = -100; const zPos = Math.random() * -200; shootingStar.position.set(startX, startY, zPos); shootingStar.material.opacity = 1; gsap.to(shootingStar.position, { x: endX, y: endY, duration: Math.random() * 1.5 + 0.5, ease: 'power2.in', onComplete: () => { shootingStar.material.opacity = 0; isShooting = false; } }); }

let isOrbiting = true; 

// --- 애니메이션 타임라인 설정 ---
camera.position.z = 100;
const tl = gsap.timeline({ scrollTrigger: { trigger: "#scroll-container", start: "top top", end: "bottom bottom", scrub: 2, } });

// --- Act 1: 인트로 텍스트 등장 ---
tl.to(camera.position, { z: 10, duration: 10, ease: "power1.in" });
tl.to(spark.material, { size: 2.0, duration: 10 }, "<");
tl.to(spark.material, { opacity: 0, duration: 3, ease: "power2.out" });
tl.to(coordinatesText.material, { opacity: 1, duration: 5 });
tl.to(camera.position, { z: 22, duration: 10 }, "<");
tl.addLabel("synthesisStart", "+=5");
tl.to(coordinatesText.position, { x: -12, y: 8, duration: 10, ease: "power2.inOut" }, "synthesisStart");
tl.to(coordinatesText.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 10 }, "<");
tl.to(uniqueIDText.material, { opacity: 1, duration: 8 }, "<2");
tl.to({}, { duration: 5 });
tl.to(uniqueIDText.position, { x: 12, y: -8, duration: 10, ease: "power2.inOut" });
tl.to(uniqueIDText.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 10 }, "<");
tl.to(coreComponentsText.material, { opacity: 1, duration: 8 }, "<2");
tl.to(descriptionText.material, { opacity: 1, duration: 8 }, "<");
tl.to(camera.position, { x: 0, y: 0, z: 35, duration: 15, ease: "power2.out" });
tl.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 15 }, "<");

// =======================================================
// == Act 2: 자기소개 페이지로 전환 (MODIFIED)
// =======================================================
tl.addLabel("deconstructionStart", "+=8");

// 기존 텍스트 분해 및 소멸
const oldTexts = [coordinatesText, uniqueIDText, coreComponentsText, descriptionText];
oldTexts.forEach(text => {
    tl.to(text.material, { opacity: 0, duration: 3, ease: 'power2.out' }, "deconstructionStart");
    tl.to(text.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 3, ease: 'power2.out' }, "<");
});
tl.to(camera.position, { z: 25, duration: 5 }, "deconstructionStart"); // 카메라 살짝 이동

// 자기소개 그룹 등장
tl.addLabel("profileReveal", ">-1");
tl.set(profileGroup, { visible: true }, "profileReveal");

// 이미지 페이드인 및 스케일업
tl.to(profileImage.material, { opacity: 1, duration: 5, ease: 'power2.out' }, "profileReveal");
tl.from(profileImage.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 5, ease: 'power3.out' }, "<");

// 텍스트 순차적으로 등장
const profileTexts = [tagline1Text, nameText, tagline2Text, contactText];
profileTexts.forEach(text => {
    tl.to(text.material, { opacity: 1, duration: 4, ease: 'power2.out' }, "profileReveal+=1");
    tl.from(text.position, { y: text.position.y + 2, duration: 4, ease: 'power3.out' }, "<");
});

// 자기소개 페이지 잠시 유지
tl.to({}, { duration: 15 });

// 자기소개 페이지 퇴장
tl.addLabel("profileFadeOut", ">");
tl.to(profileGroup.material || profileGroup.children.map(c => c.material), {
    opacity: 0,
    duration: 5,
    ease: 'power2.in',
    stagger: 0.3
}, "profileFadeOut");


// =======================================================
// == Act 3: 스킬 허브 탄생 (TIMING ADJUSTED)
// =======================================================
tl.addLabel("skillHubStart", ">-2"); // 자기소개 퇴장과 동시에 스킬허브 준비 시작
convergingParticles.children.forEach(particle => { tl.to(particle.material, { opacity: 1, duration: 2 }, "skillHubStart"); tl.to(particle.position, { x: 0, y: 0, z: 0, duration: 4, ease: "power2.in" }, "skillHubStart"); tl.to(particle.material, { opacity: 0, duration: 1 }, ">-1"); });
tl.set(glitchPass, { enabled: true }, "skillHubStart+=4");
tl.set(glitchPass, { enabled: false }, "skillHubStart+=4.4");
tl.to(bloomPass, { strength: 4, duration: 0.2, yoyo: true, repeat: 1 }, "<");
tl.set(skillHubContainer, { visible: true }, "<");
tl.to([outerRing.scale, innerRing.scale], { x: 1, y: 1, z: 1, duration: 5, ease: 'power3.out', stagger: 0.3 }, ">-0.2");
tl.to([outerRing.material, innerRing.material], { opacity: 1, duration: 5 }, "<");
tl.to(camera.position, { z: 28, duration: 5 }, "<");
tl.to(bloomPass, { strength: 1.5, duration: 3 });

const allSkillElements = skills.flatMap(s => [s.icon.material, s.gaugeBg.material, s.gauge.material]);
tl.to(allSkillElements, { opacity: 1, duration: 1, stagger: 0.2, ease: 'power2.out' });
const allGauges = skills.map(s => s.gauge.scale);
const allProficiencies = skills.map(s => s.proficiency);
tl.to(allGauges, { x: i => allProficiencies[i], duration: 1.5, ease: 'expo.out', stagger: 0.2 }, ">-1");
tl.to(camera.position, { z: 35, duration: 10 }, ">-5");

// =======================================================
// == Act 4: 궤도 이탈 및 재정렬 (기존 Act 5)
// =======================================================
tl.addLabel("realignmentStart", "+=8");
tl.call(() => { isOrbiting = false; });
tl.to([outerRing.material, innerRing.material], { opacity: 0, duration: 3, ease: 'power1.out' }, "realignmentStart");
tl.to(skillHubContainer.rotation, { x: 0, y: 0, z: 0, duration: 5, ease: 'power2.inOut' }, "realignmentStart");

const verticalSpacing = 3;
const totalHeight = (skills.length - 1) * verticalSpacing;
const startY_vertical = totalHeight / 2;

skills.forEach((skill, index) => {
    tl.to(skill.group.position, {
        x: -10,
        y: startY_vertical - index * verticalSpacing,
        z: 0,
        duration: 5,
        ease: 'power2.inOut'
    }, "realignmentStart+=1");
});

tl.to(camera.position, {
    x: 4,
    y: 0,
    z: 22,
    duration: 5,
    ease: 'power2.inOut'
}, "realignmentStart+=1");


// --- 렌더링 루프 ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    if (Math.random() < 0.003 && !isShooting) { fireShootingStar(); }

    if (isOrbiting) {
        const elapsedTime = clock.getElapsedTime() * 0.1;
        skills.forEach(skill => {
            const speed = skill.radius === 9 ? 0.5 : -0.3;
            const angle = skill.angleOffset + (elapsedTime * speed);
            const p = new THREE.Vector3(
                skill.radius * Math.cos(angle),
                skill.radius * Math.sin(angle),
                0
            );
            p.applyEuler(skillHubContainer.rotation);
            skill.group.position.copy(p);
            skill.group.lookAt(camera.position);
        });
    } else {
        skills.forEach(skill => {
            skill.group.lookAt(camera.position);
        });
    }

    composer.render();
}
animate();