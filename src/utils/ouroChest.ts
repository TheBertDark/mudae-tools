import ouroBoardsData from './ouroBoards.json' with { type: 'json' };
import d4BookDataRaw from './d4Book.json' with { type: 'json' };

export type SphereType =
  | 'hidden'
  | 'blue'
  | 'teal'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red';

export const CYCLE_ORDER: SphereType[] = [
  'hidden',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
];

export const SPHERE_POINT_VALUES: Record<SphereType, number> = {
  red: 150,
  orange: 90,
  yellow: 55,
  green: 35,
  teal: 20,
  blue: 10,
  hidden: 0,
};

export const MAX_SPHERE_COUNTS: Partial<Record<SphereType, number>> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
};

export function getNextCycleColor(
  current: SphereType,
  reverse = false,
  disallowedColors: SphereType[] = []
): SphereType {
  const allowedCycle = CYCLE_ORDER.filter(
    (t) => t === current || t === 'hidden' || !disallowedColors.includes(t)
  );

  const currentIndex = allowedCycle.indexOf(current);
  if (currentIndex === -1) {
    return reverse ? allowedCycle[allowedCycle.length - 1] : allowedCycle[1] || 'blue';
  }

  if (reverse) {
    const prevIndex = (currentIndex - 1 + allowedCycle.length) % allowedCycle.length;
    return allowedCycle[prevIndex];
  } else {
    const nextIndex = (currentIndex + 1) % allowedCycle.length;
    return allowedCycle[nextIndex];
  }
}

export function isRedCandidateCompatibleWithClue(
  rR: number,
  cR: number,
  r: number,
  c: number,
  revealedType: SphereType
): boolean {
  if (revealedType === 'hidden') return true;

  const dr = Math.abs(r - rR);
  const dc = Math.abs(c - cR);

  const isSame = dr === 0 && dc === 0;
  const isAdjacentOrthogonal = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  const isSameRowOrCol = (dr === 0 || dc === 0) && !isSame;
  const isDiagonalRay = dr === dc && !isSame;
  const isAlignedRay = isSameRowOrCol || isDiagonalRay;

  switch (revealedType) {
    case 'red':
      return isSame;

    case 'orange':
      if (isSame) return false;
      return isAdjacentOrthogonal;

    case 'yellow':
      if (isSame) return false;
      return isDiagonalRay;

    case 'green':
      if (isSame) return false;
      return isSameRowOrCol;

    case 'teal':
      if (isSame) return false;
      return isAlignedRay;

    case 'blue':
      if (isSame) return false;
      return !isAlignedRay;

    default:
      return true;
  }
}

export function getTheoreticalSphereType(
  r: number,
  c: number,
  rR: number,
  cR: number
): SphereType {
  const dr = Math.abs(r - rR);
  const dc = Math.abs(c - cR);

  if (dr === 0 && dc === 0) return 'red';
  if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) return 'orange';
  if (dr === dc) return 'yellow';
  if (dr === 0 || dc === 0) return 'green';
  return 'blue';
}

export interface MoveQuality {
  r: number;
  c: number;
  entropy: number;
  expectedRemaining: number;
  probRed: number;
  isProbeOnly: boolean;
  score: number;
}

// Canonical opening book depth 5 (empty board, 0 clues)
const ROOT_EV_GRID: number[] = [
  339.96, 344.07, 341.45, 344.07, 339.96,
  344.07, 344.73, 341.61, 344.73, 344.07,
  341.45, 341.61,   0.00, 341.61, 341.45,
  344.07, 344.73, 341.61, 344.73, 344.07,
  339.96, 344.07, 341.45, 344.07, 339.96,
];

const ROOT_BEST_MOVES: { r: number; c: number }[] = [
  { r: 1, c: 1 },
  { r: 1, c: 3 },
  { r: 3, c: 1 },
  { r: 3, c: 3 },
];

interface D4BookEntry {
  best: number;
  ev: number;
  per_cell_ev: (number | null)[];
}

const d4BookData = d4BookDataRaw as Record<string, D4BookEntry>;

