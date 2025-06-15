/* ───────────────────────── main.js ─────────────────────────
   Three.js r155 + GSAP + Vite
   ▶ 스크롤 기반 인터랙티브 포트폴리오
   ▶ Planet: 파티클 구 + 3 고리 + 6 기술 아이콘
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Text } from 'troika-three-text';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass }      from 'three/addons/postprocessing/GlitchPass.js';

/* ── 이미지 애셋 ─────────────────────────────────────────── */
import profileImg          from '/src/assets/profile.png';
import projectAuraImg      from '/src/assets/project-aura.png';
import projectOdysseyImg   from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';
import cssIcon   from '/src/assets/tech/css.png';
import htmlIcon  from '/src/assets/tech/html.png';
import jsIcon    from '/src/assets/tech/js.png';
import nodeIcon  from '/src/assets/tech/node.png';
import reactIcon from '/src/assets/tech/react.png';
import threeIcon from '/src/assets/tech/three.png';

gsap.registerPlugin(ScrollTrigger);

/* ── Scene / Camera / Renderer ───────────────────────────── */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 2000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas : document.querySelector('#app'),
  alpha  : true,
  antialias: true
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

/* ── Post-processing ─────────────────────────────────────── */
const composer  = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.3,0.4,0.85);
composer.addPass(bloomPass);
const glitchPass = new GlitchPass(); glitchPass.enabled=false;
composer.addPass(glitchPass);

/* ── 입력 / 리사이즈 ─────────────────────────────────────── */
const mousePos       = new THREE.Vector2(10000,10000);
const targetMousePos = new THREE.Vector2(10000,10000);
addEventListener('mousemove',e=>{
  targetMousePos.x =  (e.clientX/innerWidth)*2-1;
  targetMousePos.y = -(e.clientY/innerHeight)*2+1;
});
addEventListener('mouseout',()=>{ targetMousePos.set(10000,10000);});
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  composer .setSize(innerWidth,innerHeight);
});

/* ── 헬퍼 ───────────────────────────────────────────────── */
const texLoader=new THREE.TextureLoader();
const maxAniso =renderer.capabilities.getMaxAnisotropy();
const loadTex  =u=>{const t=texLoader.load(u);t.anisotropy=maxAniso;return t;};
const placeInFront=(o,d)=>{const v=new THREE.Vector3();camera.getWorldDirection(v);o.position.copy(camera.position).add(v.multiplyScalar(d));};

