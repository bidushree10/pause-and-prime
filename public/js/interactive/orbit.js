/**
 * STEM Gravitational Orbit Simulator
 * Interactive N-body orbital mechanics sandbox.
 * Demonstrates gravitational attraction, orbital momentum, and Keplerian paths.
 */

export function initOrbitSandbox(container) {
  container.innerHTML = `
    <div class="native-canvas-wrapper" style="background: #040807; position: relative;">
      <canvas id="orbitCanvas" class="native-canvas"></canvas>
      <div class="canvas-toolbar">
        <span style="font-size: 0.8rem; color: var(--sage-300); font-weight: 600;">STEM Gravity:</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Click & drag to launch orbital satellite</span>
        <div style="width: 1px; height: 16px; background: var(--border-subtle); margin: 0 4px;"></div>
        <button id="btnOrbitPreset" class="canvas-tool-btn">🪐 Preset Solar</button>
        <button id="btnOrbitClear" class="canvas-tool-btn">🧹 Clear</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#orbitCanvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  const G = 0.8; // Gravitational constant

  let sun = { x: 0, y: 0, mass: 2800, radius: 18, color: '#fbbf24' };
  let bodies = [];
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCurrent = { x: 0, y: 0 };

  function resize() {
    width = canvas.width = container.clientWidth || window.innerWidth;
    height = canvas.height = container.clientHeight || (window.innerHeight - 70);
    sun.x = width / 2;
    sun.y = height / 2;
  }

  function setupSolarPreset() {
    bodies = [
      { x: sun.x, y: sun.y - 120, vx: 4.1, vy: 0, mass: 10, radius: 4, color: '#34d399', trail: [] },
      { x: sun.x, y: sun.y - 190, vx: 3.3, vy: 0, mass: 15, radius: 6, color: '#60a5fa', trail: [] },
      { x: sun.x, y: sun.y - 280, vx: 2.7, vy: 0, mass: 25, radius: 8, color: '#f59e0b', trail: [] }
    ];
  }

  resize();
  setupSolarPreset();
  window.addEventListener('resize', resize);

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart = getMousePos(e);
    dragCurrent = { ...dragStart };
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    dragCurrent = getMousePos(e);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    // Velocity is proportional to drag vector
    const vx = (dragStart.x - dragCurrent.x) * 0.045;
    const vy = (dragStart.y - dragCurrent.y) * 0.045;

    bodies.push({
      x: dragStart.x,
      y: dragStart.y,
      vx,
      vy,
      mass: 8 + Math.random() * 8,
      radius: 5,
      color: `hsl(${140 + Math.random() * 70}, 80%, 65%)`,
      trail: []
    });
  });

  let animId;
  function updatePhysics() {
    // Semi-transparent background creates subtle motion blur
    ctx.fillStyle = 'rgba(4, 8, 7, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // Draw Sun
    ctx.save();
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    ctx.fillStyle = sun.color;
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#f59e0b';
    ctx.fill();
    ctx.restore();

    // Update & draw planets
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];

      // Gravity towards sun
      const dx = sun.x - b.x;
      const dy = sun.y - b.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      if (dist < sun.radius + b.radius) {
        // Collided with sun
        bodies.splice(i, 1);
        continue;
      }

      const force = (G * sun.mass) / Math.max(distSq, 100);
      const ax = (dx / dist) * force;
      const ay = (dy / dist) * force;

      b.vx += ax * 0.08;
      b.vy += ay * 0.08;

      b.x += b.vx;
      b.y += b.vy;

      // Update orbital trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 70) b.trail.shift();

      // Draw trail
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.strokeStyle = `rgba(52, 211, 153, 0.25)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Draw Planet
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      ctx.fill();
      ctx.restore();
    }

    // Draw trajectory arrow while dragging
    if (isDragging) {
      ctx.beginPath();
      ctx.moveTo(dragStart.x, dragStart.y);
      ctx.lineTo(dragCurrent.x, dragCurrent.y);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start circle
      ctx.beginPath();
      ctx.arc(dragStart.x, dragStart.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
    }

    animId = requestAnimationFrame(updatePhysics);
  }

  animId = requestAnimationFrame(updatePhysics);

  container.querySelector('#btnOrbitPreset').addEventListener('click', () => {
    setupSolarPreset();
  });

  container.querySelector('#btnOrbitClear').addEventListener('click', () => {
    bodies = [];
  });

  return function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}
