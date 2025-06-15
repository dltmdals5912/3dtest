import * as THREE from 'three';
import { gsap } from 'gsap';

const texLoader = new THREE.TextureLoader();
const loadTex = u => texLoader.load(u);

function createStars(N, size, dist) {
    const v = [];
    for (let i = 0; i < N; i++) v.push((Math.random() - .5) * dist, (Math.random() - .5) * dist, (Math.random() - .5) * dist);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size,
        transparent: true,
        opacity: 0.7
    }));
}

function createSpark() {
    return new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
        new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        })
    );
}

function createTwinkles() {
    const twinkleGrp = new THREE.Group();
    const twinkleTex = loadTex('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/disc.png');
    for (let i = 0; i < 150; i++) {
        const m = new THREE.MeshBasicMaterial({
            map: twinkleTex,
            color: 0xffffff,
            transparent: true,
            opacity: Math.random() * 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
        const R = 300,
            r = R * Math.sqrt(Math.random()),
            th = Math.random() * Math.PI * 2;
        q.position.set(r * Math.cos(th), r * Math.sin(th), (Math.random() - .5) * R);
        q.isTwinkling = false;
        twinkleGrp.add(q);
    }
    return twinkleGrp;
}

function createShootingStar() {
    return new THREE.Points(
        new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
        new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        })
    );
}

export function setupBackground(scene) {
    const starfield = createStars(1500, 1.5, 1500);
    scene.add(starfield);

    const spark = createSpark();
    spark.position.set(0, 0, -300);
    scene.add(spark);

    const twinkleGrp = createTwinkles();
    scene.add(twinkleGrp);

    const shootingStar = createShootingStar();
    scene.add(shootingStar);

    return { starfield, spark, twinkleGrp, shootingStar };
}

let shooting = false;
function fireStar(shootingStar) {
    if (shooting) return;
    shooting = true;
    const sx = Math.random() * 200 - 100,
        ex = Math.random() * 200 - 100,
        z = Math.random() * -400 - 100;
    shootingStar.position.set(sx, 100, z);
    shootingStar.material.opacity = 1;
    gsap.to(shootingStar.position, {
        x: ex,
        y: -100,
        duration: Math.random() * 1.5 + .5,
        ease: 'power2.in',
        onComplete: () => {
            shootingStar.material.opacity = 0;
            shooting = false;
        }
    });
}

export function animateBackground(elements, t) {
    const { twinkleGrp, shootingStar } = elements;

    twinkleGrp.children.forEach(q => {
        if (!q.isTwinkling && Math.random() > .998) {
            q.isTwinkling = true;
            const d = Math.random() * 0.5 + 0.5;
            gsap.to(q.scale, { x: 1.5, y: 1.5, duration: d, yoyo: true, repeat: 1, ease: 'power2.out', onComplete: () => { q.isTwinkling = false; } });
            gsap.to(q.material, { opacity: 0.8, duration: d, yoyo: true, repeat: 1, ease: 'power2.out' });
        }
    });

    if (Math.random() < 0.003 && !shooting) {
        fireStar(shootingStar);
    }
}
