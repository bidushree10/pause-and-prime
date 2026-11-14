/**
 * Zen Sand & Ripple Garden
 * Rake smooth grooves in digital sand and create calming harmonic water ripples.
 */

export function initZenGarden(container, audioCtx) {
  container.innerHTML = `
    <div class="native-canvas-wrapper" style="background: #0f1c19; position: relative;">
      <canvas id="zenCanvas" class="native-canvas"></canvas>
      <div class="canvas-toolbar">
        <span style="font-size: 0.8rem; color: var(--sage-300); font-weight: 600;">Tool:</span>
        <button id="toolRake" class="canvas-tool-btn active">🎋 Sand Rake</button>
        <button id="toolStone" class="canvas-tool-btn">🪨 Drop Stone</button>
        <button id="toolRipple" class="canvas-tool-btn">💧 Ripple</button>
        <div style="width: 1px; height: 16px; background: var(--border-subtle); margin: 0 4px;"></div>
        <button id="btnZenSmooth" class="canvas-tool-btn">🌊 Smooth Sand</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#zenCanvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let activeTool = 'rake';
  let isInteracting = false;
  let lastX = 0, lastY = 0;

  const stones = [];
  const ripples = [];

  function resize() {
    width = canvas.width = container.clientWidth || window.innerWidth;
    height = canvas.height = container.clientHeight || (window.innerHeight - 70);
    drawBaseSand();
  }

  function drawBaseSand() {
    // Warm, muted dark sage-sand texture
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#101d19');
    grad.addColorStop(1, '#0b1613');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Initial ambient sand waves
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < width; x += 30) {
        ctx.quadraticCurveTo(x + 15, y + Math.sin(x * 0.02) * 6, x + 30, y);
      }
      ctx.stroke();
    }
  }

  resize();
  window.addEventListener('resize', resize);

  function playSoftChime(freq = 440) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function interact(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (activeTool === 'rake' && isInteracting) {
      // Rake concentric / grooved pattern
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
      ctx.lineWidth = 2.5;
      const rakeProngs = [-12, -6, 0, 6, 12];
      const dx = x - lastX;
      const dy = y - lastY;
      const angle = Math.atan2(dy, dx) + Math.PI / 2;

      rakeProngs.forEach(offset => {
        const ox = Math.cos(angle) * offset;
        const oy = Math.sin(angle) * offset;
        ctx.beginPath();
        ctx.moveTo(lastX + ox, lastY + oy);
        ctx.lineTo(x + ox, y + oy);
        ctx.stroke();
      });

      lastX = x;
      lastY = y;
    }
  }

  function handlePointerDown(e) {
    isInteracting = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastX = clientX - rect.left;
    lastY = clientY - rect.top;

    if (activeTool === 'stone') {
      stones.push({ x: lastX, y: lastY, r: 18 + Math.random() * 8 });
      ripples.push({ x: lastX, y: lastY, r: 5, maxR: 70, alpha: 0.6 });
      playSoftChime(320 + Math.random() * 200);
    } else if (activeTool === 'ripple') {
      ripples.push({ x: lastX, y: lastY, r: 5, maxR: 120, alpha: 0.7 });
      playSoftChime(520 + Math.random() * 150);
    }
  }

  function handlePointerUp() {
    isInteracting = false;
  }

  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', interact);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
  canvas.addEventListener('touchmove', interact, { passive: true });
  window.addEventListener('touchend', handlePointerUp);

  // Render loop for ripples & smooth river stones
  let animId;
  function render() {
    // Redraw ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.r += 0.8;
      rip.alpha -= 0.007;

      ctx.save();
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(110, 231, 183, ${Math.max(0, rip.alpha)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      if (rip.alpha <= 0) ripples.splice(i, 1);
    }

    // Draw stones
    stones.forEach(s => {
      ctx.save();
      // Drop shadow
      ctx.beginPath();
      ctx.ellipse(s.x + 3, s.y + 4, s.r * 1.05, s.r * 0.75, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();

      // Stone gradient
      const sGrad = ctx.createRadialGradient(s.x - 4, s.y - 4, 2, s.x, s.y, s.r);
      sGrad.addColorStop(0, '#3a4a45');
      sGrad.addColorStop(0.7, '#1f2b27');
      sGrad.addColorStop(1, '#111917');
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.78, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = sGrad;
      ctx.fill();
      ctx.restore();
    });

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  // Tool buttons
  const toolBtns = [
    { id: '#toolRake', tool: 'rake' },
    { id: '#toolStone', tool: 'stone' },
    { id: '#toolRipple', tool: 'ripple' }
  ];

  toolBtns.forEach(({ id, tool }) => {
    container.querySelector(id).addEventListener('click', () => {
      toolBtns.forEach(t => container.querySelector(t.id).classList.remove('active'));
      container.querySelector(id).classList.add('active');
      activeTool = tool;
    });
  });

  // Smooth sand button
  container.querySelector('#btnZenSmooth').addEventListener('click', () => {
    stones.length = 0;
    ripples.length = 0;
    drawBaseSand();
    playSoftChime(392);
  });

  return function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mouseup', handlePointerUp);
    window.removeEventListener('touchend', handlePointerUp);
  };
}
