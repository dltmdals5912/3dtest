/* ───────────────────────── main.js ─────────────────────────
   Three.js r155 + GSAP + Vite
──────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Text } from 'troika-three-text';

import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass }      from 'three/addons/postprocessing/GlitchPass.js';

import profileImg          from '/src/assets/profile.png';
import projectAuraImg      from '/src/assets/project-aura.png';
import projectOdysseyImg   from '/src/assets/project-odyssey.png';
import projectFlowfieldImg from '/src/assets/project-flowfield.png';

gsap.registerPlugin(ScrollTrigger);

/* ── Scene / Camera / Renderer ───────────────────────────── */
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app'),
  alpha: true,
  antialias: true
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);

/* ── Post-processing ─────────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.85));
const glitchPass = new GlitchPass(); glitchPass.enabled = false;
composer.addPass(glitchPass);

/* ── Resize ─────────────────────────────────────────────── */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer .setSize(innerWidth, innerHeight);
});

/* ── Helpers ────────────────────────────────────────────── */
const texLoader = new THREE.TextureLoader();
const maxAniso  = renderer.capabilities.getMaxAnisotropy();
const loadTex   = url => { const t = texLoader.load(url); t.anisotropy = maxAniso; return t; };

/* ── Rounded-corner Shader ─────────────────────────────── */
const vShader = /*glsl*/`
varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `;
const fShader = /*glsl*/`
uniform sampler2D u_texture; uniform float u_radius,u_brightness_clamp,u_opacity; varying vec2 vUv;
float roundSDF(vec2 p,vec2 b,float r){return length(max(abs(p)-b,0.0))-r;}
void main(){
  vec4 col=texture2D(u_texture,vUv); col.rgb=min(col.rgb,vec3(u_brightness_clamp));
  vec2 h=vec2(.5); float sdf=roundSDF(vUv-h,h-u_radius,u_radius);
  float a=1.-smoothstep(0.,.005,sdf);
  gl_FragColor=vec4(col.rgb,col.a*a*u_opacity);} `;

/* ── Starfield / Spark ─────────────────────────────────── */
function stars(N,s,d){const v=[];for(let i=0;i<N;i++)v.push((Math.random()-.5)*d,(Math.random()-.5)*d,(Math.random()-.5)*d);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  return new THREE.Points(g,new THREE.PointsMaterial({color:0xaaaaaa,size:s,transparent:true,opacity:.7}));}
scene.add(stars(1500,1.5,1500));

const spark=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:.2,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
);
spark.position.set(0,0,-300); scene.add(spark);

/* ── Twinkles & Shooting Star ─────────────────────────── */
const twinkleGrp=new THREE.Group(); scene.add(twinkleGrp);
const twinkleTex=loadTex('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
for(let i=0;i<150;i++){
  const m=new THREE.MeshBasicMaterial({map:twinkleTex,color:0xffffff,transparent:true,opacity:Math.random()*0.5,blending:THREE.AdditiveBlending,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),m);
  const R=300,r=R*Math.sqrt(Math.random()),th=Math.random()*2*Math.PI;
  mesh.position.set(r*Math.cos(th),r*Math.sin(th),(Math.random()-.5)*R);
  twinkleGrp.add(mesh);
}
let shooting=false;
const shootingStar=new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),
  new THREE.PointsMaterial({color:0xffffff,size:0.5,transparent:true,opacity:0,blending:THREE.AdditiveBlending})
);
scene.add(shootingStar);
function fireStar(){
  if(shooting)return; shooting=true;
  const sx=Math.random()*200-100,ex=Math.random()*200-100,z=Math.random()*-400-100;
  shootingStar.position.set(sx,100,z); shootingStar.material.opacity=1;
  gsap.to(shootingStar.position,{x:ex,y:-100,duration:Math.random()*1.5+.5,ease:'power2.in',
    onComplete:()=>{shootingStar.material.opacity=0;shooting=false;}});
}

/* ── Text Helper ───────────────────────────────────────── */
const makeText=(str,size,col=0xffffff)=>{
  const t=new Text();
  t.text=str; t.fontSize=size; t.color=col; t.anchorX='center';
  t.font='https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SpoqaHanSansNeo-Regular.woff';
  t.material.transparent=true; t.material.opacity=0; t.sync();
  scene.add(t); return t;
};

