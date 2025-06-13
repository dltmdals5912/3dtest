// --- 라이브러리 임포트 ---
import * as THREE from 'three';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { Text } from 'troika-three-text';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- 이미지 에셋 임포트 ---
import profileImg from '/src/assets/profile.png';
import projectAuraImg from '/src/assets/project-aura.png';
import projectOdysseyImg from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';

gsap.registerPlugin(ScrollTrigger);

// --- 씬, 카메라, 렌더러, 포스트 프로세싱 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#app'), antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.4, 0.85);
composer.addPass(bloomPass);

const CustomGlitchShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'u_time': { value: 0 },
        'u_amount': { value: 0 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float u_time;
        uniform float u_amount;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            vec4 originalColor = texture2D(tDiffuse, uv);
            if (u_amount > 0.0) {
                float vScan = sin(uv.y * 400.0 + u_time * 15.0) * 0.03;
                vec4 r = texture2D(tDiffuse, uv + vec2(0.01 * u_amount, 0.0));
                vec4 g = texture2D(tDiffuse, uv - vec2(0.005 * u_amount, 0.0));
                originalColor.r = mix(originalColor.r, r.r, u_amount);
                originalColor.g = mix(originalColor.g, g.g, u_amount);
                originalColor.rgb += vScan * u_amount;
            }
            gl_FragColor = originalColor;
        }
    `
};
const customGlitchPass = new ShaderPass(CustomGlitchShader);
composer.addPass(customGlitchPass);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- 텍스처 로더 및 화질 개선 헬퍼 함수 ---
const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
function loadTextureWithAnisotropy(url) {
    if (!url) return null;
    const texture = textureLoader.load(url);
    texture.anisotropy = maxAnisotropy;
    return texture;
}

// --- 셰이더 코드 정의 ---
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const fragmentShader = `
    uniform sampler2D u_texture;
    uniform float u_radius;
    uniform float u_brightness_clamp;
    uniform float u_opacity;
    varying vec2 vUv;
    float roundSDF(vec2 p, vec2 b, float r) { return length(max(abs(p) - b, 0.0)) - r; }
    void main() {
        vec4 texColor = texture2D(u_texture, vUv);
        texColor.rgb = min(texColor.rgb, vec3(u_brightness_clamp));
        vec2 halfRes = vec2(0.5, 0.5);
        float sdf = roundSDF(vUv - halfRes, halfRes - u_radius, u_radius);
        float cornerAlpha = 1.0 - smoothstep(0.0, 0.005, sdf);
        gl_FragColor = vec4(texColor.rgb, texColor.a * cornerAlpha * u_opacity);
    }
