import * as THREE from 'three';
import { gsap } from 'gsap';
import { Text } from 'troika-three-text';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Asset imports
import cssIcon from '/src/assets/tech/css.png';
import htmlIcon from '/src/assets/tech/html.png';
import jsIcon from '/src/assets/tech/js.png';
import nodeIcon from '/src/assets/tech/node.png';
import reactIcon from '/src/assets/tech/react.png';
import threeIcon from '/src/assets/tech/three.png';

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

export function setupPlanet(scene, renderer, camera) {
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
      opacity: 0.2, // ✨ [수정] 밝기 재조절 (0.4 -> 0.2)
      blending: THREE.AdditiveBlending, // ✨ [수정] 다시 AdditiveBlending으로 복원
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
            points.push(radius * Math.cos(angle), radius * Math.sin(angle), 0);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const material = new THREE.PointsMaterial({
            color: RING_COLOR,
            size: 0.15,
            transparent: true,
            opacity: 0.15, // ✨ [수정] 밝기 재조절 (0.35 -> 0.15)
            blending: THREE.AdditiveBlending, // ✨ [수정] 다시 AdditiveBlending으로 복원
            depthWrite: false
        });
        ringMats.push(material);
        return new THREE.Points(geometry, material);
    };
    const makePivot = (ring, tx, ty) => { const g = new THREE.Group(); g.rotation.set(tx, ty, 0); g.add(ring); planetGrp.add(g); return g; };
    const ring1 = makeParticleRing(10, 2000), ring2 = makeParticleRing(12.5, 2500), ring3 = makeParticleRing(15, 3000);
    const pivot1 = makePivot(ring1, 0, 0), pivot2 = makePivot(ring2, THREE.MathUtils.degToRad(30), 0), pivot3 = makePivot(ring3, 0, THREE.MathUtils.degToRad(45));

    const techSkillsGroup = new THREE.Group();
    techSkillsGroup.position.set(-23, 0, 0);
    planetGrp.add(techSkillsGroup);

    const iconImgs = [reactIcon, threeIcon, jsIcon, cssIcon, nodeIcon, htmlIcon];
    const techNames = ['React', 'Three.js', 'JavaScript', 'CSS', 'Node.js', 'HTML'];
    const skills = [90, 80, 76, 70, 60, 50];
    const iconMats = [], gaugeMats = [], gaugeFills = [], interactiveIcons = [], gaugeTextMats = [], gaugeTexts = [];
    const ringInnerRadius = 1.4, ringOuterRadius = 1.7;
    const tooltipText = makeText('', 0.7, 0xffffff);
    tooltipText.visible = false;
    tooltipText.renderOrder = 99;
    planetGrp.add(tooltipText);

    for (let i = 0; i < 6; i++) {
        const y = (2.5 - i) * 5;
        const iconTexture = texLoader.load(iconImgs[i]);
        const mat = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.4, metalness: 0.8, emissive: 0xffffff, emissiveMap: iconTexture, emissiveIntensity: 0.8, alphaMap: iconTexture, transparent: true, opacity: 0 });
        iconMats.push(mat);
        const card = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.3), mat);
        card.position.set(0, y, 0);
        card.userData = { name: techNames[i], skill: skills[i] };
        techSkillsGroup.add(card);
        interactiveIcons.push(card);
        const bgGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
        const bgMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0 });
        gaugeMats.push(bgMat);
        const gaugeBg = new THREE.Mesh(bgGeo, bgMat);
        gaugeBg.position.set(5.5, y, 0);
        techSkillsGroup.add(gaugeBg);
        const fillGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64, 1, -Math.PI / 2, 0);
        const fillMat = new THREE.MeshBasicMaterial({ color: 0x00c0ff, transparent: true, opacity: 0 });
        gaugeMats.push(fillMat);
        const gaugeFill = new THREE.Mesh(fillGeo, fillMat);
        gaugeFill.position.set(5.5, y, 0.01);
        techSkillsGroup.add(gaugeFill);
        const tPercent = makeText(`${skills[i]}%`, 0.9, 0xffffff);
        tPercent.anchorX = 'center';
        tPercent.anchorY = 'middle';
        tPercent.position.set(5.5, y, 0.02);
        tPercent.material.opacity = 0;
        techSkillsGroup.add(tPercent);
        gaugeTextMats.push(tPercent.material);
        gaugeTexts.push(tPercent);
        gaugeFills.push({ mesh: gaugeFill, targetAngle: (skills[i] / 100) * Math.PI * 2 });
        gsap.to(card.position, { y: card.position.y + 0.5, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: Math.random() * 2 });
    }

    const reactNativeText = makeText('React Native', 2, 0x61dafb);
    reactNativeText.anchorX = 'center';
    reactNativeText.visible = false;
    scene.add(reactNativeText);

    return {
        planetGrp, particleSphere, particleSphereMat, ringMats, pivot1, pivot2, pivot3,
        ring1, ring2, ring3,
        iconMats, gaugeMats, gaugeTextMats, gaugeFills, ringInnerRadius, ringOuterRadius,
        interactiveIcons, tooltipText, reactNativeText, gaugeTexts, techSkillsGroup,
    };
}