/* ── HUD 텍스트 ───────────────────────────────────────── */
const coordTxt  = makeText('[35.1796° N, 129.0756° E]',1.5);
const idTxt     = makeText('OBJECT LSM-2002',2.5);
const coreTxt   = makeText('LOGIC | CREATIVITY | DIMENSION',1.5);
const accessTxt = makeText('SYSTEM ACCESS: COMPLETE',2);

/* ── Profile 그룹 ─────────────────────────────────────── */
const profileGrp=new THREE.Group(); scene.add(profileGrp);
const mkShaderMat=img=>new THREE.ShaderMaterial({
  uniforms:{u_texture:{value:loadTex(img)},u_radius:{value:.05},u_brightness_clamp:{value:.9},u_opacity:{value:0}},
  vertexShader:vShader,fragmentShader:fShader,transparent:true});
const profilePlane=new THREE.Mesh(new THREE.PlaneGeometry(10,10),mkShaderMat(profileImg));
const vLine=new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,8,-6),new THREE.Vector3(0,-8,-6)]),
  new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0}));
const pTitle = makeText('Creative Developer 이승민',2.2);
const pSlogan= makeText('복잡한 문제를 직관적인 솔루션으로,\n아이디어를 살아있는 인터랙션으로 만듭니다.',1,0xcccccc); pSlogan.anchorX='left'; pSlogan.lineHeight=1.5;
const emailL = makeText('E-mail:',0.9); emailL.anchorX='left';
const emailV = makeText(' rlaxodud5877@naver.com',0.9,0xcccccc); emailV.anchorX='left';
const gitL   = makeText('GitHub:',0.9); gitL.anchorX='left';
const gitV   = makeText(' github.com/dltmdals5912',0.9,0xcccccc); gitV.anchorX='left';
profileGrp.add(profilePlane,vLine,pTitle,pSlogan,emailL,emailV,gitL,gitV);
profileGrp.visible=false;
const profileMats=[pTitle.material,pSlogan.material,emailL.material,emailV.material,gitL.material,gitV.material];

/* ── Projects 그룹 ────────────────────────────────────── */
const projectsGrp=new THREE.Group(); scene.add(projectsGrp);
const projects=[{
  title:'AURA: Generative Data Sculpture',
  role :'Lead Developer & Creative Technologist',
  desc :'소셜 미디어의 실시간 텍스트 데이터를 감정적으로 분석하고, 그 결과를 수만 개의 3D 파티클로 시각화한 인터랙티브 설치 작품...',
  tech :'Three.js, GSAP, Socket.IO, Python, AWS',
  img:projectAuraImg},{
  title:'Project: ODYSSEY',
  role :'Lead 3D Developer & Narrative Designer',
  desc :'소행성 ‘2025-ODYSSEY’ 탐사 로버의 로그를 따라가는 3D 웹 스토리텔링...',
  tech :'Three.js, Blender, GSAP, GLSL',
  img:projectOdysseyImg},{
  title:'FlowField: Real-time Audio-Reactive Art',
  role :'Sole Developer & Artist',
  desc :'Web Audio API로 실시간 사운드를 분석해 유기적 비주얼을 만드는 미디어 아트...',
  tech :'TypeScript, p5.js, Web Audio API, GLSL, Vite',
  img:projectFlowfieldImg}];
projects.forEach((p,i)=>{
  const g=new THREE.Group(); g.visible=false; g.position.z=-100*(i+1);
  const img=new THREE.Mesh(new THREE.PlaneGeometry(16,9),mkShaderMat(p.img)); img.position.set(-18,1,-8);
  g.userData.shader=[img.material.uniforms.u_opacity];
  const tTitle=makeText(p.title,2); tTitle.anchorX='left'; tTitle.position.set(0,6.5,-8);
  const tRole =makeText(p.role,1,0x00bfff); tRole.anchorX='left'; tRole.position.set(0,4,-8);
  const tDesc =makeText(p.desc,1,0xcccccc); tDesc.anchorX='left'; tDesc.maxWidth=20; tDesc.lineHeight=1.5; tDesc.position.set(0,0.5,-8);
  const tLab  =makeText('Tech:',1); tLab.anchorX='left'; tLab.position.z=-8;
  const tTech =makeText(p.tech,0.9,0xcccccc); tTech.anchorX='left'; tTech.maxWidth=20; tTech.lineHeight=1.5; tTech.position.z=-8;
  g.userData.txt=[tTitle.material,tRole.material,tDesc.material,tLab.material,tTech.material];
  tDesc.sync(()=>{const h=tDesc.geometry.boundingBox.max.y - tDesc.geometry.boundingBox.min.y;
    tLab.position.set(0,tDesc.position.y-h-1.5,-8); tTech.position.set(0,tLab.position.y-1.2,-8);});
  g.add(img,tTitle,tRole,tDesc,tLab,tTech); projectsGrp.add(g);
});

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
tl.to(spark.material,{opacity:1,size:0.4,duration:0.5},'star');
tl.to(camera.position,{z:26,duration:8,ease:'power2.inOut'},'star');   // ★ 카메라 z 26
tl.to(spark.position,{z:10,duration:8,ease:'power2.inOut'},'star');   // ★ Spark z 10
tl.to(spark.material,{size:0.9,duration:8,ease:'power2.inOut'},'star');
tl.to(spark.material,{opacity:0,size:0.4,duration:1.8,ease:'sine.in'},'star+=6.5');
tl.set(spark,{visible:false},'star+=8');

