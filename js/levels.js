// ══════════════════════════════════════════════
//  LASTDROP — levels.js
//  Fixed scenario definitions + random level generator
// ══════════════════════════════════════════════

const LEVELS = [
  {
    id: "level_1",
    name: "🌾 Wheat Field",
    icon: "🌾",
    shortDesc: "Basic tutorial level",
    difficulty: "easy",
    cols: 3, maxSprinklers: 2, budget: 40,
    desc: "Basic training. Wheat needs water evenly. Think about the most central cell — it reaches the largest area.",
    cells: [
      { id:"0-0", row:0, col:0, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"0-1", row:0, col:1, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"0-2", row:0, col:2, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"1-0", row:1, col:0, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"1-1", row:1, col:1, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"1-2", row:1, col:2, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"2-0", row:2, col:0, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"2-1", row:2, col:1, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false },
      { id:"2-2", row:2, col:2, crop:'🌾', cropName:'Wheat', stars:1, need:10, value:10, sensitivity:0.5, blocked:false }
    ],
    optimal: {
      sprinklers: [{ id:"1-1", water:20 }],
      insight: {
        strategy: "A single sprinkler was placed exactly at the center (1-1).",
        why: "A center sprinkler sends full water to itself, half to orthogonal neighbors, and quarter to diagonal cells. This layout feeds all 9 cells with the best efficiency using minimal water."
      }
    }
  },
  {
    id: "level_2",
    name: "🍇 Decision Time",
    icon: "🍇",
    shortDesc: "Set priorities under scarcity",
    difficulty: "medium",
    cols: 3, maxSprinklers: 2, budget: 20,
    desc: "Water scarcity! You cannot save everyone. 3-star grapes are far more valuable — which crops will you sacrifice?",
    cells: [
      { id:"0-0", row:0, col:0, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"0-1", row:0, col:1, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"0-2", row:0, col:2, crop:'🍇', cropName:'Grape', stars:3, need:15, value:30, sensitivity:1.5, blocked:false },
      { id:"1-0", row:1, col:0, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"1-1", row:1, col:1, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"1-2", row:1, col:2, crop:'🍇', cropName:'Grape', stars:3, need:15, value:30, sensitivity:1.5, blocked:false },
      { id:"2-0", row:2, col:0, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"2-1", row:2, col:1, crop:'🌽', cropName:'Corn',  stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"2-2", row:2, col:2, crop:'🍇', cropName:'Grape', stars:3, need:15, value:30, sensitivity:1.5, blocked:false }
    ],
    optimal: {
      sprinklers: [{ id:"1-2", water:20 }],
      insight: {
        strategy: "Ignore the 6 cells on the left — send all water to the right column.",
        why: "Human instinct is to spread limited water evenly. But the algorithm sees the numbers: sacrificing 1-star corn and fully feeding 3-star grapes triples the total harvest value."
      }
    }
  },
  {
    id: "level_4",
    name: "🔥 Mega Farm",
    icon: "🔥",
    shortDesc: "A large field full of traps and obstacles",
    difficulty: "hard",
    cols: 5, maxSprinklers: 3, budget: 60,
    desc: "25 cells, rock obstacles, rare tomatoes, and a dangerous grape trap. Can you beat the algorithm?",
    cells: [
      { id:"0-0", row:0, col:0, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"0-1", row:0, col:1, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"0-2", row:0, col:2, crop:'🍅', cropName:'Tomato',          stars:3, need:25, value:40, sensitivity:2,   blocked:false },
      { id:"0-3", row:0, col:3, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:true  },
      { id:"0-4", row:0, col:4, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"1-0", row:1, col:0, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"1-1", row:1, col:1, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"1-2", row:1, col:2, crop:'🍅', cropName:'Tomato',          stars:3, need:25, value:40, sensitivity:2,   blocked:false },
      { id:"1-3", row:1, col:3, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"1-4", row:1, col:4, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"2-0", row:2, col:0, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:10, sensitivity:0.5, blocked:true  },
      { id:"2-1", row:2, col:1, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"2-2", row:2, col:2, crop:'🍇', cropName:'Grape (TRAP!)',   stars:3, need:5,  value:5,  sensitivity:8,   blocked:false },
      { id:"2-3", row:2, col:3, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"2-4", row:2, col:4, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:10, sensitivity:0.5, blocked:true  },
      { id:"3-0", row:3, col:0, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"3-1", row:3, col:1, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"3-2", row:3, col:2, crop:'🍅', cropName:'Tomato',          stars:3, need:25, value:40, sensitivity:2,   blocked:false },
      { id:"3-3", row:3, col:3, crop:'🌽', cropName:'Corn',            stars:2, need:15, value:15, sensitivity:0.5, blocked:false },
      { id:"3-4", row:3, col:4, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"4-0", row:4, col:0, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"4-1", row:4, col:1, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:true  },
      { id:"4-2", row:4, col:2, crop:'🍅', cropName:'Tomato',          stars:3, need:25, value:40, sensitivity:2,   blocked:false },
      { id:"4-3", row:4, col:3, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false },
      { id:"4-4", row:4, col:4, crop:'🌾', cropName:'Wheat',           stars:1, need:10, value:5,  sensitivity:0.5, blocked:false }
    ],
    optimal: {
      sprinklers: [{ id:"1-2", water:25 }, { id:"3-2", water:25 }],
      insight: {
        strategy: "Two sprinklers, skipping the exact center: row 1-2 and row 3-2.",
        why: "The center grape at (2-2) is a trap. It needs very little water but has 8× sensitivity. Putting a sprinkler there drowns it and costs a lot of points. GAMSPy detected the trap and watered the tomatoes perfectly instead."
      }
    }
  }
];

