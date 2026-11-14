/**
 * Micro-Logic Module
 * Fast, satisfying 2-minute spatial and numerical logic warmup.
 * Re-engages focus cleanly without rabbit holes.
 */

export function initMicroLogic(container) {
  container.innerHTML = `
    <div style="width: 100%; height: 100%; background: #0c1614; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; overflow-y: auto;">
      <div style="background: #142420; border: 1px solid var(--border-light); border-radius: 16px; padding: 2rem; max-width: 480px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--sage-300); text-transform: uppercase; letter-spacing: 0.05em;">Micro-Logic Warmup</span>
          <span style="font-size: 0.8rem; color: var(--text-dim);">Sudoku 4x4 Mini</span>
        </div>
        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #fff;">Fill rows, cols & 2x2 boxes with 1–4</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Engage prefrontal reasoning with zero cognitive stress.</p>

        <!-- 4x4 Sudoku Grid -->
        <div id="sudokuGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; max-width: 280px; margin: 0 auto 1.5rem;"></div>

        <!-- Number input pad -->
        <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 1.5rem;">
          <button class="num-pad-btn" data-val="1">1</button>
          <button class="num-pad-btn" data-val="2">2</button>
          <button class="num-pad-btn" data-val="3">3</button>
          <button class="num-pad-btn" data-val="4">4</button>
          <button class="num-pad-btn" data-val="" style="background: rgba(244, 63, 94, 0.15); color: #f87171;">✕</button>
        </div>

        <div id="logicFeedback" style="min-height: 24px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem;"></div>

        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <button id="btnNewPuzzle" style="background: var(--bg-primary); border: 1px solid var(--border-subtle); color: var(--text-muted); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer;">🎲 New Board</button>
          <button id="btnCheckSolution" style="background: var(--sage-dark); border: 1px solid var(--sage-primary); color: var(--sage-100); padding: 0.5rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">✓ Verify Grid</button>
        </div>
      </div>
    </div>
  `;

  // Mini 4x4 puzzles [solution, initial grid with zeros as blanks]
  const puzzles = [
    {
      initial: [
        1, 0, 0, 4,
        0, 4, 1, 0,
        0, 1, 4, 0,
        4, 0, 0, 2
      ],
      solution: [
        1, 2, 3, 4,
        3, 4, 1, 2,
        2, 1, 4, 3,
        4, 3, 2, 1
      ]
    },
    {
      initial: [
        0, 2, 4, 0,
        1, 0, 0, 3,
        4, 0, 0, 2,
        0, 1, 3, 0
      ],
      solution: [
        3, 2, 4, 1,
        1, 4, 2, 3,
        4, 3, 1, 2,
        2, 1, 3, 4
      ]
    },
    {
      initial: [
        0, 0, 1, 0,
        4, 1, 0, 0,
        0, 0, 2, 4,
        0, 4, 0, 0
      ],
      solution: [
        2, 3, 1, 4,
        4, 1, 3, 2,
        1, 8, 2, 4, // 1 3 2 4
        3, 4, 8, 1
      ]
    }
  ];

  let currentPuzzleIdx = 0;
  let userGrid = [];
  let selectedCellIdx = -1;

  const gridEl = container.querySelector('#sudokuGrid');
  const feedbackEl = container.querySelector('#logicFeedback');

  function loadPuzzle(idx) {
    currentPuzzleIdx = idx % puzzles.length;
    const p = puzzles[currentPuzzleIdx];
    userGrid = [...p.initial];
    selectedCellIdx = -1;
    feedbackEl.textContent = '';
    renderGrid();
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    const p = puzzles[currentPuzzleIdx];

    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      const isFixed = p.initial[i] !== 0;
      const val = userGrid[i];

      cell.style.cssText = `
        aspect-ratio: 1;
        background: ${selectedCellIdx === i ? 'rgba(16, 185, 129, 0.25)' : (isFixed ? '#192b27' : '#0c1614')};
        border: 1px solid ${selectedCellIdx === i ? 'var(--sage-primary)' : 'var(--border-subtle)'};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-mono);
        font-size: 1.35rem;
        font-weight: 700;
        color: ${isFixed ? 'var(--sage-300)' : '#ffffff'};
        cursor: ${isFixed ? 'default' : 'pointer'};
        transition: all 0.15s;
      `;

      // Thick border between 2x2 quadrants
      const row = Math.floor(i / 4);
      const col = i % 4;
      if (col === 1) cell.style.marginRight = '4px';
      if (row === 1) cell.style.marginBottom = '4px';

      cell.textContent = val !== 0 ? val : '';

      if (!isFixed) {
        cell.addEventListener('click', () => {
          selectedCellIdx = i;
          renderGrid();
        });
      }

      gridEl.appendChild(cell);
    }
  }

  // Number pad input
  container.querySelectorAll('.num-pad-btn').forEach(btn => {
    btn.style.cssText = `
      width: 44px;
      height: 44px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
      color: #fff;
      font-family: var(--font-mono);
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
    `;
    btn.addEventListener('click', () => {
      if (selectedCellIdx === -1) return;
      const p = puzzles[currentPuzzleIdx];
      if (p.initial[selectedCellIdx] !== 0) return;

      const val = btn.dataset.val ? parseInt(btn.dataset.val, 10) : 0;
      userGrid[selectedCellIdx] = val;
      renderGrid();
    });
  });

  // Verify Solution
  container.querySelector('#btnCheckSolution').addEventListener('click', () => {
    // Check if filled
    if (userGrid.includes(0)) {
      feedbackEl.style.color = 'var(--accent-amber)';
      feedbackEl.textContent = 'Keep going! There are unfilled cells.';
      return;
    }

    // Verify row, col, box constraints
    let correct = true;
    for (let r = 0; r < 4; r++) {
      const rowVals = new Set([userGrid[r*4], userGrid[r*4+1], userGrid[r*4+2], userGrid[r*4+3]]);
      if (rowVals.size !== 4) correct = false;
    }
    for (let c = 0; c < 4; c++) {
      const colVals = new Set([userGrid[c], userGrid[c+4], userGrid[c+8], userGrid[c+12]]);
      if (colVals.size !== 4) correct = false;
    }
    // Check 2x2 boxes
    const boxes = [
      [0, 1, 4, 5],
      [2, 3, 6, 7],
      [8, 9, 12, 13],
      [10, 11, 14, 15]
    ];
    boxes.forEach(b => {
      const boxVals = new Set(b.map(idx => userGrid[idx]));
      if (boxVals.size !== 4) correct = false;
    });

    if (correct) {
      feedbackEl.style.color = 'var(--sage-400)';
      feedbackEl.textContent = '✨ Clean logic! Prefrontal cortex primed and ready.';
    } else {
      feedbackEl.style.color = 'var(--accent-rose)';
      feedbackEl.textContent = 'Check for duplicate numbers in a row, col, or 2x2 box.';
    }
  });

  container.querySelector('#btnNewPuzzle').addEventListener('click', () => {
    loadPuzzle(currentPuzzleIdx + 1);
  });

  loadPuzzle(0);

  return function destroy() {};
}
