/**
 * Curiosity & Wonder Micro-Dose Module
 * Calm, high-intrigue STEM insights without clickbait hooks or endless feeds.
 */

export function initCuriosityCards(container) {
  const cards = [
    {
      topic: 'Astrophysics & Space',
      title: 'The Whispering Glow of the Cosmic Microwave Background',
      readingTime: '90 sec read',
      body: `When you tune an old analog radio between stations, roughly 1% of the static fuzz you hear is the radiation left behind by the Big Bang itself. Cooled over 13.8 billion years to a frigid 2.7 Kelvin, this Cosmic Microwave Background is the oldest light in the observable universe, bathing our planet evenly from every point in the night sky.`,
      insight: 'Key Takeaway: The universe is vast and ancient, putting transient daily stressors into grounding perspective.'
    },
    {
      topic: 'Marine Biology & Extremophiles',
      title: 'The Bioluminescent Abyssal Symphony',
      readingTime: '80 sec read',
      body: `Below 1,000 meters in the bathypelagic ocean, sunlight never penetrates. Yet the abyssal zone is far from dark: over 76% of all deep-sea creatures produce their own cold living light through luciferin chemical oxidation. Anglerfish, comb jellies, and lanternfishes flash in sapphire blues and emerald greens to communicate, hunt, and camouflage against the dark water above.`,
      insight: 'Key Takeaway: Even in extreme sensory deprivation, nature innovates intricate, quiet harmony.'
    },
    {
      topic: 'Quantum Physics',
      title: 'Quantum Decoherence & The Emergence of Reality',
      readingTime: '95 sec read',
      body: `At the quantum level, subatomic particles exist as superpositions of countless potential paths simultaneously. Why does our everyday world appear solid and definite? The answer is decoherence: trillions of stray thermal photons constantly scatter off every object, forcing quantum uncertainties into precise classical states faster than a quadrillionth of a second.`,
      insight: 'Key Takeaway: Clarity emerges when a system gently interacts with its environment.'
    }
  ];

  let currentIdx = 0;

  function render() {
    const card = cards[currentIdx];
    container.innerHTML = `
      <div style="width: 100%; height: 100%; background: #08110e; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; overflow-y: auto;">
        <div style="background: linear-gradient(145deg, #142420, #0d1715); border: 1px solid var(--border-light); border-radius: 20px; padding: 2.5rem; max-width: 580px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--sage-300); text-transform: uppercase; letter-spacing: 0.05em;">${card.topic}</span>
            <span style="font-size: 0.8rem; color: var(--text-dim); background: var(--bg-primary); padding: 0.2rem 0.6rem; border-radius: 4px;">${card.readingTime}</span>
          </div>

          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; line-height: 1.35; margin-bottom: 1.25rem;">${card.title}</h2>

          <p style="font-size: 1rem; color: #cbd5e1; line-height: 1.75; margin-bottom: 1.5rem;">${card.body}</p>

          <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--sage-primary); padding: 0.85rem 1rem; border-radius: 6px; margin-bottom: 2rem;">
            <p style="font-size: 0.85rem; color: var(--sage-200); font-weight: 500;">${card.insight}</p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: var(--text-dim);">Card ${currentIdx + 1} of ${cards.length}</span>
            <button id="btnNextCuriosity" style="background: var(--sage-dark); border: 1px solid var(--sage-primary); color: var(--sage-100); padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
              Next Wonder →
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btnNextCuriosity').addEventListener('click', () => {
      currentIdx = (currentIdx + 1) % cards.length;
      render();
    });
  }

  render();
  return function destroy() {};
}