// Precomputed flat byte arrays for canonical boards
const COLOR_CHARS = ['r', 'o', 'y', 'g', 't', 'b'] as const;
const COLOR_CHAR_TO_INT: Record<string, number> = { r: 0, o: 1, y: 2, g: 3, t: 4, b: 5 };
const COLOR_INT_TO_TYPE: SphereType[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue'];
const COLOR_POINTS = [150, 90, 55, 35, 20, 10];

const TOTAL_BOARDS = ouroBoardsData.boards.length;
const FLAT_BOARDS = new Uint8Array(TOTAL_BOARDS * 25);
const BOARD_WEIGHTS = new Float32Array(TOTAL_BOARDS);
const BOARD_RED_POS = new Uint8Array(TOTAL_BOARDS);

for (let i = 0; i < TOTAL_BOARDS; i++) {
  const b = ouroBoardsData.boards[i];
  const redIdx = b.indexOf('r');
  BOARD_RED_POS[i] = redIdx;
  BOARD_WEIGHTS[i] = ouroBoardsData.nr[redIdx] ? 1 / ouroBoardsData.nr[redIdx] : 1;
  for (let j = 0; j < 25; j++) {
    FLAT_BOARDS[i * 25 + j] = COLOR_CHAR_TO_INT[b[j]] ?? 5;
  }
}

/**
 * Fast expectimax search over matching canonical boards.
 * Calculates exact mathematical Expected Value (EV) for remaining clicks.
 */
function solveExpectimax(
  active: Uint16Array,
  depth: number,
  unrevealedMask: number
): { bestMove: number; maxEV: number; perCellEV: number[] } {
  const len = active.length;
  const perCellEV = Array(25).fill(0);
  if (depth === 0 || len === 0) return { bestMove: -1, maxEV: 0, perCellEV };

  let totalW = 0;
  for (let i = 0; i < len; i++) totalW += BOARD_WEIGHTS[active[i]];
  if (totalW === 0) return { bestMove: -1, maxEV: 0, perCellEV };

  let maxEV = -1;
  let bestMove = -1;

  for (let m = 0; m < 25; m++) {
    if ((unrevealedMask & (1 << m)) === 0) continue;

    const count = [0, 0, 0, 0, 0, 0];
    const weight = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < len; i++) {
      const idx = active[i];
      const col = FLAT_BOARDS[idx * 25 + m];
      count[col]++;
      weight[col] += BOARD_WEIGHTS[idx];
    }

    let moveEV = 0;
    const nextMask = unrevealedMask ^ (1 << m);

    for (let c = 0; c < 6; c++) {
      const wBranch = weight[c];
      if (wBranch === 0) continue;
      const p = wBranch / totalW;
      const imm = COLOR_POINTS[c];

      let future = 0;
      if (depth > 1) {
        const sub = new Uint16Array(count[c]);
        let ptr = 0;
        for (let i = 0; i < len; i++) {
          const idx = active[i];
          if (FLAT_BOARDS[idx * 25 + m] === c) {
            sub[ptr++] = idx;
          }
        }

        if (c === 0) {
          future = greedyHarvestFast(sub, depth - 1, nextMask, wBranch);
        } else {
          future = solveExpectimaxInternal(sub, depth - 1, nextMask);
        }
      }
      moveEV += p * (imm + future);
    }

    perCellEV[m] = moveEV;
    if (moveEV > maxEV) {
      maxEV = moveEV;
      bestMove = m;
    }
  }

  return { bestMove, maxEV, perCellEV };
}

function solveExpectimaxInternal(
  active: Uint16Array,
  depth: number,
  unrevealedMask: number
): number {
  const len = active.length;
  if (depth === 0 || len === 0) return 0;

  let totalW = 0;
  for (let i = 0; i < len; i++) totalW += BOARD_WEIGHTS[active[i]];
  if (totalW === 0) return 0;

  let maxEV = -1;

  for (let m = 0; m < 25; m++) {
    if ((unrevealedMask & (1 << m)) === 0) continue;

    const count = [0, 0, 0, 0, 0, 0];
    const weight = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < len; i++) {
      const idx = active[i];
      const col = FLAT_BOARDS[idx * 25 + m];
      count[col]++;
      weight[col] += BOARD_WEIGHTS[idx];
    }

    let moveEV = 0;
    const nextMask = unrevealedMask ^ (1 << m);

    for (let c = 0; c < 6; c++) {
      const wBranch = weight[c];
      if (wBranch === 0) continue;
      const p = wBranch / totalW;
      const imm = COLOR_POINTS[c];

      let future = 0;
      if (depth > 1) {
        const sub = new Uint16Array(count[c]);
        let ptr = 0;
        for (let i = 0; i < len; i++) {
          const idx = active[i];
          if (FLAT_BOARDS[idx * 25 + m] === c) {
            sub[ptr++] = idx;
          }
        }

        if (c === 0) {
          future = greedyHarvestFast(sub, depth - 1, nextMask, wBranch);
        } else {
          future = solveExpectimaxInternal(sub, depth - 1, nextMask);
        }
      }
      moveEV += p * (imm + future);
    }

    if (moveEV > maxEV) {
      maxEV = moveEV;
    }
  }

  return maxEV;
}

