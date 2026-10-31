import { useState, useMemo } from 'react';
import type { SphereType } from '../utils/ouroChest';
import {
  solveOuroChest,
  getNextCycleColor,
  MAX_SPHERE_COUNTS,
} from '../utils/ouroChest';
import { useLanguage } from '../context/LanguageContext';
import {
  RotateCcw,
  Sparkles,
  HelpCircle,
  Trophy,
  AlertTriangle,
  Lightbulb,
  MousePointerClick,
  Award,
  Target,
  Compass,
  Lock,
} from 'lucide-react';

const SPHERE_DETAILS: Record<
  SphereType,
  { name: string; color: string; desc: string; bg: string; border: string; valueScore: number }
> = {
  hidden: {
    name: 'Oculta',
    color: '#6b7280',
    desc: 'Sin revelar',
    bg: 'bg-[#181924]',
    border: 'border-[#292c3d]',
    valueScore: 0,
  },
  blue: {
    name: 'Blue',
    color: '#3b82f6',
    desc: 'NUNCA en la misma fila, columna ni diagonal que la roja',
    bg: 'bg-blue-500/25',
    border: 'border-blue-500',
    valueScore: 10,
  },
  teal: {
    name: 'Teal',
    color: '#14b8a6',
    desc: 'Misma fila, columna O diagonal que la roja',
    bg: 'bg-teal-500/25',
    border: 'border-teal-500',
    valueScore: 20,
  },
  green: {
    name: 'Green',
    color: '#22c55e',
    desc: '4 esferas (misma fila o columna que la roja)',
    bg: 'bg-green-500/25',
    border: 'border-green-500',
    valueScore: 35,
  },
  yellow: {
    name: 'Yellow',
    color: '#eab308',
    desc: '3 esferas (siempre en diagonal a la roja)',
    bg: 'bg-yellow-500/25',
    border: 'border-yellow-500',
    valueScore: 55,
  },
  orange: {
    name: 'Orange',
    color: '#f97316',
    desc: '2 esferas (siempre adyacente ortogonal a la roja)',
    bg: 'bg-orange-500/25',
    border: 'border-orange-500',
    valueScore: 90,
  },
  red: {
    name: 'Red (Objetivo)',
    color: '#ef4444',
    desc: '1 esfera roja (nunca en el centro)',
    bg: 'bg-red-500/30',
    border: 'border-red-500',
    valueScore: 150,
  },
};