/* Act2 – HUD in */
coordTxt.position.set(-28,0,-4);
idTxt  .position.set(0,0,-4);
coreTxt.position.set(28,0,-4);
tl.addLabel('hud');
tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:1,duration:8,stagger:0.5},'hud');
tl.to({}, {duration:10});

/* Act3 – 합류 + ACCESS */
tl.to([coordTxt.position,idTxt.position,coreTxt.position],{x:0,duration:8,ease:'power2.in'},'merge');
tl.to([coordTxt.material,idTxt.material,coreTxt.material],{opacity:0,duration:5,ease:'power2.out'},'merge+=0.2');
tl.to(accessTxt.material,{opacity:1,duration:3},'>-2');
tl.to({}, {duration:8});

/* Act4 – Profile */
tl.addLabel('profile');
tl.to(accessTxt.material,{opacity:0,duration:3},'profile');
profileGrp.visible=true;
vLine.position.set(-7,0,-6); profilePlane.position.set(-15,0,-6);
pTitle .position.set(-1,4,-6); pSlogan.position.set(-1,0.5,-6);
emailL .position.set(-1,-3,-6); emailV .position.set(2.5,-3,-6);
gitL   .position.set(-1,-4.5,-6); gitV   .position.set(3.2,-4.5,-6);
tl.to(camera.position,{x:-7,duration:6,ease:'power2.inOut'},'profile');
tl.from(vLine.scale,{y:0,duration:5,ease:'power2.out'},'profile+=1')
  .to(vLine.material,{opacity:.3,duration:5},'<')
  .to(profilePlane.material.uniforms.u_opacity,{value:1,duration:8},'profile+=2')
  .to(profileMats,{opacity:1,duration:5,stagger:0.4},'profile+=4')
  .to(vLine.material,{opacity:0,duration:5},'>')
  .to({}, {duration:15});

/* Act5 – Projects */
tl.addLabel('projects');
tl.to([...profileMats,vLine.material],{opacity:0,duration:4,ease:'power2.out'},'projects');
tl.to(profilePlane.material.uniforms.u_opacity,{value:0,duration:4,ease:'power2.out'},'<');
projectsGrp.children.forEach((g,i)=>{
  const viewZ=g.position.z+30;
  tl.to(camera.position,{x:0,y:0,z:viewZ,duration:15,ease:'power2.inOut'});
  tl.set(g,{visible:true},'>');
  tl.to(g.userData.shader,{value:1,duration:8,stagger:.2},'<');
  tl.to(g.userData.txt,{opacity:1,duration:8,stagger:.2},'<');
  tl.to({}, {duration:20});
  if(i<projectsGrp.children.length-1){
    tl.to(g.userData.shader,{value:0,duration:8,stagger:.05});
    tl.to(g.userData.txt,{opacity:0,duration:8,stagger:.05},'<');
    tl.set(g,{visible:false},'>');
  }
});

/* ── Render loop ─────────────────────────────────────── */
function animate(){
  requestAnimationFrame(animate);

  twinkleGrp.children.forEach(tw=>{
    if(!tw.isTwinkling && Math.random()>.998){
      tw.isTwinkling=true;
      const d=Math.random()*0.5+0.5;
      gsap.to(tw.scale,{x:1.5,y:1.5,duration:d,yoyo:true,repeat:1,ease:'power2.out',onComplete:()=>tw.isTwinkling=false});
      gsap.to(tw.material,{opacity:0.8,duration:d,yoyo:true,repeat:1,ease:'power2.out'});
    }
  });
  if(Math.random()<0.003 && !shooting) fireStar();
  composer.render();
}
animate();
