// 📁 src/modules/setupProfile.js

import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { vShader, fShader } from '../shaders/imageShader.js';
import profileImg from '/src/assets/profile.png';

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

export function setupProfile(scene, renderer) {
    const profileGrp = new THREE.Group();
    profileGrp.visible = false;
    scene.add(profileGrp);

    const profilePlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mkShaderMat(profileImg, renderer));
    profilePlane.position.set(-26, -1.2, -10);

    const vLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 7, -10), new THREE.Vector3(0, -7, -10)]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );
    vLine.position.set(-8, 0, -10);

    const pTitle = makeText('Creative Developer 이승민', 1.8);
    const pSlogan = makeText('복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.', 1, 0xcccccc);
    pSlogan.lineHeight = 2.2;
    const emailL = makeText('E-mail:', 0.9);
    const emailV = makeText('rlaxodud5877@naver.com', 0.9, 0xcccccc);
    const gitL = makeText('GitHub:', 0.9);
    const gitV = makeText('github.com/dltmdals5912', 0.9, 0xcccccc);
    
    // HUD 텍스트 (인트로용)
    const coordTxt = makeText('[35.1796° N, 129.0756° E]', 1.5);
    coordTxt.anchorX = 'center';
    const idTxt = makeText('OBJECT LSM-2002', 2.5);
    idTxt.anchorX = 'center';
    const coreTxt = makeText('LOGIC | CREATIVITY | DIMENSION', 1.5);
    coreTxt.anchorX = 'center';
    const accessTxt = makeText('SYSTEM ACCESS: COMPLETE', 2);
    accessTxt.anchorX = 'center';
    
    scene.add(coordTxt, idTxt, coreTxt, accessTxt);

    const profileNodes = [pTitle, pSlogan, emailL, emailV, gitL, gitV];
    const profileMats = profileNodes.map(n => n.material);
    profileGrp.add(profilePlane, vLine, ...profileNodes);

    // ✅ [수정] layoutProfile 함수에 필요한 모든 텍스트 변수를 반환 객체에 추가합니다.
    return {
        profileGrp,
        profilePlane,
        vLine,
        profileNodes,
        profileMats,
        pTitle,     // <--- 추가
        pSlogan,
        emailL,     // <--- 추가
        emailV,     // <--- 추가
        gitL,       // <--- 추가
        gitV,       // <--- 추가
        coordTxt,   // HUD 텍스트도 함께 반환
        idTxt,
        coreTxt,
        accessTxt
    };
}

export function layoutProfile(elements) {
    const { pTitle, pSlogan, emailL, emailV, gitL, gitV } = elements;
    const sx = -1, gx = 6, gy = 1;
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