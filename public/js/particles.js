import * as THREE from '/node_modules/three/build/three.module.js';

const container = document.body;
const canvas = document.getElementById('particle-canvas');

let scene, camera, renderer, points;
const particleCount = 5000;
const positions = [];
const colors = [];
const themeColors = [
    new THREE.Color(0x8052ff), // Plum Voltage
    new THREE.Color(0xffffff), // Bone
    new THREE.Color(0xffb829), // Amber Spark
    new THREE.Color(0x15846e)  // Lichen
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
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i++) {
        // --- SOUL (Sphere) ---
        const phi = Math.acos(-1 + (2 * i) / particleCount);
        const theta = Math.sqrt(particleCount * Math.PI) * phi;
        shapes.soul.push(
            2 * Math.cos(theta) * Math.sin(phi),
            2 * Math.sin(theta) * Math.sin(phi),
            2 * Math.cos(phi)
        );

        // --- PLATE ---
        // A disc with a slightly upturned rim
        const r = Math.sqrt(Math.random()) * 2.5;
        const angle = Math.random() * Math.PI * 2;
        const pX = r * Math.cos(angle);
        const pZ = r * Math.sin(angle);
        let pY = 0;
        if (r > 2.0) pY = (r - 2.0) * 0.5; // Rim
        shapes.plate.push(pX, pY - 0.5, pZ);

        // --- TABLE ---
        // Top (approx 70% of particles)
        if (i < particleCount * 0.7) {
            shapes.table.push(
                (Math.random() - 0.5) * 4, // Width
                0.5,                       // Height (Top)
                (Math.random() - 0.5) * 3  // Depth
            );
        } else {
            // Legs
            const legIndex = i % 4;
            const legX = legIndex < 2 ? 1.8 : -1.8;
            const legZ = legIndex % 2 === 0 ? 1.3 : -1.3;
            shapes.table.push(
                legX,
                (Math.random() * 2.5) - 2.0, // Leg height from -2 to 0.5
                legZ
            );
        }

        // --- QR CODE ---
        const gridSize = Math.floor(Math.sqrt(particleCount));
        const col = i % gridSize;
        const row = Math.floor(i / gridSize);
        let qx = (col / gridSize - 0.5) * 4;
        let qy = (row / gridSize - 0.5) * 4;
        let qz = (Math.random() - 0.5) * 0.1;

        // Add distinctive QR finder patterns (corners)
        const margin = 7;
        const isFinder = (
            (col <= margin && row <= margin) ||
            (col >= gridSize - margin - 1 && row <= margin) ||
            (col <= margin && row >= gridSize - margin - 1)
        );

        if (isFinder) {
            qz += 0.3; // Make corners pop
        }

        shapes.qrcode.push(qx, qy, qz);

        // Initial Position (Soul)
        positions.push(shapes.soul[i*3], shapes.soul[i*3+1], shapes.soul[i*3+2]);

        const color = themeColors[Math.floor(Math.random() * themeColors.length)];
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
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let scrollPercent = 0;
function onScroll() {
    const h = document.documentElement,
          b = document.body,
          st = 'scrollTop',
          sh = 'scrollHeight';
    scrollPercent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0001;
    // Rotate less for QR code so it stays readable-ish
    const rotationSpeed = scrollPercent > 0.8 ? 0.1 : 0.5;
    points.rotation.y = time * rotationSpeed;

    // Auto-tilt based on scroll
    points.rotation.x = (scrollPercent * Math.PI * 0.5) * 0.2;

    const posAttr = points.geometry.attributes.position;

    let targetA, targetB, t;
    if (scrollPercent < 0.33) {
        targetA = shapes.soul;
        targetB = shapes.plate;
        t = scrollPercent / 0.33;
    } else if (scrollPercent < 0.66) {
        targetA = shapes.plate;
        targetB = shapes.table;
        t = (scrollPercent - 0.33) / 0.33;
    } else {
        targetA = shapes.table;
        targetB = shapes.qrcode;
        t = (scrollPercent - 0.66) / 0.34;
    }

    for (let i = 0; i < particleCount * 3; i++) {
        const cur = posAttr.array[i];
        const dest = targetA[i] + (targetB[i] - targetA[i]) * t;
        posAttr.array[i] += (dest - cur) * 0.08; // Smooth interpolation
    }

    posAttr.needsUpdate = true;
    renderer.render(scene, camera);
}

init();