let hoveredIcon = null;
const raycaster = new THREE.Raycaster();
export function checkPlanetInteraction(elements, mousePos, camera) {
    const { interactiveIcons, tooltipText } = elements;
    raycaster.setFromCamera(mousePos, camera);
    const intersects = raycaster.intersectObjects(interactiveIcons);
    const newlyHoveredIcon = intersects.length > 0 ? intersects[0].object : null;

    if (newlyHoveredIcon !== hoveredIcon) {
        if (hoveredIcon) {
            gsap.to(hoveredIcon.material, { emissiveIntensity: 0.8, duration: 0.3 });
        }
        if (newlyHoveredIcon) {
            gsap.to(newlyHoveredIcon.material, { emissiveIntensity: 1.2, duration: 0.3 });
            gsap.killTweensOf(tooltipText.material);
            const { name, skill } = newlyHoveredIcon.userData;
            tooltipText.text = `${name} - ${skill}%`;
            tooltipText.visible = true;
            tooltipText.sync(() => {
                const iconWorldPos = new THREE.Vector3();
                newlyHoveredIcon.getWorldPosition(iconWorldPos);
                tooltipText.position.copy(iconWorldPos).add(new THREE.Vector3(0, -2.5, 0));
                tooltipText.lookAt(camera.position);
                gsap.to(tooltipText.material, { opacity: 1, duration: 0.4 });
            });
        } else {
            gsap.killTweensOf(tooltipText.material);
            gsap.to(tooltipText.material, { opacity: 0, duration: 0.2, onComplete: () => { tooltipText.visible = false; } });
        }
        hoveredIcon = newlyHoveredIcon;
    }
}

export function animatePlanet(elements, t, camera) {
    const {
        particleSphere, pivot1, ring1, pivot2, ring2, pivot3, ring3,
        techSkillsGroup, tooltipText, reactNativeText, gaugeTexts
    } = elements;

    const timeline = ScrollTrigger.getById('mainTimeline')?.animation;
    let isBeforeReactFinale = true;

    if (timeline) {
        const reactFinaleTime = timeline.labels.reactFinale;
        if (reactFinaleTime !== undefined) {
            isBeforeReactFinale = timeline.time() < reactFinaleTime;
        }
    }

    if (isBeforeReactFinale) {
        const s = 1 + Math.sin(t * 0.5) * 0.08;
        particleSphere.scale.set(s, s, s);
        particleSphere.rotation.y += 0.0018;
        particleSphere.rotation.x += 0.0009;
        pivot1.rotation.z += 0.0008; ring1.rotation.y += 0.002;
        pivot2.rotation.z -= 0.0006; ring2.rotation.x += 0.002;
        pivot3.rotation.z += 0.0004; ring3.rotation.y += 0.0015;
    }

    techSkillsGroup.children.forEach(o => { if (o.isMesh) o.lookAt(camera.position); });
    if (tooltipText.visible) tooltipText.lookAt(camera.position);
    if (reactNativeText.visible) reactNativeText.lookAt(camera.position);
    gaugeTexts.forEach(g => g.lookAt(camera.position));
}