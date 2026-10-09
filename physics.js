/**
 * CHAOS CLICK - 2D DOM PHYSICS ENGINE & PARTICLE SYSTEM
 * Provides fluid rigid body mechanics for detached DOM elements,
 * mouse grabbing & flinging, wall collisions, particle FX, and vortex simulation.
 */

class ChaosPhysics {
  constructor() {
    this.bodies = [];
    this.particles = [];
    this.canvas = document.getElementById('fx-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.gravity = 0.45;
    this.gravityDirection = 1; // 1 = down, -1 = up, 0 = zero-g
    this.restitution = 0.72; // bounciness
    this.friction = 0.99;
    
    // Dragging state
    this.grabbedBody = null;
    this.dragOffset = { x: 0, y: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.mouseVelocity = { x: 0, y: 0 };

    // Singularity mode
    this.singularityActive = false;
    this.singularityCenter = { x: 0, y: 0 };

    this.initCanvas();
    this.initEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.singularityCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    };
    resize();
    window.addEventListener('resize', resize);
  }

  initEvents() {
    // Mouse tracking for flinging
    window.addEventListener('mousemove', (e) => {
      this.mouseVelocity.x = (e.clientX - this.lastMouse.x);
      this.mouseVelocity.y = (e.clientY - this.lastMouse.y);
      this.lastMouse.x = e.clientX;
      this.lastMouse.y = e.clientY;

      if (this.grabbedBody) {
        this.grabbedBody.x = e.clientX - this.dragOffset.x;
        this.grabbedBody.y = e.clientY - this.dragOffset.y;
        this.grabbedBody.vx = this.mouseVelocity.x * 0.8;
        this.grabbedBody.vy = this.mouseVelocity.y * 0.8;
        this.updateElementTransform(this.grabbedBody);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.grabbedBody) {
        this.grabbedBody.vx = Math.max(-30, Math.min(30, this.mouseVelocity.x * 1.2));
        this.grabbedBody.vy = Math.max(-30, Math.min(30, this.mouseVelocity.y * 1.2));
        this.grabbedBody.vAngle = (Math.random() - 0.5) * 15;
        this.grabbedBody = null;
      }
    });
  }

  /**
   * Detach a DOM element into a 2D physics rigid body
   */
  detachElement(el, impulseX = 0, impulseY = 0) {
    if (el.classList.contains('physics-detached')) return null;

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    // Lock fixed dimensions
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    el.classList.add('physics-detached');

    const body = {
      el: el,
      x: rect.left,
      y: rect.top,
      vx: impulseX || (Math.random() - 0.5) * 16,
      vy: impulseY || -(Math.random() * 8 + 4),
      angle: 0,
      vAngle: (Math.random() - 0.5) * 10,
      width: rect.width,
      height: rect.height,
      mass: parseFloat(el.dataset.weight || 2),
      scale: 1
    };

    // Make element draggable
    el.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.grabbedBody = body;
      this.dragOffset.x = e.clientX - body.x;
      this.dragOffset.y = e.clientY - body.y;
      body.vx = 0;
      body.vy = 0;
      body.vAngle = 0;
      if (window.chaosAudio) window.chaosAudio.playClickBlip(20);
    });

