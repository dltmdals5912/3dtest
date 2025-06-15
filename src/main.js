/* ───────────────────────── main.js ─────────────────────────
   Three.js r155 + GSAP + Vite
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Text } from 'troika-three-text';

import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass }      from 'three/addons/postprocessing/GlitchPass.js';

import profileImg          from '/src/assets/profile.png';
import projectAuraImg      from '/src/assets/project-aura.png';
import projectOdysseyImg   from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';

gsap.registerPlugin(ScrollTrigger);

/* ── Scene / Camera / Renderer ───────────────────────────── */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas : document.querySelector('#app'),
  alpha  : true,
  antialias : true
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

/* ── Post-processing ─────────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.85));
const glitchPass = new GlitchPass();
glitchPass.enabled = false;
composer.addPass(glitchPass);

/* ── Resize ─────────────────────────────────────────────── */
addEventListener('resize',()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  composer .setSize(innerWidth,innerHeight);
});

/* ── Helpers ────────────────────────────────────────────── */
const texLoader = new THREE.TextureLoader();
const maxAniso  = renderer.capabilities.getMaxAnisotropy();
const loadTex   = u => {const t=texLoader.load(u);t.anisotropy=maxAniso;return t;};

/* ── Rounded-corner Shader ─────────────────────────────── */
const vShader =/*glsl*/`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;
const fShader =/*glsl*/`
uniform sampler2D u_texture;
uniform float u_radius,u_brightness_clamp,u_opacity;
varying vec2 vUv;
float roundSDF(vec2 p,vec2 b,float r){return length(max(abs(p)-b,0.0))-r;}
void main(){
  vec4 c = texture2D(u_texture,vUv);
  c.rgb = min(c.rgb,vec3(u_brightness_clamp));
  vec2 h = vec2(0.5);
  float d = roundSDF(vUv-h,h-u_radius,u_radius);
  float a = 1.0 - smoothstep(0.0,0.005,d);
  gl_FragColor = vec4(c.rgb,c.a*a*u_opacity);
}`;

/* ── Starfield ─────────────────────────────────────────── */
function stars(n,s,d){
  const v=[];for(let i=0;i<n;i++)v.push((Math.random()-.5)*d,(Math.random()-.5)*d,(Math.random()-.5)*d);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  return new THREE.Points(g,new THREE.PointsMaterial({color:0xaaaaaa,size:s,transparent:true,opacity:0.7}));
}
scene.add(stars(1500,1.5,1500));

/* ── Spark ─────────────────────────────────────────────── */
const spark=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:.2,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
);
spark.position.set(0,0,-300);
scene.add(spark);

/* ── Twinkles ─────────────────────────────────────────── */
const twinkleGrp=new THREE.Group();scene.add(twinkleGrp);
const twinkleTex=loadTex('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
for(let i=0;i<150;i++){
  const m=new THREE.MeshBasicMaterial({
    map:twinkleTex,color:0xffffff,transparent:true,opacity:Math.random()*0.5,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m);
  const R=300,r=R*Math.sqrt(Math.random()),th=Math.random()*2*Math.PI;
  quad.position.set(r*Math.cos(th),r*Math.sin(th),(Math.random()-.5)*R);
  quad.isTwinkling=false;
  twinkleGrp.add(quad);
}

/* ── Shooting Star ────────────────────────────────────── */
let shooting=false;
const shootingStar=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:.5,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
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

/* ── Text Helper ───────────────────────────────────────── */
const makeText=(str,size,col=0xffffff)=>{
  const t=new Text();
  t.text=str;t.fontSize=size;t.color=col;t.anchorX='left';
  t.font='https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
  t.material.transparent=true;t.material.opacity=0;
  t.sync();scene.add(t);return t;
};

/* ── HUD 텍스트 ───────────────────────────────────────── */
const coordTxt = makeText('[35.1796° N, 129.0756° E]',1.5); coordTxt.anchorX='center';
const idTxt    = makeText('OBJECT LSM-2002'              ,2.5); idTxt.anchorX='center';
const coreTxt  = makeText('LOGIC | CREATIVITY | DIMENSION',1.5); coreTxt.anchorX='center';
const accessTxt= makeText('SYSTEM ACCESS: COMPLETE'      ,2  ); accessTxt.anchorX='center';

/* ── Profile 그룹 ─────────────────────────────────────── */
const profileGrp=new THREE.Group();scene.add(profileGrp);
const mkShaderMat=img=>new THREE.ShaderMaterial({
  uniforms:{
    u_texture:{value:loadTex(img)},
    u_radius :{value:.05},
    u_brightness_clamp:{value:.65},
    u_opacity:{value:0}
  },
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
const pSlogan= makeText('복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.',1,0xcccccc);
pSlogan.lineHeight=2.2;
const emailL=makeText('E-mail:',0.9);
const emailV=makeText('rlaxodud5877@naver.com',0.9,0xcccccc);
const gitL  =makeText('GitHub:',0.9);
const gitV  =makeText('github.com/dltmdals5912',0.9,0xcccccc);

const profileNodes=[pTitle,pSlogan,emailL,emailV,gitL,gitV];
const profileMats =profileNodes.map(t=>t.material);
profileGrp.add(profilePlane,vLine,...profileNodes);
profileGrp.visible=false;

function layoutProfile(){
  const startX=-1, gapX=6.0, gapY=1.0;
  let y=3.2;
  pTitle .position.set(startX      ,y      ,-10);
  y-=2.5;
  pSlogan.position.set(startX      ,y      ,-10);
  y-=pSlogan.geometry.boundingBox.max.y - pSlogan.geometry.boundingBox.min.y + 1.0;
  emailL.position.set(startX      ,y      ,-10);
  emailV.position.set(startX+gapX ,y      ,-10);
  y-=gapY;
  gitL  .position.set(startX      ,y      ,-10);
  gitV  .position.set(startX+gapX ,y      ,-10);
}

/* ── Projects 그룹 ────────────────────────────────────── */
const projectsGrp=new THREE.Group();scene.add(projectsGrp);
const projects=[
  {title:'AURA: Generative Data Sculpture',role:'Lead Developer & Creative Technologist',desc:'소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품...',tech:'Three.js, GSAP, Socket.IO, Python, AWS',img:projectAuraImg},
  {title:'Project: ODYSSEY',role:'Lead 3D Developer & Narrative Designer',desc:'소행성 ‘2025-ODYSSEY’ 탐사 로버의 로그를 따라가는 3D 웹 스토리텔링...',tech:'Three.js, Blender, GSAP, GLSL',img:projectOdysseyImg},
  {title:'FlowField: Real-time Audio-Reactive Art',role:'Sole Developer & Artist',desc:'Web Audio API로 실시간 사운드를 분석해 유기적 비주얼을 만드는 미디어 아트...',tech:'TypeScript, p5.js, Web Audio API, GLSL, Vite',img:projectFlowfieldImg}
];

projects.forEach((p,i)=>{
  const g=new THREE.Group();g.visible=false;g.position.z=-100*(i+1);
  const thumb=new THREE.Mesh(new THREE.PlaneGeometry(16,9),mkShaderMat(p.img));
  thumb.position.set(-18,1,-12);
  g.userData.shader=[thumb.material.uniforms.u_opacity];
  const tTitle=makeText(p.title,2);tTitle.position.set(0,6.5,-12);
  const tRole =makeText(p.role ,1,0x00bfff);tRole.position.set(0,4  ,-12);
  const tDesc =makeText(p.desc ,1,0xcccccc);tDesc.maxWidth=20;tDesc.lineHeight=1.6;tDesc.position.set(0,0.5,-12);
  const tLab  =makeText('Tech:',1);
  const tTech =makeText(p.tech ,0.9,0xcccccc);tTech.maxWidth=20;tTech.lineHeight=1.5;
  g.userData.txt=[tTitle.material,tRole.material,tDesc.material,tLab.material,tTech.material];
  tDesc.sync(()=>{
    const h = tDesc.geometry.boundingBox.max.y - tDesc.geometry.boundingBox.min.y;
    tLab.position.set(0,tDesc.position.y-h-1.4,-12);
    tTech.position.set(0,tLab.position.y-1.2,-12);
  });
  g.add(thumb,tTitle,tRole,tDesc,tLab,tTech);
  projectsGrp.add(g);
});

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 타이밍 문제를 해결하기 위해 GSAP 타임라인 생성을 함수로 감쌌습니다.
function createTimeline() {
  /* ── GSAP Timeline ────────────────────────────────────── */
  document.querySelector('#scroll-container').style.height='2800vh';
  const tl=gsap.timeline({scrollTrigger:{trigger:'#scroll-container',start:'top top',end:'bottom bottom',scrub:2}});

  /* Act0 – 글리치 */
  tl.to('#initial-screen',{opacity:0,duration:10});
  tl.set(glitchPass,{enabled:true,goWild:false},'<+4')
    .set(glitchPass,{enabled:false},'>+0.2')
    .set(glitchPass,{enabled:true,goWild:true},'>+0.5')
    .set(glitchPass,{enabled:false},'>+0.4')
    .set('#initial-screen',{display:'none'});

  /* Act1 – Spark Approach */
  tl.addLabel('star');
  tl.to(spark.material,{opacity:1,size:.4,duration:.5},'star');
  tl.to(camera.position,{z:30,duration:8,ease:'power2.inOut'},'star');
  tl.to(spark.position ,{z:12,duration:8,ease:'power2.inOut'},'star');
  tl.to(spark.material,{size:.9,duration:8,ease:'power2.inOut'},'star');
  tl.to(spark.material,{opacity:0,size:.4,duration:1.8,ease:'sine.in'},'star+=6.5');
  tl.set(spark,{visible:false},'star+=8');

  /* Act2 – HUD */
  coordTxt.position.set(-28,0,-8);
  idTxt  .position.set(   0,0,-8);
  coreTxt.position.set(  28,0,-8);
  tl.addLabel('hud');
  tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:1,duration:8,stagger:.5},'hud');
  tl.to({}, {duration:10});

  /* Act3 – HUD merge & ACCESS */
  tl.to([coordTxt.position,idTxt.position,coreTxt.position],{x:0,duration:8,ease:'power2.in'},'merge');
  tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:0,duration:5,ease:'power2.out'},'merge+=.2');
  tl.to(accessTxt.material,{opacity:1,duration:3},'>-2');
  tl.to(accessTxt.position ,{z:-8},'<');
  tl.to({}, {duration:8});

  /* Act4 – Profile */
  tl.addLabel('profile');
  tl.to(accessTxt.material,{opacity:0,duration:3},'profile');
  profileGrp.visible=true;
  tl.to(camera.position,{x:-7,duration:6,ease:'power2.inOut'},'profile');
  tl.from(vLine.scale,{y:0,duration:5,ease:'power2.out'},'profile+=1')
    .to(vLine.material,{opacity:.35,duration:5},'<')
    .to(profilePlane.material.uniforms.u_opacity,{value:1,duration:8},'profile+=2');

  profileNodes.forEach((node, i) => {
    let startTime = 1 + i * 0.15;
    if (i === 3 || i === 5) {
      startTime = 1 + (i - 1) * 0.15;
    }
    const t = `profile+=${startTime}`;
    tl.from(node.position, { x: node.position.x + 40, duration: 6, ease: 'power3.out' }, t);
    tl.to(node.material, { opacity: 1, duration: 6, ease: 'power3.out' }, t);
  });

  tl.to(vLine.material,{opacity:0,duration:5},'profile+=9')
    .to({}, {duration:15});

  /* Act5 – Projects */
  tl.addLabel('projects');
  tl.to([...profileMats,vLine.material],{opacity:0,duration:4,ease:'power2.out'},'projects');
  tl.to(profilePlane.material.uniforms.u_opacity,{value:0,duration:4,ease:'power2.out'},'<');
  projectsGrp.children.forEach((g,i)=>{
    const viewZ=g.position.z+24;
    tl.to(camera.position,{x:0,y:0,z:viewZ,duration:15,ease:'power2.inOut'});
    tl.set(g,{visible:true},'>');
    tl.to(g.userData.shader,{value:1,duration:8,stagger:.2},'<');
    tl.to(g.userData.txt   ,{opacity:1,duration:8,stagger:.2},'<');
    tl.to({}, {duration:20});
    if(i<projectsGrp.children.length-1){
      tl.to(g.userData.shader,{value:0,duration:8,stagger:.05});
      tl.to(g.userData.txt   ,{opacity:0,duration:8,stagger:.05},'<');
      tl.set(g,{visible:false},'>');
    }
  });
}

// 레이아웃이 끝난 후, 타임라인을 생성하도록 `sync` 콜백을 수정합니다.
pSlogan.sync(() => {
  layoutProfile();
  createTimeline();
});

/* ── Render loop ─────────────────────────────────────── */
function animate(){
  requestAnimationFrame(animate);
  twinkleGrp.children.forEach(tw=>{
    if(!tw.isTwinkling && Math.random()>.998){
      tw.isTwinkling=true;
      const d=Math.random()*0.5+0.5;
      gsap.to(tw.scale   ,{x:1.5,y:1.5,duration:d,yoyo:true,repeat:1,ease:'power2.out',onComplete:()=>{tw.isTwinkling=false;}});
      gsap.to(tw.material,{opacity:.8,duration:d,yoyo:true,repeat:1,ease:'power2.out'});
    }
  });
  if(Math.random()<.003 && !shooting) fireStar();
  composer.render();
}
animate();
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