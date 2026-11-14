/**
 * Weave Silk Generative Canvas
 * Symmetrical ambient particle art with smooth mouse/touch strokes.
 * Low-stimulation, zero-score, anti-brain-rot digital zen experience.
 */

export function initSilkCanvas(container) {
  container.innerHTML = `
    <div class="native-canvas-wrapper" style="background: #050a08; position: relative;">
      <canvas id="silkCanvas" class="native-canvas"></canvas>
      <div class="canvas-toolbar">
        <span style="font-size: 0.8rem; color: var(--sage-300); font-weight: 600;">Symmetry:</span>
        <button class="canvas-tool-btn" data-sym="2">2x</button>
        <button class="canvas-tool-btn" data-sym="4">4x</button>
        <button class="canvas-tool-btn active" data-sym="6">6x</button>
        <button class="canvas-tool-btn" data-sym="8">8x</button>
        <div style="width: 1px; height: 16px; background: var(--border-subtle); margin: 0 4px;"></div>
        <button id="btnSilkColor" class="canvas-tool-btn">🎨 Palette</button>
        <button id="btnSilkClear" class="canvas-tool-btn">🧹 Clear</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#silkCanvas');
  const ctx = canvas.getContext('2d');
  let width, height, centerX, centerY;
  let symmetry = 6;
  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let hue = 150; // Sage / emerald green starting point

  const palettes = [
    { name: 'Sage & Emerald', baseHue: 150, range: 40 },
    { name: 'Deep Cyan & Ocean', baseHue: 190, range: 35 },
    { name: 'Amethyst & Aurora', baseHue: 270, range: 45 },
    { name: 'Golden Sol', baseHue: 42, range: 30 }
  ];
  let currentPaletteIdx = 0;

  function resize() {
    width = canvas.width = container.clientWidth || window.innerWidth;
    height = canvas.height = container.clientHeight || (window.innerHeight - 70);
    centerX = width / 2;
    centerY = height / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Deep calming dark backdrop
    ctx.fillStyle = '#050a08';
    ctx.fillRect(0, 0, width, height);
  }

  resize();
  window.addEventListener('resize', resize);

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left - centerX,
      y: clientY - rect.top - centerY
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    const curX = pos.x;
    const curY = pos.y;

    const angleStep = (Math.PI * 2) / symmetry;
    const p = palettes[currentPaletteIdx];
    hue = (hue + 0.3) % 360;
    const currentHue = p.baseHue + (Math.sin(Date.now() / 800) * p.range);

    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < symmetry; i++) {
      ctx.rotate(angleStep);

      // Main silk beam
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(curX, curY);
      ctx.strokeStyle = `hsla(${currentHue}, 75%, 65%, 0.18)`;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${currentHue}, 80%, 55%, 0.4)`;
      ctx.stroke();

      // Ambient particle glow reflection
      ctx.beginPath();
      ctx.moveTo(-lastX, lastY);
      ctx.lineTo(-curX, curY);
      ctx.strokeStyle = `hsla(${currentHue + 15}, 80%, 75%, 0.12)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();

    lastX = curX;
    lastY = curY;
  }

  function stopDraw() {
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: true });
  canvas.addEventListener('touchmove', draw, { passive: true });
  window.addEventListener('touchend', stopDraw);

  // Symmetry buttons
  container.querySelectorAll('[data-sym]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-sym]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      symmetry = parseInt(btn.dataset.sym, 10);
    });
  });

  // Palette button
  const colorBtn = container.querySelector('#btnSilkColor');
  colorBtn.addEventListener('click', () => {
    currentPaletteIdx = (currentPaletteIdx + 1) % palettes.length;
    colorBtn.textContent = `🎨 ${palettes[currentPaletteIdx].name}`;
  });

  // Clear button
  container.querySelector('#btnSilkClear').addEventListener('click', () => {
    ctx.fillStyle = '#050a08';
    ctx.fillRect(0, 0, width, height);
  });

  // Clean-up handler
  return function destroy() {
    window.removeEventListener('resize', resize);
    window.removeEventListener('mouseup', stopDraw);
    window.removeEventListener('touchend', stopDraw);
  };
}
