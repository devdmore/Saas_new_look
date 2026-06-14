const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 1000;
const colors = ['#8052ff', '#ffb829', '#15846e', '#ffffff'];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = Math.floor(Math.random() * 4); // 0: circle, 1: triangle, 2: diamond, 3: square
        this.alpha = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();

        switch(this.shape) {
            case 0: // circle
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                break;
            case 1: // triangle
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                break;
            case 2: // diamond
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y);
                ctx.lineTo(this.x, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y);
                break;
            case 3: // square
                ctx.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                break;
        }

        ctx.fill();
        ctx.closePath();
    }
}

function init() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

init();
animate();

// Create clusters on click
window.addEventListener('mousedown', (e) => {
    for(let i=0; i<50; i++) {
        const p = new Particle();
        p.x = e.clientX;
        p.y = e.clientY;
        p.speedX = (Math.random() - 0.5) * 4;
        p.speedY = (Math.random() - 0.5) * 4;
        particles.shift();
        particles.push(p);
    }
});
