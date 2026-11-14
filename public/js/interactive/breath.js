/**
 * Somatic Breathing Pacer
 * Guided 4-7-8 breathing circle to stimulate the vagus nerve and down-regulate sympathetic arousal.
 */

export function initBreathingPacer(container) {
  container.innerHTML = `
    <div style="width: 100%; height: 100%; background: #070e0b; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
      <div style="text-align: center; max-width: 440px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: var(--sage-300); text-transform: uppercase; letter-spacing: 0.06em;">Vagus Nerve Reset</span>
        <h2 style="font-size: 1.8rem; margin: 0.5rem 0 1rem; color: #fff;">4-7-8 Somatic Breathing</h2>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2.5rem;">Follow the expanding circle. Inhale through your nose, hold gently, and exhale smoothly.</p>

        <!-- Dynamic Expanding Circle -->
        <div style="position: relative; width: 260px; height: 260px; margin: 0 auto 2.5rem; display: flex; align-items: center; justify-content: center;">
          <div id="breathGlow" style="position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 70%); transition: transform 4s ease-in-out; transform: scale(0.6);"></div>
          <div id="breathCircle" style="width: 160px; height: 160px; border-radius: 50%; border: 3px solid var(--sage-primary); background: rgba(16, 185, 129, 0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 30px var(--sage-glow); transition: transform 4s ease-in-out; transform: scale(0.7);">
            <span id="breathPhaseText" style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 700; color: #ffffff;">Inhale</span>
            <span id="breathCountdown" style="font-family: var(--font-mono); font-size: 1.6rem; font-weight: 700; color: var(--sage-300); margin-top: 0.25rem;">4</span>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="btnPacerCycle" class="btn-start-card" style="max-width: 180px;">Restart Cycle</button>
        </div>
      </div>
    </div>
  `;

  const circle = container.querySelector('#breathCircle');
  const glow = container.querySelector('#breathGlow');
  const phaseText = container.querySelector('#breathPhaseText');
  const countText = container.querySelector('#breathCountdown');

  // Phases: Inhale (4s), Hold (7s), Exhale (8s)
  const phases = [
    { name: 'Inhale', duration: 4, scale: 1.25, transition: '4s ease-in-out' },
    { name: 'Hold', duration: 7, scale: 1.25, transition: '0.1s linear' },
    { name: 'Exhale', duration: 8, scale: 0.65, transition: '8s ease-in-out' }
  ];

  let currentPhaseIdx = 0;
  let secondsRemaining = phases[0].duration;
  let timerInterval = null;

  function runPhase() {
    const current = phases[currentPhaseIdx];
    phaseText.textContent = current.name;
    circle.style.transition = `transform ${current.transition}`;
    glow.style.transition = `transform ${current.transition}`;
    circle.style.transform = `scale(${current.scale})`;
    glow.style.transform = `scale(${current.scale * 1.35})`;

    secondsRemaining = current.duration;
    countText.textContent = secondsRemaining;
  }

  function tick() {
    secondsRemaining--;
    if (secondsRemaining <= 0) {
      currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
      runPhase();
    } else {
      countText.textContent = secondsRemaining;
    }
  }

  runPhase();
  timerInterval = setInterval(tick, 1000);

  container.querySelector('#btnPacerCycle').addEventListener('click', () => {
    currentPhaseIdx = 0;
    runPhase();
  });

  return function destroy() {
    if (timerInterval) clearInterval(timerInterval);
  };
}
