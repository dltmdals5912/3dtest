import * as THREE from 'three';
import { vParticleShader, fParticleShader } from '../shaders/particleShader.js';
import { vGalaxyShader, fGalaxyShader } from '../shaders/galaxyShader.js';

export function setupFinale(scene) {
    const finaleGrp = new THREE.Group();
    finaleGrp.visible = false;
    scene.add(finaleGrp);

    // Force-field
    const FF = 30000;
    const ffArr = new Float32Array(FF * 3);
    for (let i = 0; i < FF; i++) ffArr.set([(Math.random() - .5) * 100, (Math.random() - .5) * 100, (Math.random() - .5) * 100], i * 3);
    const ffGeom = new THREE.BufferGeometry();
    ffGeom.setAttribute('position', new THREE.BufferAttribute(ffArr, 3));
    const ffMat = new THREE.ShaderMaterial({
        uniforms: {
            u_time: { value: 0 },
            u_mouse: { value: new THREE.Vector2(10000, 10000) },
            u_force_strength: { value: 0 },
            u_opacity: { value: 0 }
        },
        vertexShader: vParticleShader,
        fragmentShader: fParticleShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const forceField = new THREE.Points(ffGeom, ffMat);
    finaleGrp.add(forceField);

    // Galaxy
    const GAL = 250000;
    const galArr = new Float32Array(GAL * 3);
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
            u_time: { value: 0 },
            u_mouse: { value: new THREE.Vector2() },
            u_progress: { value: 0 }
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

    return { finaleGrp, ffMat, galMat, galaxy };
}

export function animateFinale(elements, t, mousePos, camera) {
    const { finaleGrp, ffMat, galMat } = elements;

    ffMat.uniforms.u_time.value = t;
    const v = new THREE.Vector3(mousePos.x, mousePos.y, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const dist = (finaleGrp.position.z - camera.position.z) / dir.z;
    const p = camera.position.clone().add(dir.multiplyScalar(dist));
    ffMat.uniforms.u_mouse.value.set(p.x, p.y);
    galMat.uniforms.u_time.value = t * 0.5;
    galMat.uniforms.u_mouse.value.set(p.x * 0.3, p.y * 0.3);
}