    this.bodies.push(body);
    this.updateElementTransform(body);
    return body;
  }

  updateElementTransform(b) {
    b.el.style.left = `${b.x}px`;
    b.el.style.top = `${b.y}px`;
    b.el.style.transform = `rotate(${b.angle}deg) scale(${b.scale})`;
  }

  /**
   * Spawn particle burst on click
   */
  spawnClickParticles(x, y, count = 18) {
    const emojis = ['⚡', '💥', '✨', '🌀', '💀', '🔥', '⚠️', '🤪'];
    const colors = ['#60a5fa', '#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#ffffff'];

    // Emojis float upward
    if (Math.random() > 0.4) {
      this.particles.push({
        type: 'emoji',
        char: emojis[Math.floor(Math.random() * emojis.length)],
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 6 - 3,
        alpha: 1,
        life: 1,
        decay: 0.02,
        size: 24 + Math.random() * 12
      });
    }

    // Sparkle fragments
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 2;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  /**
   * Main Physics Animation Loop
   */
  animate() {
    this.updatePhysics();
    this.drawCanvas();
    requestAnimationFrame(this.animate);
  }

  updatePhysics() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const hudHeight = 64;

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b === this.grabbedBody) continue;

      if (this.singularityActive) {
        // Gravitational vortex pull
        const dx = this.singularityCenter.x - (b.x + b.width / 2);
        const dy = this.singularityCenter.y - (b.y + b.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = Math.min(25, 1200 / (dist + 50));

        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force;
        b.vAngle += 3;
        b.scale = Math.max(0.05, b.scale * 0.985);

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;
        this.updateElementTransform(b);
        continue;
      }

      // Normal Gravity
      b.vy += this.gravity * this.gravityDirection * (b.mass * 0.5 + 0.5);
      b.vx *= this.friction;
      b.vy *= this.friction;

      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.vAngle;
      b.vAngle *= 0.98;

      let collided = false;

      // Floor collision
      if (this.gravityDirection >= 0 && b.y + b.height > screenH) {
        b.y = screenH - b.height;
        if (Math.abs(b.vy) > 1.5) collided = true;
        b.vy = -b.vy * this.restitution;
        b.vAngle *= 0.7;
      }

      // Ceiling collision (under HUD)
      if (b.y < hudHeight) {
        b.y = hudHeight;
        if (Math.abs(b.vy) > 1.5) collided = true;
        b.vy = -b.vy * this.restitution;
      }

      // Left wall
      if (b.x < 0) {
        b.x = 0;
        if (Math.abs(b.vx) > 1.5) collided = true;
        b.vx = -b.vx * this.restitution;
      }

      // Right wall
      if (b.x + b.width > screenW) {
        b.x = screenW - b.width;
        if (Math.abs(b.vx) > 1.5) collided = true;
        b.vx = -b.vx * this.restitution;
      }

      if (collided && window.chaosAudio) {
        const intensity = Math.min(2.5, Math.abs(b.vy) / 6);
        window.chaosAudio.playBounce(intensity);
      }

      this.updateElementTransform(b);
    }
  }

  drawCanvas() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Singularity Vortex rendering
    if (this.singularityActive) {
      const cx = this.singularityCenter.x;
      const cy = this.singularityCenter.y;
      const t = Date.now() * 0.005;

      const gradient = this.ctx.createRadialGradient(cx, cy, 10, cx, cy, 320);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.3, 'rgba(147, 51, 234, 0.8)');
      gradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.4)');
      gradient.addColorStop(1, 'transparent');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 320, 0, Math.PI * 2);
      this.ctx.fill();

      // Swirling spiral lines
      this.ctx.save();
      this.ctx.translate(cx, cy);
      this.ctx.rotate(t * 3);
      for (let i = 0; i < 6; i++) {
        this.ctx.rotate((Math.PI * 2) / 6);
        this.ctx.strokeStyle = `hsl(${(t * 40 + i * 60) % 360}, 100%, 70%)`;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.quadraticCurveTo(80, 140, 250, 0);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // Update & draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;
      p.alpha = Math.max(0, p.life);

      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'spark') {
        p.vy += 0.2; // gravity
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else if (p.type === 'emoji') {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.font = `${p.size}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(p.char, p.x, p.y);
        this.ctx.restore();
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  invertGravity() {
    this.gravityDirection = this.gravityDirection === 1 ? -1 : 1;
    this.bodies.forEach(b => {
      b.vy = -b.vy * 1.5;
    });
  }

  resetAll() {
    this.singularityActive = false;
    this.particles = [];
    this.gravityDirection = 1;
    this.bodies.forEach(b => {
      b.el.classList.remove('physics-detached');
      b.el.style.position = '';
      b.el.style.left = '';
      b.el.style.top = '';
      b.el.style.width = '';
      b.el.style.height = '';
      b.el.style.transform = '';
      b.scale = 1;
    });
    this.bodies = [];
  }
}

// Global physics instance
window.chaosPhysics = new ChaosPhysics();