/* ── GLSL 셰이더 ────────────────────────────────────────── */
const vShader =/*glsl*/`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;
const fShader =/*glsl*/`
uniform sampler2D u_texture;
uniform float u_radius, u_brightness_clamp, u_opacity;
varying vec2 vUv;
float rSDF(vec2 p, vec2 b, float r){ return length(max(abs(p)-b,0.0))-r; }
void main(){
  vec4 c = texture2D(u_texture, vUv);
  c.rgb = min(c.rgb, vec3(u_brightness_clamp));
  vec2 h = vec2(0.5);
  float d = rSDF(vUv-h, h-u_radius, u_radius);
  float a = 1.0 - smoothstep(0.0, 0.005, d);
  gl_FragColor = vec4(c.rgb, c.a * a * u_opacity);
}`;
const vParticleShader =/*glsl*/`
uniform float u_time; uniform vec2 u_mouse; uniform float u_force_strength;
varying float v_d;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  v_d = distance(mv.xy, u_mouse);
  float push = smoothstep(20.0, 0.0, v_d) * u_force_strength;
  mv.xyz += normalize(mv.xyz - vec3(u_mouse, mv.z)) * push;
  mv.x += sin(u_time*0.2 + position.y*0.5) * 0.3;
  mv.y += cos(u_time*0.2 + position.x*0.5) * 0.3;
  gl_PointSize = (100.0 / -mv.z) * 0.3;
  gl_Position = projectionMatrix * mv;
}`;
const fParticleShader =/*glsl*/`
uniform float u_opacity; varying float v_d;
void main(){
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  float g = smoothstep(5.0, 0.0, v_d);
  vec3 col = vec3(0.6,0.7,1.0) * (s + g);
  gl_FragColor = vec4(col, s * u_opacity);
}`;
const vGalaxyShader =/*glsl*/`
uniform float u_time; varying vec3 v_col;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  float d = length(mv.xy*0.1);
  float a = atan(mv.y, mv.x);
  float sp = sin(d*5.0 - a*2.0 + u_time*0.1);
  mv.z += sp * 2.0;
  v_col = mix(vec3(0.1,0.2,0.5), vec3(0.8,0.3,0.6), smoothstep(-0.5,0.5,sp));
  gl_PointSize = (100.0 / -mv.z) * 0.15;
  gl_Position = projectionMatrix * mv;
}`;
const fGalaxyShader =/*glsl*/`
varying vec3 v_col;
void main(){
  float s = 1.0 - distance(gl_PointCoord, vec2(0.5));
  s = smoothstep(0.0, 0.5, s);
  gl_FragColor = vec4(v_col, s);
}`;

/* ── Starfield / Spark / Twinkle / Shooting-star ───────── */
function stars(N,size,dist){
  const v=[];for(let i=0;i<N;i++)v.push((Math.random()-.5)*dist,(Math.random()-.5)*dist,(Math.random()-.5)*dist);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  return new THREE.Points(g,new THREE.PointsMaterial({color:0xaaaaaa,size,transparent:true,opacity:0.7}));
}
scene.add(stars(1500,1.5,1500));

const spark=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:0.2,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
);
spark.position.set(0,0,-300);
scene.add(spark);

const twinkleGrp=new THREE.Group();scene.add(twinkleGrp);
const twinkleTex=loadTex('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
for(let i=0;i<150;i++){
  const m=new THREE.MeshBasicMaterial({map:twinkleTex,color:0xffffff,transparent:true,opacity:Math.random()*0.5,blending:THREE.AdditiveBlending,depthWrite:false});
  const q=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m);
  const R=300,r=R*Math.sqrt(Math.random()),th=Math.random()*Math.PI*2;
  q.position.set(r*Math.cos(th),r*Math.sin(th),(Math.random()-.5)*R);
  q.isTwinkling=false;twinkleGrp.add(q);
}
let shooting=false;
const shootingStar=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:0.5,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
);
scene.add(shootingStar);
function fireStar(){
  if(shooting)return;shooting=true;
  const sx=Math.random()*200-100,ex=Math.random()*200-100,z=Math.random()*-400-100;
  shootingStar.position.set(sx,100,z);shootingStar.material.opacity=1;
  gsap.to(shootingStar.position,{
    x:ex,y:-100,duration:Math.random()*1.5+.5,ease:'power2.in',
    onComplete:()=>{shootingStar.material.opacity=0;shooting=false;}
  });
}

/* ── Troika 텍스트 ─────────────────────────────────────── */
const makeText=(str,size,color=0xffffff)=>{
  const t=new Text();
  t.text=str; t.fontSize=size; t.color=color;
  t.anchorX='left';
  t.font='https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
  t.material.transparent=true; t.material.opacity=0;
  t.sync(); scene.add(t); return t;
};

/* HUD 텍스트 */
const coordTxt = makeText('[35.1796° N, 129.0756° E]',1.5); coordTxt.anchorX='center';
const idTxt    = makeText('OBJECT LSM-2002',2.5);           idTxt.anchorX='center';
const coreTxt  = makeText('LOGIC | CREATIVITY | DIMENSION',1.5); coreTxt.anchorX='center';
const accessTxt= makeText('SYSTEM ACCESS: COMPLETE',2);       accessTxt.anchorX='center';

/* 프로필 그룹 ─ 레이아웃 원본 유지 */
const profileGrp=new THREE.Group();scene.add(profileGrp);
const mkShaderMat=img=>new THREE.ShaderMaterial({
  uniforms:{u_texture:{value:loadTex(img)},u_radius:{value:.05},u_brightness_clamp:{value:.65},u_opacity:{value:0}},
  vertexShader:vShader,fragmentShader:fShader,transparent:true
});
const profilePlane=new THREE.Mesh(new THREE.PlaneGeometry(10,10),mkShaderMat(profileImg));
profilePlane.position.set(-26,-1.2,-10);
const vLine=new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,7,-10),new THREE.Vector3(0,-7,-10)]),
  new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0})
);
vLine.position.set(-8,0,-10);

const pTitle = makeText('Creative Developer 이승민',1.8);
const pSlogan= makeText('복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.',1,0xcccccc); pSlogan.lineHeight=2.2;
const emailL=makeText('E-mail:',0.9);
const emailV=makeText('rlaxodud5877@naver.com',0.9,0xcccccc);
const gitL  =makeText('GitHub:',0.9);
const gitV  =makeText('github.com/dltmdals5912',0.9,0xcccccc);

const profileNodes=[pTitle,pSlogan,emailL,emailV,gitL,gitV];
const profileMats = profileNodes.map(n=>n.material);
profileGrp.add(profilePlane,vLine,...profileNodes); profileGrp.visible=false;

function layoutProfile(){
  const sx=-1,gx=6,gy=1; let y=3.2;
  pTitle.position .set(sx,y,-10); y-=2.5;
  pSlogan.position.set(sx,y,-10); y-=pSlogan.geometry.boundingBox.max.y-pSlogan.geometry.boundingBox.min.y+1;
  emailL.position.set(sx,y,-10); emailV.position.set(sx+gx,y,-10); y-=gy;
  gitL  .position.set(sx,y,-10); gitV .position.set(sx+gx,y,-10);
}

/* 프로젝트 그룹 */
const projectsGrp=new THREE.Group(); scene.add(projectsGrp);
const projects=[
  {title:'AURA: Generative Data Sculpture',role:'Lead Developer & Creative Technologist',desc:'소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품...',tech:'Three.js, GSAP, Socket.IO, Python, AWS',img:projectAuraImg},
  {title:'Project: ODYSSEY',role:'Lead 3D Developer & Narrative Designer',desc:'소행성 ‘2025-ODYSSEY’ 탐사 로버의 로그를 따라가는 3D 웹 스토리텔링...',tech:'Three.js, Blender, GSAP, GLSL',img:projectOdysseyImg},
  {title:'FlowField: Real-time Audio-Reactive Art',role:'Sole Developer & Artist',desc:'Web Audio API로 실시간 사운드를 분석해 유기적 비주얼을 만드는 미디어 아트...',tech:'TypeScript, p5.js, Web Audio API, GLSL, Vite',img:projectFlowfieldImg}
];
projects.forEach((p,i)=>{
  const g=new THREE.Group(); g.visible=false; g.position.z=-100*(i+1);
  const thumb=new THREE.Mesh(new THREE.PlaneGeometry(16,9),mkShaderMat(p.img));
  thumb.position.set(-18,1,-12); g.userData.thumb=thumb;
  const tTitle=makeText(p.title,2); tTitle.position.set(0,6.5,-12);
  const tRole =makeText(p.role,1,0x00bfff); tRole.position.set(0,4,-12);
  const tDesc =makeText(p.desc,1,0xcccccc); tDesc.maxWidth=20; tDesc.lineHeight=1.6; tDesc.position.set(0,0.5,-12);
  const tLab  =makeText('tech:',1);
  const tTech =makeText(p.tech,0.9,0xcccccc); tTech.maxWidth=20; tTech.lineHeight=1.5;
  g.userData.txtNodes=[tTitle,tRole,tDesc,tLab,tTech];
  tDesc.sync(()=>{const h=tDesc.geometry.boundingBox.max.y-tDesc.geometry.boundingBox.min.y; tLab.position.set(0,tDesc.position.y-h-1.4,-12); tTech.position.set(0,tLab.position.y-1.2,-12);});
  g.add(thumb,tTitle,tRole,tDesc,tLab,tTech); projectsGrp.add(g);
});

/* 텍스트 모음 */
const ALL_TEXT_NODES=[...profileNodes,...projectsGrp.children.flatMap(g=>g.userData.txtNodes)];

/* Finale: Force-field & Galaxy */
const finaleGrp=new THREE.Group(); finaleGrp.visible=false; scene.add(finaleGrp);
/* Force-field */
const FF=30000, ffArr=new Float32Array(FF*3);
for(let i=0;i<FF;i++) ffArr.set([(Math.random()-.5)*100,(Math.random()-.5)*100,(Math.random()-.5)*100],i*3);
const ffGeom=new THREE.BufferGeometry(); ffGeom.setAttribute('position',new THREE.BufferAttribute(ffArr,3));
const ffMat=new THREE.ShaderMaterial({
  uniforms:{u_time:{value:0},u_mouse:{value:new THREE.Vector2(10000,10000)},u_force_strength:{value:0},u_opacity:{value:0}},
  vertexShader:vParticleShader,fragmentShader:fParticleShader,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false
});
finaleGrp.add(new THREE.Points(ffGeom,ffMat));
/* Galaxy */
const GAL=100000, galArr=new Float32Array(GAL*3);
for(let i=0;i<GAL;i++){const r=Math.random()*60,a=Math.random()*Math.PI*2,z=(Math.random()-.5)*30; galArr.set([r*Math.cos(a),r*Math.sin(a)*0.7,z],i*3);}
const galGeom=new THREE.BufferGeometry(); galGeom.setAttribute('position',new THREE.BufferAttribute(galArr,3));
const galMat=new THREE.ShaderMaterial({
  uniforms:{u_time:{value:0},u_mouse:{value:new THREE.Vector2()}},
  vertexShader:vGalaxyShader,fragmentShader:fGalaxyShader,
  transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0
});
const galaxy=new THREE.Points(galGeom,galMat); galaxy.scale.set(0.8,0.8,0.8); finaleGrp.add(galaxy);

/* Planet: 파티클 구 + 고리 + 아이콘 */
const planetGrp=new THREE.Group(); planetGrp.visible=false; scene.add(planetGrp);
/* 파티클 구 (밝기↓) */
const SPHERE_PTS=9000,radius=8, psArr=new Float32Array(SPHERE_PTS*3);
for(let i=0;i<SPHERE_PTS;i++){
  const u=Math.random(),v=Math.random(),theta=2*Math.PI*u,phi=Math.acos(2*v-1);
  psArr.set([radius*Math.sin(phi)*Math.cos(theta),radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi)],i*3);
}
const particleSphere=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(psArr,3)),
  new THREE.PointsMaterial({color:0x4466ff,size:0.18,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false})
);
planetGrp.add(particleSphere);
/* 고리 + 피벗 */
const makeRing=(R,c)=>new THREE.Mesh(new THREE.TorusGeometry(R,0.18,16,100),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.6}));
const makePivot=(ring,tx,ty)=>{const p=new THREE.Group();p.rotation.set(tx,ty,0);p.add(ring);planetGrp.add(p);return p;};
const ring1=makeRing(10,0x66ccff), ring2=makeRing(12.5,0xff66ff), ring3=makeRing(15,0xffff66);
const pivot1=makePivot(ring1,0,0);
const pivot2=makePivot(ring2,THREE.MathUtils.degToRad(30),0);
const pivot3=makePivot(ring3,0,THREE.MathUtils.degToRad(45));
/* 아이콘 */
const iconData=[
  {tex:loadTex(htmlIcon),  ring:ring1, angle:0},
  {tex:loadTex(cssIcon),   ring:ring1, angle:Math.PI},
  {tex:loadTex(jsIcon),    ring:ring2, angle:Math.PI/2},
  {tex:loadTex(nodeIcon),  ring:ring2, angle:-Math.PI/2},
  {tex:loadTex(reactIcon), ring:ring3, angle:Math.PI/4},
  {tex:loadTex(threeIcon), ring:ring3, angle:-Math.PI*3/4}
];
const iconMats=[];
iconData.forEach(d=>{
  const mat=new THREE.MeshBasicMaterial({map:d.tex,transparent:true,opacity:0});
  iconMats.push(mat);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);
  plane.position.set(d.ring.geometry.parameters.radius*Math.cos(d.angle),0,d.ring.geometry.parameters.radius*Math.sin(d.angle));
  plane.lookAt(planetGrp.position);
  d.ring.add(plane);
});

/* ── GSAP 타임라인 ─────────────────────────────────────── */
function createTimeline(){
  document.querySelector('#scroll-container').style.height='6000vh';
  const tl=gsap.timeline({scrollTrigger:{trigger:'#scroll-container',start:'top top',end:'bottom bottom',scrub:2}});
  const hideAll=()=>{ALL_TEXT_NODES.forEach(n=>n.visible=false);};

  /* Act0 – 글리치 인트로 */
  tl.to('#initial-screen',{opacity:0,duration:10});
  tl.set(glitchPass,{enabled:true,goWild:false},'<+4')
    .set(glitchPass,{enabled:false},'>+0.2')
    .set(glitchPass,{enabled:true,goWild:true},'>+0.5')
    .set(glitchPass,{enabled:false},'>+0.4')
    .set('#initial-screen',{display:'none'});

  /* Act1 – Spark */
  tl.addLabel('spark');
  tl.to(spark.material,{opacity:1,size:0.4,duration:0.5},'spark');
  tl.to(camera.position,{z:30,duration:8,ease:'power2.inOut'},'spark');
  tl.to(spark.position ,{z:12,duration:8,ease:'power2.inOut'},'spark');
  tl.to(spark.material,{size:0.9,duration:8,ease:'power2.inOut'},'spark');
  tl.to(spark.material,{opacity:0,size:0.4,duration:1.8,ease:'sine.in'},'spark+=6.5');
  tl.set(spark,{visible:false},'spark+=8');

  /* Act2 – HUD */
  coordTxt.position.set(-28,0,-8); idTxt.position.set(0,0,-8); coreTxt.position.set(28,0,-8);
  tl.addLabel('hud');
  tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:1,duration:8,stagger:0.5},'hud');
  tl.to({},{duration:10});

  /* Act3 – HUD merge & ACCESS */
  tl.to([coordTxt.position,idTxt.position,coreTxt.position],{x:0,duration:8,ease:'power2.in'},'merge');
  tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:0,duration:5,ease:'power2.out'},'merge+=0.2');
  tl.to(accessTxt.material,{opacity:1,duration:3},'>-2');
  tl.to(accessTxt.position,{z:-8},'<');
  tl.to({},{duration:8});

  /* Act4 – Profile */
  tl.addLabel('profile');
  tl.to(accessTxt.material,{opacity:0,duration:3},'profile');
  profileGrp.visible=true;
  tl.to(camera.position,{x:-7,duration:6,ease:'power2.inOut'},'profile');
  tl.from(vLine.scale,{y:0,duration:5,ease:'power2.out'},'profile+=1')
    .to(vLine.material,{opacity:0.35,duration:5},'<')
    .to(profilePlane.material.uniforms.u_opacity,{value:1,duration:8},'profile+=2');
  profileNodes.forEach((n,i)=>{const t=`profile+=${1+i*0.15-(i>2?0.15:0)}`;tl.from(n.position,{x:n.position.x+40,duration:6,ease:'power3.out'},t).to(n.material,{opacity:1,duration:6,ease:'power3.out'},t);});
  tl.to(vLine.material,{opacity:0,duration:5},'profile+=9').to({},{duration:15});

  /* Act5 – Projects */
  tl.addLabel('projects');
  tl.to([...profileMats,vLine.material],{opacity:0,duration:4,ease:'power2.out'},'projects');
  tl.to(profilePlane.material.uniforms.u_opacity,{value:0,duration:4,ease:'power2.out'},'<');
  projectsGrp.children.forEach((g,i)=>{
    const viewZ=g.position.z+24;
    tl.to(camera.position,{x:0,y:0,z:viewZ,duration:15,ease:'power2.inOut'});
    tl.set(g,{visible:true},'>');
    tl.to(g.userData.thumb.material.uniforms.u_opacity,{value:1,duration:8,stagger:0.2},'<');
    const mats=g.userData.txtNodes.map(n=>n.material);
    tl.to(mats,{opacity:1,duration:8,stagger:0.2},'<');
    tl.to({},{duration:20});
    if(i<projectsGrp.children.length-1){
      tl.to(g.userData.thumb.material.uniforms.u_opacity,{value:0,duration:8,stagger:0.05});
      tl.to(mats,{opacity:0,duration:8,stagger:0.05},'<');
      tl.set(g,{visible:false},'>');
    }
  });

  /* Act6 – Force-field 블랙홀 */
  tl.addLabel('blackhole');
  const last=projectsGrp.children.at(-1);
  tl.to(last.userData.thumb.material.uniforms.u_opacity,{value:0,duration:5},'blackhole');
  tl.to(last.userData.txtNodes.map(n=>n.material),{opacity:0,duration:5},'<');
  tl.set(last,{visible:false});
  tl.call(hideAll,null,'blackhole');
  tl.to(camera.position,{x:0,y:0,z:50,duration:10,ease:'power2.inOut'},'blackhole+=2');
  tl.set(finaleGrp,{visible:true},'<');
  tl.to(ffMat.uniforms.u_opacity,{value:0.7,duration:10},'<');
  tl.to(ffMat.uniforms.u_force_strength,{value:10,duration:10,ease:'power2.out'},'<');

  /* Act7 – Galaxy Intro */
  tl.addLabel('galaxyIntro','blackhole+=14');
  tl.to(ffMat.uniforms.u_opacity,{value:0,duration:6},'galaxyIntro');
  tl.to(bloomPass,{strength:1.8,duration:10},'galaxyIntro');
  tl.to(galMat,{opacity:1,duration:10,ease:'power2.out'},'galaxyIntro+=1');
  tl.to(galaxy.scale,{x:1.4,y:1.4,z:1.4,duration:12,ease:'power2.inOut'},'<');
  tl.to(camera.position,{z:35,duration:12,ease:'power2.inOut'},'<');

  /* Act8 – Galaxy Fly */
  tl.addLabel('galaxyFly');
  tl.to(camera.position,{z:-50,duration:60,ease:'none'},'galaxyFly');
  tl.to(galaxy.rotation,{y:Math.PI*2,duration:60,ease:'none'},'galaxyFly');
  tl.to(bloomPass,{strength:2.5,duration:60,ease:'none'},'galaxyFly');

  /* Act9 – Planet */
  tl.addLabel('planetIntro','galaxyFly+=60');
  tl.call(()=>placeInFront(planetGrp,40),null,'planetIntro');        // 거리 40
  tl.set(planetGrp,{visible:true},'planetIntro');
  tl.from(particleSphere.material,{opacity:0,duration:4,ease:'power2.out'},'planetIntro');
  tl.from(particleSphere.scale,{x:0,y:0,z:0,duration:6,ease:'power3.out'},'planetIntro');
  tl.from([ring1.scale,ring2.scale,ring3.scale],{x:0,y:0,z:0,duration:6,stagger:0.4,ease:'power3.out'},'planetIntro+=0.5');
  tl.to(iconMats,{opacity:0.8,duration:4,stagger:0.15},'planetIntro+=1');   // 0 → 0.8
}

/* ── 타임라인 생성 (폰트 sync 뒤) ───────────────────────── */
pSlogan.sync(()=>{
  layoutProfile();
  createTimeline();          // 프로필 간격 원본 유지
  ScrollTrigger.refresh();   // 위치 재계산
});

/* ── Render Loop ───────────────────────────────────────── */
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  mousePos.lerp(targetMousePos,0.1);

  /* Force-field & Galaxy */
  if(finaleGrp.visible){
    ffMat.uniforms.u_time.value=t;
    const v=new THREE.Vector3(mousePos.x,mousePos.y,0.5).unproject(camera);
    const dir=v.sub(camera.position).normalize();
    const dist=(finaleGrp.position.z-camera.position.z)/dir.z;
    const p=camera.position.clone().add(dir.multiplyScalar(dist));
    ffMat.uniforms.u_mouse.value.set(p.x,p.y);
    galMat.uniforms.u_time.value=t*0.5;
    galMat.uniforms.u_mouse.value.set(p.x*0.3,p.y*0.3);
  }

  /* Planet */
  if(planetGrp.visible){
    const s=1+Math.sin(t*0.5)*0.02;
    particleSphere.scale.set(s,s,s);
    pivot1.rotation.z+=0.002; ring1.rotation.y+=0.01;
    pivot2.rotation.z-=0.0015; ring2.rotation.x+=0.012;
    pivot3.rotation.z+=0.001;  ring3.rotation.y+=0.008;
    planetGrp.traverse(obj=>{
      if(obj.isMesh&&obj.geometry.type==='PlaneGeometry') obj.lookAt(camera.position);
    });
  }

  /* Twinkles */
  twinkleGrp.children.forEach(q=>{
    if(!q.isTwinkling&&Math.random()>.998){
      q.isTwinkling=true;const d=Math.random()*0.5+0.5;
      gsap.to(q.scale,{x:1.5,y:1.5,duration:d,yoyo:true,repeat:1,ease:'power2.out',onComplete:()=>{q.isTwinkling=false;}});
      gsap.to(q.material,{opacity:0.8,duration:d,yoyo:true,repeat:1,ease:'power2.out'});
    }
  });

  /* Shooting Star */
  if(Math.random()<0.003&&!shooting) fireStar();

  composer.render();
}
animate();