// ══════════════════════════════════════════════
//  RANDOM LEVEL GENERATOR
//  Puzzle logic: guaranteed optimal solution,
//  first generate optimal placement → then make
//  the map meaningful for that solution.
// ══════════════════════════════════════════════

const CROP_TYPES = [
  { crop:'🌾', cropName:'Wheat',     stars:1, need:10, value:8,  sensitivity:0.4 },
  { crop:'🌽', cropName:'Corn',      stars:2, need:14, value:16, sensitivity:0.6 },
  { crop:'🍅', cropName:'Tomato',    stars:3, need:22, value:38, sensitivity:1.8 },
  { crop:'🍇', cropName:'Grape',     stars:3, need:6,  value:6,  sensitivity:7.0 },
  { crop:'🥕', cropName:'Carrot',    stars:2, need:12, value:14, sensitivity:0.8 },
  { crop:'🌻', cropName:'Sunflower', stars:2, need:18, value:20, sensitivity:1.0 },
];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }

function generateRandomLevel() {
  const size = pick([3, 4, 5]);
  const rows = size, cols = size;

  const maxSprinklers = size === 3 ? 1 : size === 4 ? 2 : 3;
  const budgetBase    = size === 3 ? 25 : size === 4 ? 45 : 65;

  const cells = [];
  const blockChance = size === 3 ? 0 : size === 4 ? 0.1 : 0.15;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isBlocked = Math.random() < blockChance;
      const cropDef   = isBlocked ? null : pick(CROP_TYPES);
      cells.push({
        id:          `${r}-${c}`,
        row:          r,
        col:          c,
        crop:         isBlocked ? '🪨' : cropDef.crop,
        cropName:     isBlocked ? 'Rock' : cropDef.cropName,
        stars:        isBlocked ? 0 : cropDef.stars,
        need:         isBlocked ? 0 : cropDef.need,
        value:        isBlocked ? 0 : cropDef.value,
        sensitivity:  isBlocked ? 0 : cropDef.sensitivity,
        blocked:      isBlocked
      });
    }
  }

  const activeCells = cells.filter(c => !c.blocked);
  const candidates = activeCells.map(c => c.id);
  let bestScore   = -1;
  let bestPlacement = [];

  function getCombinations(arr, k) {
    if (k === 1) return arr.map(x => [x]);
    const result = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const head = arr[i];
      const rest = getCombinations(arr.slice(i + 1), k - 1);
      rest.forEach(r => result.push([head, ...r]));
    }
    return result;
  }

  const combos = getCombinations(candidates, maxSprinklers);

  combos.forEach(combo => {
    const waterPerSp = Math.floor(budgetBase / combo.length);
    const sprinklers = combo.map(id => ({ id, water: waterPerSp }));
    const res = simulateForOptim({ cells, cols }, sprinklers);
    if (res.metrics.score > bestScore) {
      bestScore     = res.metrics.score;
      bestPlacement = sprinklers;
    }
  });

  if (bestPlacement.length === 0) {
    const mid = activeCells[Math.floor(activeCells.length / 2)];
    bestPlacement = [{ id: mid.id, water: budgetBase }];
  }

  const difficulty = size === 3 ? 'easy' : size === 4 ? 'medium' : 'hard';
  const icons = { easy:'🎯', medium:'⚡', hard:'🔥' };

  return {
    id:       'random_' + Date.now(),
    name:     `${icons[difficulty]} Random ${size}×${size} Field`,
    icon:     icons[difficulty],
    shortDesc: `${size}×${size} randomly generated map`,
    difficulty,
    isRandom: true,
    cols,
    maxSprinklers,
    budget: budgetBase,
    desc: `${size}×${size} random field. You have ${maxSprinklers} sprinklers and ${budgetBase} L of water. Find the optimal distribution.`,
    cells,
    optimal: {
      sprinklers: bestPlacement,
      insight: {
        strategy: `${bestPlacement.length} sprinkler(s) were placed at optimal positions.`,
        why: `GAMSPy evaluated ${combos.length} different combinations and found the layout with the highest score: ${bestScore} points.`
      }
    }
  };
}

// Lightweight simulation for optimization (independent from simulation.js)
const INFL = { SAME:1.0, ORTHOGONAL:0.5, DIAGONAL:0.25 };
function simulateForOptim(level, sprinklers) {
  let farmScore = 0, totalWaste = 0, underCount = 0;
  level.cells.forEach(cell => {
    if (cell.blocked) return;
    let received = 0;
    sprinklers.forEach(sp => {
      if (!sp.water) return;
      const spCell = level.cells.find(c => c.id === sp.id);
      if (!spCell) return;
      const dr = Math.abs(cell.row - spCell.row);
      const dc = Math.abs(cell.col - spCell.col);
      let rel = 'NONE';
      if (dr===0&&dc===0) rel='SAME';
      else if ((dr===1&&dc===0)||(dr===0&&dc===1)) rel='ORTHOGONAL';
      else if (dr===1&&dc===1) rel='DIAGONAL';
      if (rel!=='NONE') received += sp.water * INFL[rel];
    });
    const excess    = Math.max(0, received - cell.need);
    const metRatio  = Math.min(1, received / (cell.need||1));
    const cellScore = Math.max(0, cell.value * metRatio - excess * cell.sensitivity);
    farmScore  += cellScore;
    totalWaste += excess;
    if (received < cell.need * 0.85) underCount++;
  });
  return { metrics: { score: Math.round(farmScore), waste: Math.round(totalWaste), underwatered: underCount } };
}