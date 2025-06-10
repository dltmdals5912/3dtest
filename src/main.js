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

// --- 씬, 카메라, 렌더러, 블룸 효과 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#app'), antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0));

// 글리치 효과 추가
const glitchPass = new GlitchPass();
composer.addPass(glitchPass);
glitchPass.enabled = false; // 평소엔 비활성화

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- 월드 오브젝트 선언 ---

// 배경 별들
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

// Act 1의 스파크
const spark = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true })
);
scene.add(spark);

// Act 2의 '좌표' 텍스트
const coordinatesText = new Text();
scene.add(coordinatesText);
coordinatesText.text = '[35.1796° N, 129.0756° E]';
coordinatesText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
coordinatesText.fontSize = 1.5;
coordinatesText.color = '#00BFFF'; // Electric Blue 계열
coordinatesText.anchorX = 'center';
coordinatesText.material.transparent = true;
coordinatesText.material.opacity = 0;
coordinatesText.sync();

// Act 3의 '데이터 파편' 파티클
const particleSystem = new THREE.Points(
    new THREE.TorusGeometry(8, 3, 16, 100), // 더 넓게 퍼지는 형태로 변경
    new THREE.PointsMaterial({ color: '#00BFFF', size: 0.05, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
);
scene.add(particleSystem);


// 별똥별 효과
const shootingStar = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0})
);
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

// Act 1: 서막 - 미지의 신호
tl.to(camera.position, { z: 10, duration: 8, ease: "power1.in" });
tl.to(spark.material, { size: 2.0, duration: 8 }, "<");

// Act 2: 데이터 파편 #1 - 기원 좌표
tl.to(spark.material, { opacity: 0, duration: 3, ease: "power2.out" });
tl.to(coordinatesText.material, { opacity: 1, duration: 10 }, "<");
tl.to(camera.position, { z: 22, duration: 12 }, "<");
tl.to(camera.rotation, { y: Math.PI / 10, duration: 12 }, "<");

// Act 2 -> 3 전환: 글리치 효과와 함께 파편화
tl.call(() => { glitchPass.enabled = true; });
tl.call(() => { glitchPass.enabled = false; }, "+=0.3");
tl.to(coordinatesText.material, { opacity: 0, duration: 0.1 }, "<");
tl.to(particleSystem.material, { opacity: 0.5, duration: 2 }, ">-0.2"); // 파티클 나타남

// Act 3: 데이터 파편 속 유영
tl.to(camera.position, {
    z: -20,
    duration: 15,
    ease: "power1.inOut"
});
tl.to(particleSystem.rotation, {
    y: Math.PI,
    duration: 15
}, "<");
tl.to(particleSystem.material, {
    opacity: 0,
    duration: 5
});


// --- 렌더링 루프 ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    if (Math.random() < 0.003 && !isShooting) {
        fireShootingStar();
    }
    composer.render();
}
animate();