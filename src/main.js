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

// --- 월드 오브젝트 선언 ---
function createStars(count, size, depth) {
    const vertices = [];
    for (let i = 0; i < count; i++) {
        vertices.push((Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xaaaaaa, size, transparent: true, opacity: 0.7 });
    return new THREE.Points(geometry, material);
}
scene.add(createStars(1500, 1.5, 1500));
scene.add(createStars(1000, 2.0, 1000));

const spark = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true })
);
scene.add(spark);

// 데이터 텍스트 오브젝트들
const coordinatesText = new Text();
scene.add(coordinatesText);
coordinatesText.text = '[35.1796° N, 129.0756° E]';
coordinatesText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
coordinatesText.fontSize = 1.5;
coordinatesText.color = 0xffffff;
coordinatesText.anchorX = 'center';
coordinatesText.material.transparent = true;
coordinatesText.material.opacity = 0;
coordinatesText.sync();

const uniqueIDText = new Text();
scene.add(uniqueIDText);
uniqueIDText.text = 'OBJECT LSM-2002';
uniqueIDText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
uniqueIDText.fontSize = 2;
uniqueIDText.color = 0xffffff;
uniqueIDText.anchorX = 'center';
uniqueIDText.material.transparent = true;
uniqueIDText.material.opacity = 0;
uniqueIDText.sync();

const coreComponentsText = new Text();
scene.add(coreComponentsText);
coreComponentsText.text = 'LOGIC | CREATIVITY | DIMENSION';
coreComponentsText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
coreComponentsText.fontSize = 1.8;
coreComponentsText.color = 0xffffff;
coreComponentsText.anchorX = 'center';
coreComponentsText.material.transparent = true;
coreComponentsText.material.opacity = 0;
coreComponentsText.sync();

const descriptionText = new Text();
coreComponentsText.add(descriptionText);
descriptionText.text = 'JavaScript, Algorithm | AI Art, Storytelling | 3D, Interactive Space';
descriptionText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
descriptionText.fontSize = 0.8;
descriptionText.color = 0xbbbbbb;
descriptionText.anchorX = 'center';
descriptionText.position.y = -1.5;
descriptionText.material.transparent = true;
descriptionText.material.opacity = 0;
descriptionText.sync();

// 스킬 허브 오브젝트들
const skillsGroup = new THREE.Group();
skillsGroup.visible = false;
scene.add(skillsGroup);

const skillHubRing = new THREE.Points(
    new THREE.TorusGeometry(10, 0.05, 32, 200),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0 })
);
skillHubRing.rotation.x = Math.PI / 2;
skillHubRing.scale.set(0, 0, 0);
skillsGroup.add(skillHubRing);

const textureLoader = new THREE.TextureLoader();
const ringRadius = 10;

function createSkill(logoUrl, angle, proficiency) {
    const group = new THREE.Group();
    group.position.set(ringRadius * Math.cos(angle), 0, ringRadius * Math.sin(angle));

    const iconMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(logoUrl), transparent: true, opacity: 0, side: THREE.DoubleSide });
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), iconMat);
    group.add(icon);

    const gaugeBgMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false });
    const gaugeBg = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.15), gaugeBgMat);
    gaugeBg.position.y = -1.3;
    group.add(gaugeBg);
    
    const gaugeMat = new THREE.MeshBasicMaterial({ color: '#00BFFF', transparent: true, opacity: 0, depthWrite: false });
    const gauge = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.15), gaugeMat);
    gauge.position.set(-1.25, -1.3, 0.01);
    gauge.scale.x = 0;
    gauge.geometry.translate(1.25, 0, 0);
    group.add(gauge);

    skillsGroup.add(group);
    return { group, icon, gaugeBg, gauge, proficiency };
}

const skills = [
    createSkill('https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png', Math.PI / 2, 0.9),
    createSkill('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Git-logo.svg/2048px-Git-logo.svg.png', -Math.PI / 6, 0.8),
    createSkill('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Adobe_Illustrator_CC_icon.svg/1051px-Adobe_Illustrator_CC_icon.svg.png', -5 * Math.PI / 6, 0.7)
];


// 별똥별 효과
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
    const zPos = Math.random() * -200;
    shootingStar.position.set(startX, startY, zPos);
    shootingStar.material.opacity = 1;
    gsap.to(shootingStar.position, {
        x: endX, y: endY, duration: Math.random() * 1.5 + 0.5, ease: 'power2.in',
        onComplete: () => { shootingStar.material.opacity = 0; isShooting = false; }
    });
}

