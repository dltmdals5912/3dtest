import { gsap } from 'gsap';
import * as THREE from 'three';

// 헬퍼 함수
const placeInFront = (obj, dist, camera) => {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  obj.position.copy(camera.position).add(dir.multiplyScalar(dist));
};

export function createTimeline(elements) {
  const {
    camera, bloomPass, glitchPass, scrollContainer, initialScreen,
    spark, coordTxt, idTxt, coreTxt, accessTxt,
    profileGrp, profileMats, profilePlane, vLine, profileNodes,
    projectsGrp,
    finaleGrp, ffMat, galMat, galaxy,
    planetGrp, particleSphere, particleSphereMat, ringMats, pivot1, pivot2, pivot3, ring1, ring2, ring3,
    iconMats, gaugeMats, gaugeTextMats, gaugeFills, ringInnerRadius, ringOuterRadius,
    reactNativeText,
    bigBangGrp, bangMat,
    allTextNodes, tooltipText
  } = elements;

  scrollContainer.style.height = '15000vh';

  const tl = gsap.timeline({
    scrollTrigger: {
      id: 'mainTimeline',
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2
    }
  });

  const hideAll = () => {
    allTextNodes.forEach(n => {
      if (n !== tooltipText && n !== reactNativeText) n.visible = false;
    });
  };

  /* Act 0-9 (기존과 동일) */
  tl.to(initialScreen, { opacity: 0, duration: 10 });
  tl.set(glitchPass, { enabled: true, goWild: false }, '<+4')
    .set(glitchPass, { enabled: false }, '>.2')
    .set(glitchPass, { enabled: true, goWild: true }, '>.5')
    .set(glitchPass, { enabled: false }, '>.4')
    .set(initialScreen, { display: 'none' });
  tl.addLabel('sparkStart').to(spark.material, { opacity: 1, size: 0.4, duration: 0.5 }, 'sparkStart').to(camera.position, { z: 30, duration: 8, ease: 'power2.inOut' }, 'sparkStart').to(spark.position, { z: 12, duration: 8, ease: 'power2.inOut' }, 'sparkStart').to(spark.material, { size: 0.9, duration: 8, ease: 'power2.inOut' }, 'sparkStart').to(spark.material, { opacity: 0, size: 0.4, duration: 1.8, ease: 'sine.in' }, 'sparkStart+=6.5').set(spark, { visible: false }, 'sparkStart+=8');
  coordTxt.position.set(-28, 0, -8); idTxt.position.set(0, 0, -8); coreTxt.position.set(28, 0, -8);
  tl.addLabel('hud').to([coordTxt.material, idTxt.material, coreTxt.material], { opacity: 1, duration: 8, stagger: 0.5 }, 'hud').to({}, { duration: 10 });
  tl.addLabel('merge').to([coordTxt.position, idTxt.position, coreTxt.position], { x: 0, duration: 8, ease: 'power2.in' }, 'merge').to([coordTxt.material, idTxt.material, coreTxt.material], { opacity: 0, duration: 5, ease: 'power2.out' }, 'merge+=0.2').to(accessTxt.material, { opacity: 1, duration: 3 }, '>-2').to(accessTxt.position, { z: -8 }, '<').to({}, { duration: 8 });
  tl.addLabel('profile').to(accessTxt.material, { opacity: 0, duration: 3 }, 'profile'); profileGrp.visible = true;
  tl.to(camera.position, { x: -7, duration: 6, ease: 'power2.inOut' }, 'profile').from(vLine.scale, { y: 0, duration: 5, ease: 'power2.out' }, 'profile+=1').to(vLine.material, { opacity: 0.35, duration: 5 }, '<').to(profilePlane.material.uniforms.u_opacity, { value: 1, duration: 8 }, 'profile+=2');
  profileNodes.forEach((n, i) => { const t = `profile+=${1+i*0.15-(i>2?0.15:0)}`; tl.from(n.position, { x: n.position.x + 40, duration: 6, ease: 'power3.out' }, t).to(n.material, { opacity: 1, duration: 6, ease: 'power3.out' }, t); });
  tl.to(vLine.material, { opacity: 0, duration: 5 }, 'profile+=9').to({}, { duration: 10 });
  tl.addLabel('projects').to([...profileMats, vLine.material], { opacity: 0, duration: 4, ease: 'power2.out' }, 'projects').to(profilePlane.material.uniforms.u_opacity, { value: 0, duration: 4, ease: 'power2.out' }, '<');
  projectsGrp.children.forEach((g, i) => { const viewZ = g.position.z + 24; tl.to(camera.position, { x: 0, y: 0, z: viewZ, duration: 15, ease: 'power2.inOut' }); tl.set(g, { visible: true }, '>'); tl.to(g.userData.thumb.material.uniforms.u_opacity, { value: 1, duration: 8, stagger: 0.2 }, '<'); const mats = g.userData.txtNodes.map(n => n.material); tl.to(mats, { opacity: 1, duration: 8, stagger: 0.2 }, '<'); tl.to({}, { duration: 10 }); if (i < projectsGrp.children.length - 1) { tl.to(g.userData.thumb.material.uniforms.u_opacity, { value: 0, duration: 8, stagger: 0.05 }); tl.to(mats, { opacity: 0, duration: 8, stagger: 0.05 }, '<'); tl.set(g, { visible: false }, '>'); } });
  tl.addLabel('blackhole'); const last = projectsGrp.children.at(-1); tl.to(last.userData.thumb.material.uniforms.u_opacity, { value: 0, duration: 5 }, 'blackhole').to(last.userData.txtNodes.map(n => n.material), { opacity: 0, duration: 5 }, '<').set(last, { visible: false });
  tl.call(hideAll, null, 'blackhole').to(camera.position, { x: 0, y: 0, z: 50, duration: 10, ease: 'power2.inOut' }, 'blackhole+=2').set(finaleGrp, { visible: true }, '<').to(ffMat.uniforms.u_opacity, { value: 0.7, duration: 10 }, '<').to(ffMat.uniforms.u_force_strength, { value: 10, duration: 10, ease: 'power2.out' }, '<');
  tl.addLabel('galaxyIntro', 'blackhole+=').to(ffMat.uniforms.u_opacity, { value: 0, duration: 6 }, 'galaxyIntro').to(galMat.uniforms.u_progress, { value: 1.0, duration: 8, ease: 'power2.out' }, 'galaxyIntro+=1').to(camera.position, { z: 25, duration: 8, ease: 'power2.inOut' }, '<').to(bloomPass, { strength: 1.8, duration: 8 }, 'galaxyIntro');
  tl.addLabel('galaxyFly').to(camera.position, { z: -80, duration: 20, ease: 'none' }, 'galaxyFly').to(galaxy.rotation, { y: Math.PI * 2, duration: 20, ease: 'none' }, 'galaxyFly').to(bloomPass, { strength: 2.5, duration: 20, ease: 'none' }, 'galaxyFly');
  tl.addLabel('planetIntro', 'galaxyFly+=60');
  tl.call(() => placeInFront(planetGrp, 32, camera), null, 'planetIntro').set(planetGrp, { visible: true }, 'planetIntro').to(bloomPass, { strength: 1.5, duration: 8, ease: 'power2.out' }, 'planetIntro');
  tl.from(particleSphere.material, { opacity: 0, duration: 4, ease: 'power2.out' }, 'planetIntro').from(particleSphere.scale, { x: 0, y: 0, z: 0, duration: 6, ease: 'power3.out' }, 'planetIntro');
  tl.from(ringMats, { opacity: 0, duration: 4, stagger: 0.2, ease: 'power3.out' }, 'planetIntro+=0.5').from([pivot1.scale, pivot2.scale, pivot3.scale], { x: 0, y: 0, z: 0, duration: 6, stagger: 0.4, ease: 'power3.out' }, 'planetIntro+=0.5');
  tl.to(iconMats, { opacity: 1, duration: 4 }, 'planetIntro+=1').to(gaugeMats, { opacity: 0.8, duration: 4 }, 'planetIntro+=1').to(gaugeTextMats, { opacity: 1, duration: 4 }, 'planetIntro+=1');
  const gaugeAnimationState = { progress: 0 };
  tl.to(gaugeAnimationState, { progress: 1, duration: 1.5, ease: 'power2.out', onUpdate: () => { gaugeFills.forEach(item => { const currentAngle = item.targetAngle * gaugeAnimationState.progress; item.mesh.geometry.dispose(); item.mesh.geometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64, 1, -Math.PI / 2, currentAngle); }); } }, 'planetIntro+=1.5');
  tl.to({}, { duration: 20 });

  /* Act10 – React Native Finale */
  tl.addLabel('reactFinale');
  tl.to([...iconMats, ...gaugeMats, ...gaugeTextMats], { opacity: 0, duration: 8, ease: 'power2.out' }, 'reactFinale');
  const reactColor = new THREE.Color(0x61dafb);
  tl.to(particleSphereMat.color, { r: reactColor.r, g: reactColor.g, b: reactColor.b, duration: 12 }, 'reactFinale');
  ringMats.forEach(m => { tl.to(m.color, { r: reactColor.r, g: reactColor.g, b: reactColor.b, duration: 12 }, 'reactFinale'); tl.to(m, { size: 0.2, duration: 12 }, 'reactFinale'); });
  const reactRotX = Math.PI / 2;
  tl.to(pivot1.rotation, { x: reactRotX, y: 0, z: 0, duration: 15, ease: 'power2.inOut' }, 'reactFinale');
  tl.to(pivot2.rotation, { x: reactRotX, y: 0, z: Math.PI / 3, duration: 15, ease: 'power2.inOut' }, 'reactFinale');
  tl.to(pivot3.rotation, { x: reactRotX, y: 0, z: -Math.PI / 3, duration: 15, ease: 'power2.inOut' }, 'reactFinale');
  tl.to([ring1.rotation, ring2.rotation, ring3.rotation], { x: 0, y: 0, z: 0, duration: 15, ease: 'power2.inOut' }, 'reactFinale');
  tl.to([ring1.scale, ring2.scale, ring3.scale], { x: 1, y: 1.05, z: 1, duration: 15, ease: 'power2.inOut' }, 'reactFinale');
  tl.to(bloomPass, { strength: 1.2, duration: 15, ease: 'power2.inOut' }, `reactFinale+=5`);
  tl.set(reactNativeText, { visible: true }, `reactFinale+=8`);
  tl.call(() => { const textPos = particleSphere.getWorldPosition(new THREE.Vector3()); reactNativeText.position.set(textPos.x, textPos.y - 15, textPos.z); }, null, `reactFinale+=8`);
  tl.to(reactNativeText.material, { opacity: 1, duration: 10 }, `reactFinale+=8`);
  tl.to({}, { duration: 15 });

  // ✅ [복원] Act11 – 최종 로고 해체 및 재배치
  const deconstructLabel = "deconstruct";
  tl.addLabel(deconstructLabel, ">");
  const deconstructDuration = 20;
  const ease = 'power2.inOut';
  // 링과 구 작게 만들기
  tl.to(ring1.scale, { x: 0.5, y: 0.5, z: 0.5, duration: deconstructDuration, ease: ease }, deconstructLabel);
  tl.to(ring2.scale, { x: 0.4, y: 0.4, z: 0.4, duration: deconstructDuration, ease: ease }, deconstructLabel);
  tl.to(ring3.scale, { x: 0.333, y: 0.333, z: 0.333, duration: deconstructDuration, ease: ease }, deconstructLabel);
  tl.to(particleSphere.scale, { x: 0.1, y: 0.1, z: 0.1, duration: deconstructDuration, ease: ease }, deconstructLabel);
  // 전체 그룹 앞으로 기울이기
  tl.to(planetGrp.rotation, { x: `+=${Math.PI / 6}`, duration: deconstructDuration, ease: ease }, deconstructLabel);
  // 링 하나씩 45도씩 기울이기
  tl.to(pivot2.rotation, { y: `-=${Math.PI / 4}`, duration: deconstructDuration, ease: ease }, deconstructLabel);
  tl.to(pivot3.rotation, { y: `+=${Math.PI / 4}`, duration: deconstructDuration, ease: ease }, deconstructLabel);
  // 텍스트 사라지기
  tl.to(reactNativeText.material, { opacity: 0, duration: deconstructDuration / 2, ease: ease }, deconstructLabel);
  tl.to({}, { duration: 20 });


  // ✅ [수정] Act12 - 응축 (Singularity) - 해체된 상태에서 응축 시작
  const singularityLabel = "singularity";
  tl.addLabel(singularityLabel, ">");
  tl.to(planetGrp.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 15, ease: 'power3.in' }, singularityLabel);
  tl.to(bloomPass, { strength: 3.5, duration: 17, ease: 'power3.in' }, singularityLabel);
  tl.call(() => { planetGrp.visible = false; reactNativeText.visible = false; }, null, ">-0.1");
  tl.to({}, { duration: 5 });


  // ✅ Act13 - 대폭발 (Big Bang)
  const bigBangLabel = "bigBang";
  tl.addLabel(bigBangLabel, ">");
  tl.call(() => {
    const singularityPos = new THREE.Vector3();
    planetGrp.getWorldPosition(singularityPos);
    camera.position.copy(singularityPos);
    bigBangGrp.position.copy(singularityPos);
    bigBangGrp.visible = true;
  }, null, bigBangLabel);
  tl.to(bloomPass, { strength: 1.5, duration: 20, ease: 'power2.out' }, bigBangLabel);
  tl.to(bangMat.uniforms.u_opacity, { value: 0.85, duration: 20, ease: 'power1.out' }, bigBangLabel);
  tl.to(camera.position, { z: '+=180', duration: 30, ease: 'power3.out' }, bigBangLabel);
  tl.to(bangMat.uniforms.u_progress, { value: 1, duration: 30, ease: 'power3.out' }, bigBangLabel);
}