export const OuroChestSolver: React.FC = () => {
  const { t } = useLanguage();
  const [grid, setGrid] = useState<SphereType[][]>(() =>
    Array(5)
      .fill(null)
      .map(() => Array(5).fill('hidden'))
  );

  const [clicksUsed, setClicksUsed] = useState<number>(0);

  const analysis = useMemo(() => solveOuroChest(grid), [grid]);

  const handleCellClick = (r: number, c: number) => {
    cycleCell(r, c, false);
  };
  const handleCellContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    cycleCell(r, c, true);
  };

  const cycleCell = (r: number, c: number, reverse: boolean) => {
    const current = grid[r][c];

    if (clicksUsed >= 5 && current === 'hidden') {
      return;
    }
    const countsOnOtherCells: Partial<Record<SphereType, number>> = {};
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (row === r && col === c) continue;
        const type = grid[row][col];
        if (type !== 'hidden') {
          countsOnOtherCells[type] = (countsOnOtherCells[type] || 0) + 1;
        }
      }
    }

    const disallowedColors: SphereType[] = [];
    for (const [type, maxCount] of Object.entries(MAX_SPHERE_COUNTS) as [SphereType, number][]) {
      if ((countsOnOtherCells[type] || 0) >= maxCount) {
        disallowedColors.push(type);
      }
    }

    const next = getNextCycleColor(current, reverse, disallowedColors);

    const newGrid = grid.map((rowArr, rowIndex) =>
      rowArr.map((cell, colIndex) => {
        if (rowIndex === r && colIndex === c) return next;
        return cell;
      })
    );

    setGrid(newGrid);

    let revealedCount = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (newGrid[row][col] !== 'hidden') revealedCount++;
      }
    }
    setClicksUsed(revealedCount);
  };

  const handleReset = () => {
    setGrid(
      Array(5)
        .fill(null)
        .map(() => Array(5).fill('hidden'))
    );
    setClicksUsed(0);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-[#171922] via-[#1a1c27] to-[#171922] border border-[#2b2e3e] rounded-2xl p-4 sm:p-5 shadow-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-red-400" />
        </div>
        <div className="text-sm text-gray-300 space-y-1.5 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              {t('oc.title')}
              <span className="text-xs bg-red-500/15 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full font-mono">
                {clicksUsed}/5 {t('oc.attempts')}
              </span>
            </h2>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#111217] hover:bg-[#1a1c24] px-3 py-1.5 rounded-lg border border-[#2b2e3e] transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('oc.resetBoard')}
            </button>
          </div>

          <div className="text-xs text-gray-300 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-[#101117] px-2 py-0.5 rounded border border-[#2b2d3d] text-teal-300 font-mono">
              <MousePointerClick className="w-3.5 h-3.5" /> {t('oc.leftClick')}
            </span>
            <span className="flex items-center gap-1.5 font-semibold font-mono text-[11px] sm:text-xs">
              <span className="text-blue-400">Blue</span>
              <span className="text-gray-500">→</span>
              <span className="text-teal-400">Teal</span>
              <span className="text-gray-500">→</span>
              <span className="text-emerald-400">Green</span>
              <span className="text-gray-500">→</span>
              <span className="text-yellow-400">Yellow</span>
              <span className="text-gray-500">→</span>
              <span className="text-orange-400">Orange</span>
              <span className="text-gray-500">→</span>
              <span className="text-rose-400">Red</span>
            </span>
            <span className="text-gray-600">|</span>
            <span className="inline-flex items-center gap-1 bg-[#101117] px-2 py-0.5 rounded border border-[#2b2d3d] text-amber-300 font-mono">
              {t('oc.rightClick')}
            </span>
            <span className="text-gray-400">{t('oc.reverseOrder')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#13141c]/90 border border-[#222432] rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col items-center space-y-5">
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              {analysis.foundRed ? t('oc.phase2') : t('oc.phase1')}
            </span>

            {analysis.hasInconsistency ? (
              <span className="text-xs font-semibold text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('oc.invalidDistribution')}
              </span>
            ) : analysis.foundRed ? (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                {t('oc.lookingPoints').replace('{count}', String(5 - clicksUsed))}
              </span>
            ) : analysis.possibleRedCells.length === 0 ? (
              <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('oc.noCompatible')}
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-mono">
                {t('oc.possibleReds').replace('{count}', String(analysis.possibleRedCells.length))}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-3 p-3 bg-[#0c0d12] rounded-2xl border border-[#1f212e] shadow-inner select-none">
            {grid.map((row, r) =>
              row.map((cellType, c) => {
                const isCenter = r === 2 && c === 2;
                const prob = analysis.redProbabilities[r][c];
                const isBest = analysis.bestMoves.some((m) => m.r === r && m.c === c);
                const isRevealed = cellType !== 'hidden';
                const isLocked = clicksUsed >= 5 && !isRevealed;
                const advice = analysis.cellAdvice[`${r}-${c}`];

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={isLocked}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleCellContextMenu(e, r, c)}
                    title={
                      isRevealed
                        ? `${cellType.toUpperCase()} (${t('oc.clickToCycle')})`
                        : isLocked
                        ? t('oc.lockedTooltip')
                        : advice ||
                          `${t('oc.rowCol').replace('{r}', String(r + 1)).replace('{c}', String(c + 1))}${
                            isCenter ? ` (${t('oc.centerTooltip')})` : ''
                          }`
                    }
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex flex-col items-center justify-center transition-all font-bold select-none ${
                      isLocked
                        ? 'opacity-40 cursor-not-allowed bg-[#111219] border border-[#1d1f2b]'
                        : isRevealed
                        ? `${SPHERE_DETAILS[cellType].bg} ${SPHERE_DETAILS[cellType].border} border-2 shadow-lg cursor-pointer`
                        : isBest
                        ? 'bg-teal-500/20 border-2 border-teal-400 shadow-[0_0_18px_rgba(20,184,166,0.55)] scale-[1.04] z-10 animate-pulse cursor-pointer'
                        : isCenter && !analysis.foundRed
                        ? 'bg-[#141520] hover:bg-[#1a1b28] border border-[#232536] hover:border-gray-500 cursor-pointer'
                        : 'bg-[#161722] hover:bg-[#1f2130] border border-[#282b3d] hover:border-gray-500 cursor-pointer'
                    }`}
                  >
                    {isBest && !isRevealed && !isLocked && (
                      <span className="absolute -top-2 -right-1 bg-teal-400 text-[#0c0d12] font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase shadow">
                        {analysis.foundRed ? t('oc.pointsBadge') : t('oc.optimal')}
                      </span>
                    )}

                    {isLocked && (
                      <span className="absolute -top-1.5 -right-1 bg-[#1c1e2b] text-gray-400 p-0.5 rounded-full border border-[#2d3045] shadow">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}

                    {isRevealed ? (
                      <div className="flex flex-col items-center">
                        <div
                          className="w-5 h-5 rounded-full shadow-md transition-all"
                          style={{
                            backgroundColor: SPHERE_DETAILS[cellType].color,
                            boxShadow: `0 0 10px ${SPHERE_DETAILS[cellType].color}aa`,
                          }}
                        />
                        <span className="text-[10px] mt-1 text-gray-300 font-mono capitalize">
                          {t(`sphere.${cellType}`)}
                        </span>
                      </div>
                    ) : isCenter && !analysis.foundRed ? (
                      <span className="text-[10px] text-gray-500 font-mono text-center leading-tight">
                        {t('oc.center').split('\n').map((line, lIdx) => (
                          <span key={lIdx}>
                            {line}
                            {lIdx === 0 && <br />}
                          </span>
                        ))}
                      </span>
                    ) : analysis.foundRed ? (
                      <div className="flex flex-col items-center">
                        {analysis.expectedValues[r][c] >= 100 ? (
                          <span className="text-xs font-bold text-orange-400 font-mono animate-bounce">
                            Orange!
                          </span>
                        ) : analysis.expectedValues[r][c] >= 60 ? (
                          <span className="text-xs font-bold text-yellow-400 font-mono">
                            Yellow
                          </span>
                        ) : analysis.expectedValues[r][c] >= 30 ? (
                          <span className="text-[11px] text-green-400 font-mono">
                            Green
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-mono">
                            {t('sphere.teal')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {prob > 0 ? (
                          <>
                            <span
                              className={`text-xs font-mono font-bold ${
                                isBest ? 'text-teal-300' : 'text-gray-300'
                              }`}
                            >
                              {(prob * 100).toFixed((prob * 100) % 1 === 0 ? 0 : 1)}%
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-tighter">
                              Prob
                            </span>
                          </>
                        ) : isBest ? (
                          <>
                            <span className="text-xs font-mono font-bold text-teal-300 animate-pulse">
                              ?
                            </span>
                            <span className="text-[9px] text-teal-400/90 uppercase tracking-tighter">
                              {t('oc.probe')}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-600 text-xs font-mono">0%</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {analysis.hasInconsistency && (
            <div className="w-full bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3.5 sm:p-4 text-xs text-rose-200 flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-300">{t('oc.invalidTitle')}</p>
                <p className="text-rose-200/90 leading-relaxed text-[11px] sm:text-xs">
                  {analysis.inconsistencyError || t('oc.invalidDesc')}
                </p>
              </div>
            </div>
          )}

          <div className="text-[11px] text-gray-400 text-center flex items-center gap-1.5 max-w-md">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {analysis.foundRed ? t('oc.advicePhase2') : t('oc.advicePhase1')}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#13141c]/90 border border-[#222432] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-400" />
                {t('oc.recTitle')}
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                {analysis.foundRed
                  ? t('oc.recModePhase2')
                  : t('oc.recPossibleCount', { count: analysis.possibleRedCells.length })}
              </span>
            </div>

            {analysis.hasInconsistency ? (
              <div className="bg-[#0c0d12] border border-rose-500/30 rounded-2xl p-4 text-center text-xs text-rose-300 font-mono">
                {t('oc.boardInconsistent')}
              </div>
            ) : analysis.bestMoves.length > 0 ? (
              <div className="bg-[#0c0d12] border border-[#1f212e] rounded-2xl p-4 text-center space-y-2 shadow-inner">
                <div className="text-xs font-semibold text-gray-400">
                  {t('oc.bestMove')}{' '}
                  <span className="text-teal-400 font-mono font-bold text-sm">
                    {t('oc.rowCol', { r: analysis.bestMoves[0].r + 1, c: analysis.bestMoves[0].c + 1 })}
                  </span>
                  {analysis.bestMoves.length > 1 && (
                    <span className="text-gray-500 text-[11px] block mt-0.5">
                      {t('oc.orHighlighted')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-mono pt-1 border-t border-[#1a1c27]">
                  {analysis.foundRed ? (
                    <div>
                      <span className="text-gray-500">{t('oc.ev')} </span>
                      <span className="text-amber-400 font-bold">
                        +{analysis.expectedValues[analysis.bestMoves[0].r][analysis.bestMoves[0].c]} pts
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-gray-500">{t('oc.evScore')} </span>
                        <span className="text-teal-300 font-bold">
                          {analysis.moveQualityMap[`${analysis.bestMoves[0].r}-${analysis.bestMoves[0].c}`]?.score.toFixed(2) || 'N/A'} pts
                        </span>
                      </div>
                      <span className="text-gray-700">•</span>
                      <div>
                        <span className="text-gray-500">{t('oc.redProb')} </span>
                        <span
                          className={`font-bold ${
                            analysis.redProbabilities[analysis.bestMoves[0].r][analysis.bestMoves[0].c] > 0
                              ? 'text-rose-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {(analysis.redProbabilities[analysis.bestMoves[0].r][analysis.bestMoves[0].c] * 100).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#0c0d12] border border-[#1f212e] rounded-2xl p-4 text-center text-xs text-rose-400">
                {t('oc.noMoves')}
              </div>
            )}
          </div>

          <div className="bg-[#13141c]/90 border border-[#222432] rounded-3xl p-5 sm:p-6 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-rose-400" />
                {t('oc.likelyRedsTitle')}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {t('oc.candidatesCount', { count: analysis.possibleRedCells.length })}
              </span>
            </div>

            {analysis.foundRed ? (
              <div className="bg-[#0c0d12] border border-[#1f212e] rounded-xl p-3 text-center text-xs text-emerald-400 font-mono">
                {t('oc.redFoundAt', { r: analysis.redPosition!.r + 1, c: analysis.redPosition!.c + 1 })}
              </div>
            ) : analysis.possibleRedCells.length === 0 ? (
              <div className="bg-[#0c0d12] border border-[#1f212e] rounded-xl p-3 text-center text-xs text-rose-400">
                {t('oc.noCompatible')}
              </div>
            ) : (
              <div className="space-y-1.5">
                {analysis.possibleRedCells.slice(0, 5).map((cell, idx) => {
                  const prob = analysis.redProbabilities[cell.r][cell.c];
                  return (
                    <div
                      key={`cand-${cell.r}-${cell.c}`}
                      className="flex items-center justify-between bg-[#0c0d12] hover:bg-[#12131a] border border-[#1b1c26] rounded-xl px-3 py-2 text-xs transition-colors"
                    >
                      <span className="font-mono text-gray-300 flex items-center gap-1.5">
                        {idx === 0 ? (
                          <span className="text-amber-400 font-bold">👉 #{idx + 1}</span>
                        ) : (
                          <span className="text-gray-500">#{idx + 1}</span>
                        )}
                        <span>·</span>
                        <span>{t('oc.rowCol', { r: cell.r + 1, c: cell.c + 1 })}</span>
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#13141c]/90 border border-[#222432] rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                {t('oc.hierarchyTitle')}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">{t('oc.hierarchyOrder')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['blue', 'teal', 'green', 'yellow', 'orange', 'red'] as SphereType[]).map(
                (type) => {
                  const det = SPHERE_DETAILS[type];
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold ${det.bg} ${det.border}`}
                    >
                      <div
                        className="w-3 rounded-full h-3 shrink-0 shadow-sm"
                        style={{
                          backgroundColor: det.color,
                          boxShadow: `0 0 8px ${det.color}aa`,
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="capitalize leading-tight">{t(`sphere.${type}`)}</span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          +{det.valueScore} pts
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#13141c]/90 border border-[#222432] rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-400" />
          {t('oc.howToUseTitle')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-300">
          <div className="flex items-start gap-3 bg-[#0c0d12] p-3.5 rounded-2xl border border-[#1f212e]">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">{t('oc.step1Title')}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {t('oc.step1Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0c0d12] p-3.5 rounded-2xl border border-[#1f212e]">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">{t('oc.step2Title')}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {t('oc.step2Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0c0d12] p-3.5 rounded-2xl border border-[#1f212e]">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">{t('oc.step3Title')}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {t('oc.step3Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0c0d12] p-3.5 rounded-2xl border border-[#1f212e]">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              4
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">{t('oc.step4Title')}</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {t('oc.step4Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