// --- 애니메이션 타임라인 설정 ---
camera.position.z = 100;

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 2,
    }
});

// Act 1: 서막
tl.to(camera.position, { z: 10, duration: 10, ease: "power1.in" });
tl.to(spark.material, { size: 2.0, duration: 10 }, "<");

// Act 2: 데이터 종합 (수정된 Act 2, 이전의 Act 2,3,4,5를 합침)
tl.addLabel("synthesisStart");
tl.to(spark.material, { opacity: 0, duration: 3, ease: "power2.out" }, "synthesisStart");

// 1. 좌표 등장
tl.to(coordinatesText.material, { opacity: 1, duration: 5 }, "synthesisStart");
tl.to(camera.position, { z: 22, duration: 10 }, "synthesisStart");
tl.to({}, { duration: 5 }); 

// 2. 좌표 이동 & ID 코드 등장
tl.to(coordinatesText.position, { x: -12, y: 8, duration: 10, ease: "power2.inOut" });
tl.to(coordinatesText.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 10 }, "<");
tl.to(uniqueIDText.material, { opacity: 1, duration: 8 }, "<2");
tl.to({}, { duration: 5 });

// 3. ID 이동 & 핵심 구성요소 등장
tl.to(uniqueIDText.position, { x: 12, y: -8, duration: 10, ease: "power2.inOut" });
tl.to(uniqueIDText.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 10 }, "<");
tl.to(coreComponentsText.material, { opacity: 1, duration: 8 }, "<2");
tl.to(descriptionText.material, { opacity: 1, duration: 8 }, "<");

// 4. 모든 정보 조망
tl.to(camera.position, { x: 0, y: 0, z: 35, duration: 15, ease: "power2.out" });
tl.to(camera.rotation, { x: 0, y: 0, z: 0, duration: 15 }, "<");

// 5. 순차적 소멸
tl.addLabel("deconstructionStart", "+=8");
tl.to(coordinatesText.material, { opacity: 0, duration: 5 }, "deconstructionStart");
tl.to(uniqueIDText.material, { opacity: 0, duration: 5 }, "deconstructionStart+=2");
tl.to(coreComponentsText.material, { opacity: 0, duration: 5 }, "deconstructionStart+=4");
tl.to(descriptionText.material, { opacity: 0, duration: 5 }, "<");

// 6. 다음 Act를 위한 카메라 리셋
tl.to(camera.position, { z: 20, duration: 5 }, ">");

// Act 3: 스킬 허브의 탄생 (구. Act 4)
tl.addLabel("skillHubStart");
tl.to(spark.scale, { x: 5, y: 5, z: 5, duration: 4, ease: "power2.in" }, "skillHubStart");
tl.set(spark.material, { opacity: 1, size: 0.1 }, "skillHubStart");
tl.set(glitchPass, { enabled: true }, "+=1");
tl.set(glitchPass, { enabled: false }, "+=0.4");
tl.to(bloomPass, { strength: 4, duration: 0.2, yoyo: true, repeat: 1 }, "<");
tl.to(spark.material, { opacity: 0 }, "<");
tl.set(skillsGroup, { visible: true });
tl.to(skillHubRing.scale, { x: 1, y: 1, z: 1, duration: 5, ease: 'power3.out' }, ">-0.2");
tl.to(skillHubRing.material, { opacity: 1, duration: 5 }, "<");
tl.to(camera.position, { z: 25, duration: 5 }, "<");
tl.to(bloomPass, { strength: 1.5, duration: 3 });

skills.forEach((skill, index) => {
    const startTime = `>${index * 0.5}`;
    tl.to([skill.icon.material, skill.gaugeBg.material, skill.gauge.material], { opacity: 1, duration: 2 }, startTime);
    tl.to(skill.gauge.scale, { x: skill.proficiency, duration: 1.5, ease: 'expo.out' }, ">-0.5");
    tl.to(skill.icon.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2, yoyo: true, repeat: 1 }, "<1");
});

tl.to(camera.position, { z: 30, duration: 10 }, ">-5");
tl.to(skillsGroup.rotation, { y: Math.PI / 2, duration: 25 }, "<");


// --- 렌더링 루프 ---
function animate() {
    requestAnimationFrame(animate);
    if (Math.random() < 0.003 && !isShooting) {
        fireShootingStar();
    }
    // 각 스킬 그룹(아이콘+게이지)이 항상 카메라를 보도록
    skillsGroup.children.forEach(child => {
        if (child.isGroup) {
            child.lookAt(camera.position);
        }
    });
    composer.render();
}
animate();