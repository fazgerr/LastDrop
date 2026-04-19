// Water distribution coefficients
const INFLUENCE = { SAME: 1.0, ORTHOGONAL: 0.5, DIAGONAL: 0.25 };

function getRelation(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  if (dr === 0 && dc === 0) return 'SAME';
  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) return 'ORTHOGONAL';
  if (dr === 1 && dc === 1) return 'DIAGONAL';
  return 'NONE';
}

function simulate(level, sprinklers) {
  let cellResults = [];
  let farmScore = 0, totalWaste = 0, underCount = 0, overCount = 0;
  let maxReceived = 0;

  level.cells.forEach(cell => {
    if (cell.blocked) {
      cellResults.push({ id: cell.id, received: 0, pct: 0, status: 'blocked' });
      return;
    }

    let received = 0;
    sprinklers.forEach(sp => {
      if (!sp.water || sp.water <= 0) return;
      const spCell = level.cells.find(c => c.id === sp.id);
      if (!spCell) return;
      const rel = getRelation(cell.row, cell.col, spCell.row, spCell.col);
      if (rel !== 'NONE') received += sp.water * INFLUENCE[rel];
    });

    if (received > maxReceived) maxReceived = received;

    const excess    = Math.max(0, received - cell.need);
    const deficit   = Math.max(0, cell.need - received);
    const metRatio  = Math.min(1, received / (cell.need || 1));
    const yieldSc   = cell.value * metRatio;
    const penalty   = excess * cell.sensitivity;
    const cellScore = Math.max(0, yieldSc - penalty);

    farmScore  += cellScore;
    totalWaste += excess;

    let status = 'ideal';
    if (deficit > cell.need * 0.15) { status = 'under'; underCount++; }
    else if (excess > cell.need * 0.15) { status = 'over'; overCount++; }

    cellResults.push({ id: cell.id, received: Math.round(received), status });
  });

  // Set maxReceived based on the real maximum — critical for the heatmap
  const finalMax = maxReceived || 1;

  // Add pct afterwards
  cellResults = cellResults.map(r => ({
    ...r,
    pct: r.status === 'blocked' ? 0 : Math.min(100, Math.round((r.received / finalMax) * 100))
  }));

  const totalBudget = sprinklers.reduce((s, sp) => s + (sp.water || 0), 0) || 1;
  const efficiency  = Math.max(0, Math.round((1 - totalWaste / Math.max(totalBudget, 1)) * 100));

  return {
    cellResults,
    maxReceived: finalMax,
    metrics: {
      score:        Math.round(farmScore),
      waste:        Math.round(totalWaste),
      underwatered: underCount,
      overwatered:  overCount,
      efficiency
    }
  };
}