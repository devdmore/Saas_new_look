import * as THREE from '/js/lib/three/three.module.js';

const container = document.body;
const canvas = document.getElementById('particle-canvas');

let scene, camera, renderer, points;
const particleCount = 12000;
const positions = [];
const colors = [];
const themeColors = [
    new THREE.Color(0x8052ff), // Plum Voltage
    new THREE.Color(0xffffff), // Bone
    new THREE.Color(0x9a9a9a)  // Smoke
];

// Shape definitions
const shapes = {
    soul: [],    // Sphere
    plate: [],   // Disc/Plate
    table: [],   // Table
    qrcode: []   // Grid
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i++) {
        // --- SOUL (Sphere) ---
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        shapes.soul.push(
            2.5 * Math.cos(theta) * Math.sin(phi),
            2.5 * Math.sin(theta) * Math.sin(phi),
            2.5 * Math.cos(phi)
        );

        // --- PLATE ---
        const r = Math.sqrt(Math.random()) * 3.2;
        const angle = Math.random() * Math.PI * 2;
        let pX = r * Math.cos(angle);
        let pZ = r * Math.sin(angle);
        let pY = 0;
        // High density rim
        if (r > 2.8) {
            pY = (r - 2.8) * 1.5;
        } else if (r > 2.5) {
            pY = (r - 2.5) * 0.5;
        } else if (r < 0.6) {
            pY = -0.15;
        }
        shapes.plate.push(pX, pY - 0.5, pZ);

        // --- TABLE ---
        if (i < particleCount * 0.7) {
            // Table Top (with thickness)
            const isEdge = i > particleCount * 0.65;
            shapes.table.push(
                (Math.random() - 0.5) * 5.5,
                0.8 + (isEdge ? (Math.random() - 0.5) * 0.2 : 0),
                (Math.random() - 0.5) * 3.8
            );
        } else {
            // Legs
            const legIdx = i % 4;
            const legPos = [[2.4, 1.6], [-2.4, 1.6], [2.4, -1.6], [-2.4, -1.6]];
            const [lx, lz] = legPos[legIdx];
            const radius = 0.12;
            const a = Math.random() * Math.PI * 2;
            const d = Math.random() * radius;
            shapes.table.push(
                lx + Math.cos(a) * d,
                (Math.random() * 3.8) - 3.0,
                lz + Math.sin(a) * d
            );
        }

        // --- QR CODE ---
        const gridSize = 80;
        const col = i % gridSize;
        const row = Math.floor((i / particleCount) * gridSize);
        let qx = (col / gridSize - 0.5) * 5.5;
        let qy = (row / gridSize - 0.5) * 5.5;
        let qz = (Math.random() - 0.5) * 0.02;

        const isFinder = (
            (col < 12 && row < 12) ||
            (col > gridSize - 13 && row < 12) ||
            (col < 12 && row > gridSize - 13)
        );

        if (isFinder) {
            qz += (Math.random() * 0.8);
        }

        shapes.qrcode.push(qx, qy, qz);

        // Initial Position
        positions.push(shapes.soul[i*3], shapes.soul[i*3+1], shapes.soul[i*3+2]);

        const color = themeColors[i % themeColors.length];
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.025,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('mousemove', onMouseMove);
    animate();
}

let mouseX = 0, mouseY = 0;
function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let scrollPercent = 0;
let targetScrollPercent = 0;
function onScroll() {
    const h = document.documentElement,
          st = 'scrollTop',
          sh = 'scrollHeight';
    const totalHeight = h[sh] - h.clientHeight;
    if (totalHeight <= 0) return;
    targetScrollPercent = h[st] / totalHeight;
    targetScrollPercent = Math.max(0, Math.min(1, targetScrollPercent));
}

function animate() {
    requestAnimationFrame(animate);

    scrollPercent += (targetScrollPercent - scrollPercent) * 0.1;
    const time = Date.now() * 0.0005;

    // --- Advanced Camera Pathing ---
    let targetCamX = mouseX * 2.5;
    let targetCamY = -mouseY * 2.5;
    let targetCamZ = 6;
    let targetLookAtY = 0;

    if (scrollPercent < 0.1) {
        targetCamZ = 6;
    } else if (scrollPercent < 0.5) {
        targetCamY += 3;
        targetCamZ = 5.5;
        targetLookAtY = -0.5;
    } else if (scrollPercent < 0.8) {
        targetCamX += 4;
        targetCamY += 2;
        targetCamZ = 6.5;
    } else {
        targetCamX = 0;
        targetCamY = 0;
        targetCamZ = 5;
    }

    camera.position.x += (targetCamX - camera.position.x) * 0.04;
    camera.position.y += (targetCamY - camera.position.y) * 0.04;
    camera.position.z += (targetCamZ - camera.position.z) * 0.04;

    const currentLookAt = new THREE.Vector3(0, targetLookAtY, 0);
    camera.lookAt(currentLookAt);

    // --- Morphing Logic ---
    const posAttr = points.geometry.attributes.position;
    let targetA, targetB, t;

    if (scrollPercent < 0.1) {
        targetA = shapes.soul; targetB = shapes.soul; t = 0;
    } else if (scrollPercent < 0.3) {
        targetA = shapes.soul; targetB = shapes.plate; t = (scrollPercent - 0.1) / 0.2;
    } else if (scrollPercent < 0.5) {
        targetA = shapes.plate; targetB = shapes.plate; t = 0;
    } else if (scrollPercent < 0.7) {
        targetA = shapes.plate; targetB = shapes.table; t = (scrollPercent - 0.5) / 0.2;
    } else if (scrollPercent < 0.9) {
        targetA = shapes.table; targetB = shapes.table; t = 0;
    } else {
        targetA = shapes.table; targetB = shapes.qrcode; t = (scrollPercent - 0.9) / 0.1;
    }

    const easedT = t * t * (3 - 2 * t);

    // --- Stabilized Rotation Logic ---
    const slowTime = Date.now() * 0.00005; // Even slower
    let rotationStrength = 1.0;
    if (easedT < 0.3 || easedT > 0.7) {
        rotationStrength = 0.05; // Nearly still when resting
    }
    if (scrollPercent > 0.95) rotationStrength = 0;

    points.rotation.y = slowTime * rotationStrength * 0.5;
    points.rotation.z = slowTime * rotationStrength * 0.1;

    for (let i = 0; i < particleCount * 3; i++) {
        const cur = posAttr.array[i];
        const dest = targetA[i] + (targetB[i] - targetA[i]) * easedT;
        let pulse = 0;
        if (scrollPercent < 0.1) {
            pulse = Math.sin(time * 2 + i) * 0.01;
        }
        posAttr.array[i] += (dest + pulse - cur) * 0.12;
    }

    posAttr.needsUpdate = true;
    renderer.render(scene, camera);
}

init();
