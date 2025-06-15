// 📁 src/modules/setupProjects.js

import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { vShader, fShader } from '../shaders/imageShader.js';

import projectAuraImg from '/src/assets/project-aura.png';
import projectOdysseyImg from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';

const texLoader = new THREE.TextureLoader();

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
    return t;
};

const mkShaderMat = (img, renderer) => {
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const loadedTex = texLoader.load(img);
    loadedTex.anisotropy = maxAniso;
    return new THREE.ShaderMaterial({
        uniforms: {
            u_texture: { value: loadedTex },
            u_radius: { value: .05 },
            u_brightness_clamp: { value: .65 },
            u_opacity: { value: 0 }
        },
        vertexShader: vShader,
        fragmentShader: fShader,
        transparent: true
    });
};

export function setupProjects(scene, renderer) {
    const projectsGrp = new THREE.Group();
    scene.add(projectsGrp);

    const projectsData = [
        {
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
        }
    ];

    // ✅ [핵심 1] 생성된 3D 그룹을 담을 빈 배열을 선언합니다.
    const projectGroups = [];

    projectsData.forEach((p, i) => {
        const g = new THREE.Group();
        g.visible = false;
        g.position.z = -100 * (i + 1);
        const thumb = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), mkShaderMat(p.img, renderer));
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
        
        // ✅ [핵심 2] 생성된 3D 그룹(g)을 배열에 추가합니다.
        projectGroups.push(g);
    });
    
    // ✅ [핵심 3] 반환(return)하는 객체에 `projectGroups` 배열이 포함되도록 합니다.
    return { projectsGrp, projectGroups };
}