function greedyHarvestFast(
  active: Uint16Array,
  clicks: number,
  unrevealedMask: number,
  totalW: number
): number {
  if (clicks <= 0 || unrevealedMask === 0 || active.length === 0) return 0;
  let bestVal = 0;
  let bestM = -1;

  for (let m = 0; m < 25; m++) {
    if ((unrevealedMask & (1 << m)) === 0) continue;
    let sumW = 0;
    for (let i = 0; i < active.length; i++) {
      const idx = active[i];
      sumW += BOARD_WEIGHTS[idx] * COLOR_POINTS[FLAT_BOARDS[idx * 25 + m]];
    }
    const avg = sumW / totalW;
    if (avg > bestVal) {
      bestVal = avg;
      bestM = m;
    }
  }

  if (bestM === -1) return 0;
  return bestVal + greedyHarvestFast(active, clicks - 1, unrevealedMask ^ (1 << bestM), totalW);
}

export function solveOuroChest(grid: SphereType[][]): {
  possibleRedCells: { r: number; c: number }[];
  redProbabilities: number[][];
  bestMoves: { r: number; c: number }[];
  foundRed: boolean;
  redPosition?: { r: number; c: number };
  cellAdvice: Record<string, string>;
  expectedValues: number[][];
  moveQualityMap: Record<string, MoveQuality>;
  hasInconsistency: boolean;
  inconsistencyError?: string;
} {
  const clues: { r: number; c: number; type: SphereType; cellIdx: number }[] = [];
  let foundRed = false;
  let redPos: { r: number; c: number } | undefined = undefined;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const type = grid[r][c];
      if (type !== 'hidden') {
        const cellIdx = r * 5 + c;
        clues.push({ r, c, type, cellIdx });
        if (type === 'red') {
          foundRed = true;
          redPos = { r, c };
        }
      }
    }
  }

  let hasInconsistency = false;
  let inconsistencyError: string | undefined = undefined;

  // Inconsistency check against red position
  if (foundRed && redPos) {
    for (const clue of clues) {
      if (clue.type === 'red') continue;
      if (!isRedCandidateCompatibleWithClue(redPos.r, redPos.c, clue.r, clue.c, clue.type)) {
        hasInconsistency = true;
        inconsistencyError = `Esta distribución no es posible en Mudae: la esfera ${clue.type.toUpperCase()} en Fila ${clue.r + 1}, Col ${clue.c + 1} contradice la posición de la esfera ROJA (Fila ${redPos.r + 1}, Col ${redPos.c + 1}).`;
        break;
      }
    }
  }

  // Filter possible candidate cells geometrically
  const candidateCells: { r: number; c: number }[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) continue; // Center is never Red
      if (grid[r][c] !== 'hidden' && grid[r][c] !== 'red') continue;

      let compatible = true;
      for (const clue of clues) {
        if (!isRedCandidateCompatibleWithClue(r, c, clue.r, clue.c, clue.type)) {
          compatible = false;
          break;
        }
      }
      if (compatible) {
        candidateCells.push({ r, c });
      }
    }
  }

  if (!foundRed && clues.length > 0 && candidateCells.length === 0) {
    hasInconsistency = true;
    inconsistencyError =
      'Esta distribución no es posible en Mudae: las pistas ingresadas se contradicen entre sí y no dejan ninguna casilla válida para la esfera roja.';
  }

  const redProbabilities: number[][] = Array(5)
    .fill(0)
    .map(() => Array(5).fill(0));

  const expectedValues: number[][] = Array(5)
    .fill(0)
    .map(() => Array(5).fill(0));

  const cellAdvice: Record<string, string> = {};
  const moveQualityMap: Record<string, MoveQuality> = {};

  // Case 1: Red NOT found
  if (!foundRed) {
    // 1A: 0 clues entered (Turn 1 / Depth 5) -> Exact Opening Book
    if (clues.length === 0) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          expectedValues[r][c] = ROOT_EV_GRID[idx];
          if (idx !== 12) {
            redProbabilities[r][c] = 1 / 24;
            const isBest = ROOT_BEST_MOVES.some((m) => m.r === r && m.c === c);
            moveQualityMap[`${r}-${c}`] = {
              r,
              c,
              entropy: 0,
              expectedRemaining: 24,
              probRed: 1 / 24,
              isProbeOnly: false,
              score: ROOT_EV_GRID[idx],
            };
            if (isBest) {
              cellAdvice[`${r}-${c}`] = 'Óptimo de apertura: Esquina interna (EV exacto 344.73)';
            }
          }
        }
      }

      return {
        possibleRedCells: candidateCells,
        redProbabilities,
        bestMoves: ROOT_BEST_MOVES,
        foundRed: false,
        cellAdvice,
        expectedValues,
        moveQualityMap,
        hasInconsistency,
        inconsistencyError,
      };
    }

    // Filter matching canonical boards
    const matchingBoardIndices: number[] = [];
    for (let i = 0; i < TOTAL_BOARDS; i++) {
      let ok = true;
      for (const clue of clues) {
        const expectedCol = COLOR_CHAR_TO_INT[COLOR_CHARS[COLOR_INT_TO_TYPE.indexOf(clue.type)]];
        if (FLAT_BOARDS[i * 25 + clue.cellIdx] !== expectedCol) {
          ok = false;
          break;
        }
      }
      if (ok) {
        matchingBoardIndices.push(i);
      }
    }

    if (matchingBoardIndices.length === 0 && clues.length > 0) {
      hasInconsistency = true;
      if (!inconsistencyError) {
        inconsistencyError =
          'Esta combinación de esferas no existe en el conjunto canónico de tableros de Mudae.';
      }
    }

    // Calculate Bayesian posterior for Red
    let totalMatchingWeight = 0;
    const redWeightPerPos = Array(25).fill(0);
    for (const bIdx of matchingBoardIndices) {
      const rPos = BOARD_RED_POS[bIdx];
      const w = BOARD_WEIGHTS[bIdx];
      redWeightPerPos[rPos] += w;
      totalMatchingWeight += w;
    }

    if (totalMatchingWeight > 0) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          redProbabilities[r][c] = redWeightPerPos[idx] / totalMatchingWeight;
        }
      }
      candidateCells.sort(
        (a, b) => redProbabilities[b.r][b.c] - redProbabilities[a.r][a.c]
      );
    } else {
      for (const cell of candidateCells) {
        redProbabilities[cell.r][cell.c] = candidateCells.length > 0 ? 1 / candidateCells.length : 0;
      }
    }

    const unrevealedCells: { r: number; c: number; idx: number }[] = [];
    let unrevealedMask = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        if (grid[r][c] === 'hidden' && idx !== 12) {
          unrevealedCells.push({ r, c, idx });
          unrevealedMask |= (1 << idx);
        }
      }
    }

    const clicksUsed = clues.length;
    const remainingDepth = Math.max(1, 5 - clicksUsed);
    const bestMoves: { r: number; c: number }[] = [];

    // 1B: Exactly 1 clue entered (Turn 2 / Depth 4) -> Instant D4 Opening Book Lookup
    if (clicksUsed === 1) {
      const clue = clues[0];
      const bookKey = `${clue.cellIdx},${clue.type}`;
      const bookEntry = d4BookData[bookKey];

      if (bookEntry && bookEntry.per_cell_ev) {
        let maxEvInBook = -1;
        for (let i = 0; i < 25; i++) {
          const evVal = bookEntry.per_cell_ev[i];
          if (evVal !== null && evVal !== undefined) {
            const r = Math.floor(i / 5);
            const c = i % 5;
            expectedValues[r][c] = evVal;
            const probRed = redProbabilities[r][c];
            moveQualityMap[`${r}-${c}`] = {
              r,
              c,
              entropy: 0,
              expectedRemaining: candidateCells.length,
              probRed,
              isProbeOnly: probRed === 0,
              score: evVal,
            };
            if (evVal > maxEvInBook) {
              maxEvInBook = evVal;
            }
          }
        }

        // Collect best moves within 0.05 of max EV
        for (const cell of unrevealedCells) {
          const evVal = expectedValues[cell.r][cell.c];
          if (Math.abs(evVal - maxEvInBook) < 0.05) {
            bestMoves.push({ r: cell.r, c: cell.c });
          }
        }

        if (bestMoves.length === 0 && bookEntry.best !== undefined && bookEntry.best >= 0) {
          bestMoves.push({ r: Math.floor(bookEntry.best / 5), c: bookEntry.best % 5 });
        }

        return {
          possibleRedCells: candidateCells,
          redProbabilities,
          bestMoves: bestMoves.length > 0 ? bestMoves : unrevealedCells.map((u) => ({ r: u.r, c: u.c })),
          foundRed: false,
          cellAdvice,
          expectedValues,
          moveQualityMap,
          hasInconsistency,
          inconsistencyError,
        };
      }
    }

    // 1C: 2+ clues entered (Turns 3, 4, 5 / Depth 3, 2, 1) -> Fast Expectimax Tree Search
    const activeArray = new Uint16Array(matchingBoardIndices);
    const searchResult = solveExpectimax(activeArray, remainingDepth, unrevealedMask);

    let maxScore = -1;
    for (const u of unrevealedCells) {
      const evScore = searchResult.perCellEV[u.idx];
      expectedValues[u.r][u.c] = evScore;
      const probRed = redProbabilities[u.r][u.c];

      const quality: MoveQuality = {
        r: u.r,
        c: u.c,
        entropy: 0,
        expectedRemaining: candidateCells.length,
        probRed,
        isProbeOnly: probRed === 0,
        score: evScore,
      };

      moveQualityMap[`${u.r}-${u.c}`] = quality;
      if (evScore > maxScore) {
        maxScore = evScore;
      }
    }

    // Collect candidates and probe moves within 0.05 of maxScore
    const topMoves: MoveQuality[] = [];
    for (const u of unrevealedCells) {
      const q = moveQualityMap[`${u.r}-${u.c}`];
      if (q && Math.abs(q.score - maxScore) < 0.05) {
        topMoves.push(q);
      }
    }

    // If multiple moves share top EV, prioritize highest red probability
    topMoves.sort((a, b) => b.probRed - a.probRed);
    const maxProbAmongTop = topMoves.length > 0 ? topMoves[0].probRed : 0;

    for (const m of topMoves) {
      if (maxProbAmongTop > 0) {
        if (m.probRed > 0) {
          bestMoves.push({ r: m.r, c: m.c });
        }
      } else {
        bestMoves.push({ r: m.r, c: m.c });
      }
    }

    if (bestMoves.length === 0 && searchResult.bestMove >= 0) {
      bestMoves.push({
        r: Math.floor(searchResult.bestMove / 5),
        c: searchResult.bestMove % 5,
      });
    }

    return {
      possibleRedCells: candidateCells,
      redProbabilities,
      bestMoves: bestMoves.length > 0 ? bestMoves : unrevealedCells.map((u) => ({ r: u.r, c: u.c })),
      foundRed: false,
      cellAdvice,
      expectedValues,
      moveQualityMap,
      hasInconsistency,
      inconsistencyError,
    };
  }

  // Case 2: Red FOUND -> Phase 2 Greedy Harvest
  const rR = redPos!.r;
  const cR = redPos!.c;

  let revealedOranges = 0;
  let revealedYellows = 0;
  let revealedGreens = 0;

  for (const clue of clues) {
    if (clue.type === 'orange') revealedOranges++;
    if (clue.type === 'yellow') revealedYellows++;
    if (clue.type === 'green') revealedGreens++;
  }

  const remainingOranges = Math.max(0, 2 - revealedOranges);
  const remainingYellows = Math.max(0, 3 - revealedYellows);
  const remainingGreens = Math.max(0, 4 - revealedGreens);

  let maxEV = -1;
  let bestValueMoves: { r: number; c: number }[] = [];

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] !== 'hidden') continue;

      const dr = Math.abs(r - rR);
      const dc = Math.abs(c - cR);
      const isOrthogonalAdj = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
      const isDiagonal = dr === dc && !(dr === 0 && dc === 0);
      const isSameRowCol = (r === rR || c === cR) && !(dr === 0 && dc === 0);

      let ev = 0;
      let advice = '';

      if (isOrthogonalAdj && remainingOranges > 0) {
        ev = 100 + remainingOranges * 10;
        advice = 'Máximo valor: Posible Orange (Adyacente a Roja)';
      } else if (isDiagonal && remainingYellows > 0) {
        ev = 60 + remainingYellows * 5;
        advice = 'Alto valor: Posible Yellow (Diagonal a Roja)';
      } else if (isSameRowCol && remainingGreens > 0) {
        ev = 30;
        advice = 'Valor medio: Posible Green (Misma fila/col)';
      } else {
        ev = 5;
        advice = 'Bajo valor: Teal o Blue';
      }

      expectedValues[r][c] = ev;
      cellAdvice[`${r}-${c}`] = advice;

      if (ev > maxEV) {
        maxEV = ev;
        bestValueMoves = [{ r, c }];
      } else if (ev === maxEV) {
        bestValueMoves.push({ r, c });
      }
    }
  }

  return {
    possibleRedCells: candidateCells,
    redProbabilities,
    bestMoves: bestValueMoves,
    foundRed: true,
    redPosition: redPos,
    cellAdvice,
    expectedValues,
    moveQualityMap,
    hasInconsistency,
    inconsistencyError,
  };
}