`;

// --- 월드 오브젝트 선언 ---
scene.add(createStars(1500, 1.5, 1500));
function createStars(count, size, depth) { const vertices = []; for (let i = 0; i < count; i++) { vertices.push((Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth, (Math.random() - 0.5) * depth ); } const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); const material = new THREE.PointsMaterial({ color: 0xaaaaaa, size, transparent: true, opacity: 0.7 }); return new THREE.Points(geometry, material); }

const shootingStar = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0}));
scene.add(shootingStar);
let isShooting = false;
function fireShootingStar() {
    if (isShooting) return;
    isShooting = true;
    const startX = Math.random() * 200 - 100; const startY = 100;
    const endX = Math.random() * 200 - 100; const endY = -100;
    const zPos = Math.random() * -400 - 100;
    shootingStar.position.set(startX, startY, zPos);
    shootingStar.material.opacity = 1;
    gsap.to(shootingStar.position, { x: endX, y: endY, duration: Math.random() * 1.5 + 0.5, ease: 'power2.in', onComplete: () => { shootingStar.material.opacity = 0; isShooting = false; } });
}

const twinkleGroup = new THREE.Group();
const twinkleTexture = loadTextureWithAnisotropy('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
for (let i = 0; i < 150; i++) {
    const twinkleMat = new THREE.MeshBasicMaterial({ map: twinkleTexture, color: 0xffffff, transparent: true, opacity: Math.random() * 0.5, blending: THREE.AdditiveBlending, depthWrite: false, });
    const twinkle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), twinkleMat);
    const R = 300; const r = R * Math.sqrt(Math.random()); const theta = Math.random() * 2 * Math.PI;
    const x = r * Math.cos(theta); const y = r * Math.sin(theta); const z = (Math.random() - 0.5) * R;
    twinkle.position.set(x, y, z);
    twinkle.isTwinkling = false;
    twinkleGroup.add(twinkle);
}
scene.add(twinkleGroup);

// --- 인트로 & 프로필 & 프로젝트 관련 오브젝트 ---
const initialScreen = document.querySelector('#initial-screen');
const spark = new THREE.Points( new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, blending: THREE.AdditiveBlending, transparent: true, opacity: 0 }));
scene.add(spark);

const coordinatesText = new Text(); scene.add(coordinatesText); coordinatesText.text = '[35.1796° N, 129.0756° E]'; coordinatesText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coordinatesText.fontSize = 1.5; coordinatesText.color = 0xffffff; coordinatesText.anchorX = 'center'; coordinatesText.material.transparent = true; coordinatesText.material.opacity = 0; coordinatesText.sync();
const uniqueIDText = new Text(); scene.add(uniqueIDText); uniqueIDText.text = 'OBJECT LSM-2002'; uniqueIDText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; uniqueIDText.fontSize = 2.5; uniqueIDText.color = 0xffffff; uniqueIDText.anchorX = 'center'; uniqueIDText.material.transparent = true; uniqueIDText.material.opacity = 0; uniqueIDText.sync();
const coreComponentsText = new Text(); scene.add(coreComponentsText); coreComponentsText.text = 'LOGIC | CREATIVITY | DIMENSION'; coreComponentsText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; coreComponentsText.fontSize = 1.5; coreComponentsText.color = 0xffffff; coreComponentsText.anchorX = 'center'; coreComponentsText.material.transparent = true; coreComponentsText.material.opacity = 0; coreComponentsText.sync();
const accessCompleteText = new Text(); scene.add(accessCompleteText); accessCompleteText.text = 'SYSTEM ACCESS: COMPLETE'; accessCompleteText.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; accessCompleteText.fontSize = 2; accessCompleteText.color = 0xffffff; accessCompleteText.anchorX = 'center'; accessCompleteText.material.transparent = true; accessCompleteText.material.opacity = 0; accessCompleteText.sync();
const profileGroup = new THREE.Group();
const profileTitle = new Text(); profileTitle.text = 'Creative Developer 이승민'; profileTitle.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; profileTitle.fontSize = 2.2; profileTitle.color = 0xffffff; profileTitle.anchorX = 'left'; profileTitle.material.transparent = true; profileTitle.material.opacity = 0; profileTitle.sync();
const profileSlogan = new Text(); profileSlogan.text = '복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.'; profileSlogan.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; profileSlogan.fontSize = 1; profileSlogan.color = 0xcccccc; profileSlogan.anchorX = 'left'; profileSlogan.lineHeight = 1.5; profileSlogan.material.transparent = true; profileSlogan.material.opacity = 0; profileSlogan.sync();
const emailLabel = new Text(); emailLabel.text = 'E-mail:'; emailLabel.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; emailLabel.fontSize = 0.9; emailLabel.color = 0xffffff; emailLabel.anchorX = 'left'; emailLabel.material.transparent = true; emailLabel.material.opacity = 0; emailLabel.sync();
const emailValue = new Text(); emailValue.text = ' rlaxodud5877@naver.com'; emailValue.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; emailValue.fontSize = 0.9; emailValue.color = 0xcccccc; emailValue.anchorX = 'left'; emailValue.material.transparent = true; emailValue.material.opacity = 0; emailValue.sync();
const githubLabel = new Text(); githubLabel.text = 'GitHub:'; githubLabel.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; githubLabel.fontSize = 0.9; githubLabel.color = 0xffffff; githubLabel.anchorX = 'left'; githubLabel.material.transparent = true; githubLabel.material.opacity = 0; githubLabel.sync();
const githubValue = new Text(); githubValue.text = ' github.com/dltmdals5912'; githubValue.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; githubValue.fontSize = 0.9; githubValue.color = 0xcccccc; githubValue.anchorX = 'left'; githubValue.material.transparent = true; githubValue.material.opacity = 0; githubValue.sync();
const profileImageMat = new THREE.ShaderMaterial({ uniforms: { u_texture: { value: loadTextureWithAnisotropy(profileImg) }, u_radius: { value: 0.05 }, u_brightness_clamp: { value: 0.9 }, u_opacity: { value: 0 } }, vertexShader, fragmentShader, transparent: true });
const profileImage = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), profileImageMat);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
const verticalLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 8, 0), new THREE.Vector3(0, -8, 0)]), lineMaterial.clone());
profileGroup.add(profileTitle, profileSlogan, emailLabel, emailValue, githubLabel, githubValue, profileImage, verticalLine);
profileGroup.visible = false;
scene.add(profileGroup);

const projectsGroup = new THREE.Group();
const projectsData = [
    { title: "AURA: Generative Data Sculpture", role: "Lead Developer & Creative Technologist", description: "소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품...", tech: "Three.js, GSAP, Socket.IO, Python, AWS", imageUrl: projectAuraImg },
    { title: "Project: ODYSSEY", role: "Lead 3D Developer & Narrative Designer", description: "소행성 '2025-ODYSSEY'에 착륙한 탐사 로버의 로그를 따라가는 인터랙티브 3D 웹 스토리텔링...", tech: "Three.js, Blender, GSAP, GLSL", imageUrl: projectOdysseyImg },
    { title: "FlowField: Real-time Audio-Reactive Art", role: "Sole Developer & Artist", description: "Web Audio API를 통해 실시간으로 사운드를 분석하고, 그 주파수와 비트 데이터를 GLSL 셰이더로 전달하여 유기적인 비주얼을 생성하는 미디어 아트...", tech: "TypeScript, p5.js, Web Audio API, GLSL, Vite", imageUrl: projectFlowfieldImg }
];

projectsData.forEach((project, i) => {
    const projectGroup = new THREE.Group();
    projectGroup.userData.shaderMaterials = [];
    projectGroup.userData.troikaMaterials = [];
    const imageMat = new THREE.ShaderMaterial({ uniforms: { u_texture: { value: loadTextureWithAnisotropy(project.imageUrl) }, u_radius: { value: 0.05 }, u_brightness_clamp: { value: 0.9 }, u_opacity: { value: 0 } }, vertexShader, fragmentShader, transparent: true });
    const imageMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), imageMat);
    imageMesh.position.set(-18, 1, 0);
    projectGroup.userData.shaderMaterials.push(imageMat.uniforms);
    const title = new Text(); title.text = project.title; title.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; title.fontSize = 2; title.color = 0xffffff; title.anchorX = 'left'; title.position.set(0, 6.5, 0); title.material.transparent = true; title.material.opacity = 0; title.sync();
    projectGroup.userData.troikaMaterials.push(title.material);
    const role = new Text(); role.text = project.role; role.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; role.fontSize = 1; role.color = 0x00BFFF; role.anchorX = 'left'; role.position.set(0, 4, 0); role.material.transparent = true; role.material.opacity = 0; role.sync();
    projectGroup.userData.troikaMaterials.push(role.material);
    const desc = new Text(); desc.text = project.description; desc.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; desc.fontSize = 1; desc.color = 0xcccccc; desc.anchorX = 'left'; desc.position.set(0, 0.5, 0); desc.maxWidth = 20; desc.lineHeight = 1.5; desc.material.transparent = true; desc.material.opacity = 0;
    projectGroup.userData.troikaMaterials.push(desc.material);
    const techLabel = new Text(); techLabel.text = 'Tech:'; techLabel.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Bold.woff'; techLabel.fontSize = 1; techLabel.color = 0xffffff; techLabel.anchorX = 'left'; techLabel.material.transparent = true; techLabel.material.opacity = 0;
    projectGroup.userData.troikaMaterials.push(techLabel.material);
    const techValue = new Text(); techValue.text = project.tech; techValue.font = 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff'; techValue.fontSize = 0.9; techValue.color = 0xcccccc; techValue.anchorX = 'left'; techValue.maxWidth = 20; techValue.lineHeight = 1.5; techValue.material.transparent = true; techValue.material.opacity = 0;
    projectGroup.userData.troikaMaterials.push(techValue.material);
    desc.sync(() => {
        const descBbox = desc.geometry.boundingBox;
        const descHeight = descBbox ? descBbox.max.y - descBbox.min.y : 0;
        techLabel.position.y = desc.position.y - descHeight - 1.5;
        techValue.position.y = techLabel.position.y - 1.2;
    });
    projectGroup.add(imageMesh, title, role, desc, techLabel, techValue);
    projectGroup.visible = false;
    projectGroup.position.z = -100 * (i + 1);
    projectsGroup.add(projectGroup);
});
scene.add(projectsGroup);

// --- 애니메이션 타임라인 설정 ---
camera.position.z = 100;
document.querySelector('#scroll-container').style.height = '2800vh';
const tl = gsap.timeline({ scrollTrigger: { trigger: "#scroll-container", start: "top top", end: "bottom bottom", scrub: 2 } });

// --- [THE FIX] Act 0: 연출 순서 및 노이즈 효과 강화 ---
// 1. 스크롤 시작과 동시에 카메라가 점을 향해 줌인합니다.
tl.to(camera.position, { z: 10, duration: 15, ease: "power1.inOut" });

// 2. 카메라가 움직이는 동안, 첫 화면이 사라지며 노이즈가 발생합니다.
tl.to(initialScreen, { opacity: 0, duration: 8, ease: "power2.out" }, "<+2");
// "파지직..." 효과를 위해 u_amount 값을 직접 애니메이션합니다.
tl.to(customGlitchPass.uniforms.u_amount, { value: 0.3, duration: 0.1, ease: 'steps(1)' }, "<+3");
tl.to(customGlitchPass.uniforms.u_amount, { value: 0, duration: 0.1, ease: 'steps(1)' }, ">");
tl.to(customGlitchPass.uniforms.u_amount, { value: 0.6, duration: 0.2, ease: 'steps(1)' }, ">+0.5");
tl.to(customGlitchPass.uniforms.u_amount, { value: 0, duration: 0.1, ease: 'steps(1)' }, ">");
tl.to(customGlitchPass.uniforms.u_amount, { value: 1.0, duration: 0.4, ease: 'power2.inOut' }, ">+0.8");
tl.to(customGlitchPass.uniforms.u_amount, { value: 0, duration: 0.5 }); // 노이즈 효과 종료
tl.set(initialScreen, { display: 'none' });


// --- [THE FIX] Act 1: 점 애니메이션은 노이즈가 모두 끝난 후에 시작됩니다. ---
tl.to(spark.material, { size: 2.0, duration: 10 }, "<"); // 카메라는 계속 줌인하는 것처럼 보이지만, 실제로는 이미 도착
tl.to(spark.material, { opacity: 0, duration: 3, ease: "power2.out" });

// --- Act 2: 카메라 구도 설정 및 텍스트 등장 ---
tl.to({}, {duration: 5});
tl.addLabel("setupView");
tl.to(camera.position, { z: 40, duration: 10 }, "setupView");
tl.to({}, {duration: 5});
tl.addLabel("textsAppear", ">");
tl.set(coordinatesText.position, { x: -28, y: 0, z: 0 });
tl.set(uniqueIDText.position, { x: 0, y: 0, z: 0 });
tl.set(coreComponentsText.position, { x: 28, y: 0, z: 0 });
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
tl.set(profileGroup, {visible: true});
verticalLine.position.set(-7, 0, 0);
profileImage.position.set(-15, 0, 0);
profileTitle.position.set(-1, 4, 0);
profileSlogan.position.set(-1, 0.5, 0);
emailLabel.position.set(-1, -3, 0);
emailValue.position.set(emailLabel.position.x + 3.5, -3, 0);
githubLabel.position.set(-1, -4.5, 0);
githubValue.position.set(githubLabel.position.x + 4.2, -4.5, 0);
const profileTextMaterials = [profileTitle.material, profileSlogan.material, emailLabel.material, emailValue.material, githubLabel.material, githubValue.material];
tl.from(verticalLine.scale, { y: 0, duration: 5, ease: 'power2.out' }, "constructProfile+=1");
tl.to(verticalLine.material, { opacity: 0.3, duration: 5 }, "<");
tl.to(profileImage.material.uniforms.u_opacity, { value: 1, duration: 8 }, "constructProfile+=2");
tl.to(profileTextMaterials, { opacity: 1, duration: 5, stagger: 0.5 }, "constructProfile+=4");
tl.to(verticalLine.material, { opacity: 0, duration: 5 }, ">");
tl.to({}, {duration: 15});

// --- Act 5: 프로젝트 섹션으로 전환 및 탐색 ---
tl.addLabel("transitionToProjects");
const profileElementsToFade = [...profileTextMaterials, verticalLine.material];
tl.to(profileElementsToFade, { opacity: 0, duration: 4, ease: 'power2.out' }, "transitionToProjects");
tl.to(profileImage.material.uniforms.u_opacity, { value: 0, duration: 4, ease: 'power2.out' }, "<");

projectsGroup.children.forEach((projectGroup, i) => {
    const viewingPosition = projectGroup.position.z + 30;
    const cameraMoveTween = tl.to(camera.position, { x: 0, y: 0, z: viewingPosition, duration: 15, ease: 'power2.inOut' });
    tl.set(projectGroup, { visible: true }, ">"); 
    
    const shaderUniforms = projectGroup.userData.shaderMaterials;
    const regularMaterials = projectGroup.userData.troikaMaterials;
    
    const revealStartTime = cameraMoveTween.endTime();
    tl.to(shaderUniforms, { value: 1, duration: 8, stagger: 0.2 }, revealStartTime);
    tl.to(regularMaterials, { opacity: 1, duration: 8, stagger: 0.2 }, "<");
    
    tl.to({}, { duration: 20 }); 

    if (i < projectsGroup.children.length - 1) {
        tl.to(shaderUniforms, { value: 0, duration: 8, stagger: 0.05 });
        tl.to(regularMaterials, { opacity: 0, duration: 8, stagger: 0.05 }, "<");
        tl.set(projectGroup, { visible: false }, ">");
    }
});

// --- 렌더링 루프 ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    customGlitchPass.uniforms.u_time.value = elapsedTime;

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