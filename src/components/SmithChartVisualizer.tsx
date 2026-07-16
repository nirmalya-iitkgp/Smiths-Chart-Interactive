import React, { useRef, useState, useEffect } from 'react';
import { Complex, MatchingState } from '../types';
import { 
  complex, 
  zToGamma, 
  gammaToZ, 
  magnitude, 
  add, 
  sub, 
  zToY, 
  yToZ, 
  generateTrajectory,
  calculateSWR,
  calculateReturnLoss
} from '../utils/mathUtils';

interface SmithChartVisualizerProps {
  zLoad: Complex;
  onSelectImpedance: (z: Complex) => void;
  matchingStates: MatchingState[];
  components: any[];
  highlightRegion?: 'short' | 'open' | 'unity_r' | 'unity_g' | 'inductive' | 'capacitive' | 'center' | 'all';
  showAdmittanceGrid: boolean;
  freq: number;
  z0: number;
  vswrCircleVal: number | null; // SWR circle magnitude to draw
}

export default function SmithChartVisualizer({
  zLoad,
  onSelectImpedance,
  matchingStates,
  components,
  highlightRegion = 'all',
  showAdmittanceGrid,
  freq,
  z0,
  vswrCircleVal,
}: SmithChartVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [hoverData, setHoverData] = useState<{
    screenX: number;
    screenY: number;
    gamma: Complex;
    z: Complex;
    y: Complex;
    swr: number;
    rl: number;
  } | null>(null);

  // Responsive container resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        // Keep it square
        setDimensions({ width, height: width });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const CX = dimensions.width / 2;
  const CY = dimensions.height / 2;
  const R_chart = (Math.min(dimensions.width, dimensions.height) / 2) * 0.9;

  // Grid values
  const rValues = [0.2, 0.5, 1.0, 2.0, 5.0];
  const xValues = [0.2, 0.5, 1.0, 2.0, 5.0];

  // Map reflection coefficient to screen coordinates
  const gammaToScreen = (g: Complex) => {
    return {
      x: CX + g.re * R_chart,
      y: CY - g.im * R_chart,
    };
  };

  // Map screen coordinates back to reflection coefficient
  const screenToGamma = (sx: number, sy: number): Complex => {
    return {
      re: (sx - CX) / R_chart,
      im: (CY - sy) / R_chart,
    };
  };

  // Generate path for constant-reactance arcs
  const getReactancePath = (x: number) => {
    if (Math.abs(x) < 1e-4) {
      return `M ${CX - R_chart} ${CY} L ${CX + R_chart} ${CY}`;
    }
    const rValuesTrajectory = [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0];
    let path = '';
    rValuesTrajectory.forEach((r, idx) => {
      const gamma = zToGamma({ re: r, im: x });
      const pt = gammaToScreen(gamma);
      if (idx === 0) path += `M ${pt.x} ${pt.y}`;
      else path += ` L ${pt.x} ${pt.y}`;
    });
    path += ` L ${CX + R_chart} ${CY}`; // converge to open circuit
    return path;
  };

  // Generate path for constant-susceptance arcs
  const getSusceptancePath = (b: number) => {
    const gValuesTrajectory = [0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0, 20.0, 50.0];
    let path = '';
    gValuesTrajectory.forEach((g, idx) => {
      const z = yToZ({ re: g, im: b });
      const gamma = zToGamma(z);
      const pt = gammaToScreen(gamma);
      if (idx === 0) path += `M ${pt.x} ${pt.y}`;
      else path += ` L ${pt.x} ${pt.y}`;
    });
    path += ` L ${CX - R_chart} ${CY}`; // converge to short circuit
    return path;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const gamma = screenToGamma(sx, sy);
    const mag = magnitude(gamma);

    // Only track when inside or near the chart boundary
    if (mag <= 1.05) {
      const clampedGamma = mag > 1.0 ? { re: gamma.re / mag, im: gamma.im / mag } : gamma;
      const z = gammaToZ(clampedGamma);
      const y = zToY(z);
      const swr = calculateSWR(clampedGamma);
      const rl = calculateReturnLoss(clampedGamma);

      setHoverData({
        screenX: sx,
        screenY: sy,
        gamma: clampedGamma,
        z,
        y,
        swr,
        rl,
      });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const gamma = screenToGamma(sx, sy);
    const mag = magnitude(gamma);

    if (mag <= 1.02) {
      const clampedGamma = mag > 1.0 ? { re: gamma.re / mag, im: gamma.im / mag } : gamma;
      const z = gammaToZ(clampedGamma);
      onSelectImpedance(z);
    }
  };

  // Highlight specific educational layers
  const renderHighlights = () => {
    switch (highlightRegion) {
      case 'short':
        return (
          <g>
            <circle cx={CX - R_chart} cy={CY} r="12" fill="var(--color-emerald-500)" fillOpacity="0.2" stroke="var(--color-emerald-500)" strokeWidth="2" strokeDasharray="3 3" />
            <line x1={CX - R_chart} y1={CY} x2={CX - R_chart - 30} y2={CY - 30} stroke="var(--color-emerald-500)" strokeWidth="1.5" />
            <text x={CX - R_chart - 35} y={CY - 35} textAnchor="end" fill="var(--color-emerald-400)" className="text-xs font-semibold">Short Circuit (0 Ω)</text>
          </g>
        );
      case 'open':
        return (
          <g>
            <circle cx={CX + R_chart} cy={CY} r="12" fill="var(--color-sky-500)" fillOpacity="0.2" stroke="var(--color-sky-500)" strokeWidth="2" strokeDasharray="3 3" />
            <line x1={CX + R_chart} y1={CY} x2={CX + R_chart + 30} y2={CY - 30} stroke="var(--color-sky-500)" strokeWidth="1.5" />
            <text x={CX + R_chart + 35} y={CY - 35} textAnchor="start" fill="var(--color-sky-400)" className="text-xs font-semibold">Open Circuit (∞ Ω)</text>
          </g>
        );
      case 'unity_r':
        return (
          <g>
            <circle cx={CX + R_chart / 2} cy={CY} r={R_chart / 2} fill="none" stroke="var(--color-indigo-500)" strokeWidth="3" className="animate-pulse" />
            <text x={CX + 10} y={CY - R_chart / 2 - 10} fill="var(--color-indigo-400)" className="text-xs font-bold">Unity Resistance Circle (r = 1)</text>
          </g>
        );
      case 'unity_g':
        return (
          <g>
            <circle cx={CX - R_chart / 2} cy={CY} r={R_chart / 2} fill="none" stroke="var(--color-amber-500)" strokeWidth="3" className="animate-pulse" />
            <text x={CX - 10} y={CY - R_chart / 2 - 10} textAnchor="end" fill="var(--color-amber-400)" className="text-xs font-bold">Unity Conductance Circle (g = 1)</text>
          </g>
        );
      case 'inductive':
        return (
          <path
            d={`M ${CX - R_chart} ${CY} A ${R_chart} ${R_chart} 0 0 1 ${CX + R_chart} ${CY} Z`}
            fill="var(--color-rose-500)"
            fillOpacity="0.08"
            stroke="var(--color-rose-500)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        );
      case 'capacitive':
        return (
          <path
            d={`M ${CX - R_chart} ${CY} A ${R_chart} ${R_chart} 0 0 0 ${CX + R_chart} ${CY} Z`}
            fill="var(--color-cyan-500)"
            fillOpacity="0.08"
            stroke="var(--color-cyan-500)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        );
      case 'center':
        return (
          <g>
            <circle cx={CX} cy={CY} r="10" fill="var(--color-emerald-500)" fillOpacity="0.3" stroke="var(--color-emerald-400)" strokeWidth="2" />
            <line x1={CX} y1={CY} x2={CX + 40} y2={CY + 40} stroke="var(--color-emerald-400)" strokeWidth="1.5" />
            <text x={CX + 45} y={CY + 45} textAnchor="start" fill="var(--color-emerald-400)" className="text-xs font-semibold">Perfect Match (50 Ω, Γ=0)</text>
          </g>
        );
      default:
        return null;
    }
  };

  // Render smooth matching trajectory paths
  const renderMatchingPaths = () => {
    if (matchingStates.length < 2) return null;

    const paths: React.ReactNode[] = [];

    for (let i = 0; i < matchingStates.length - 1; i++) {
      const startState = matchingStates[i];
      const endState = matchingStates[i + 1];
      const comp = components[i];

      if (!comp) continue;

      // Generate intermediate trajectory points for smooth curves
      const trajectory = generateTrajectory(startState.z, comp.type, comp.value, 40, freq, z0);
      const pts = trajectory.map((zPt) => gammaToScreen(zToGamma(zPt)));

      let dStr = `M ${pts[0].x} ${pts[0].y}`;
      for (let j = 1; j < pts.length; j++) {
        dStr += ` L ${pts[j].x} ${pts[j].y}`;
      }

      const colorClass = comp.type.startsWith('series') ? 'stroke-indigo-500' : 'stroke-amber-500';

      paths.push(
        <g key={`traj-${comp.id}`}>
          {/* Path line */}
          <path
            d={dStr}
            fill="none"
            className={`${colorClass} stroke-[3.5]`}
            strokeLinecap="round"
          />
          {/* Arrow heads or dynamic marker along path */}
          {pts.length > 20 && (
            <polygon
              points="0,0 -4,10 4,10"
              fill={comp.type.startsWith('series') ? '#6366f1' : '#f59e0b'}
              transform={`translate(${pts[20].x}, ${pts[20].y}) rotate(${
                (Math.atan2(pts[21].y - pts[19].y, pts[21].x - pts[19].x) * 180) / Math.PI + 90
              })`}
            />
          )}
        </g>
      );
    }

    return paths;
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-w-[600px] mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-4 overflow-hidden select-none">
      <svg
        id="smith-chart-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-crosshair overflow-visible"
      >
        <defs>
          <radialGradient id="chart-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Background circle */}
        <circle cx={CX} cy={CY} r={R_chart} fill="url(#chart-bg)" />

        {/* Highlight Regions overlay */}
        {renderHighlights()}

        {/* ================= RESISTANCE GRID (IMPENDANCE) ================= */}
        <g id="resistance-grid" stroke="#334155" strokeWidth="1" fill="none">
          {rValues.map((r) => {
            const r_radius = (1 / (r + 1)) * R_chart;
            const r_cx = CX + (r / (r + 1)) * R_chart;
            return (
              <circle
                key={`r-${r}`}
                cx={r_cx}
                cy={CY}
                r={r_radius}
                className="transition-colors hover:stroke-slate-600"
              />
            );
          })}
          {/* Unity circle highlighted slightly more */}
          <circle cx={CX + R_chart / 2} cy={CY} r={R_chart / 2} stroke="#475569" strokeWidth="1.5" />
          {/* Outer Boundary (r = 0) */}
          <circle cx={CX} cy={CY} r={R_chart} stroke="#64748b" strokeWidth="2" />
        </g>

        {/* ================= REACTANCE GRID (IMPEDANCE) ================= */}
        <g id="reactance-grid" stroke="#334155" strokeWidth="1" fill="none">
          {xValues.flatMap((x) => [
            <path key={`x-pos-${x}`} d={getReactancePath(x)} className="transition-colors hover:stroke-slate-600" />,
            <path key={`x-neg-${x}`} d={getReactancePath(-x)} className="transition-colors hover:stroke-slate-600" />,
          ])}
          {/* Real Axis Line (x = 0) */}
          <line x1={CX - R_chart} y1={CY} x2={CX + R_chart} y2={CY} stroke="#475569" strokeWidth="2" />
        </g>

        {/* ================= ADMITTANCE GRID (OPTIONAL OVERLAY) ================= */}
        {showAdmittanceGrid && (
          <g id="admittance-grid">
            {/* Conductance circles (G) */}
            <g stroke="#1e293b" strokeWidth="0.75" strokeDasharray="3 3" fill="none">
              {rValues.map((g) => {
                const g_radius = (1 / (g + 1)) * R_chart;
                const g_cx = CX - (g / (g + 1)) * R_chart;
                return <circle key={`g-${g}`} cx={g_cx} cy={CY} r={g_radius} stroke="#c2410c" strokeOpacity="0.4" />;
              })}
              {/* Unity conductance circle */}
              <circle cx={CX - R_chart / 2} cy={CY} r={R_chart / 2} stroke="#ea580c" strokeOpacity="0.7" strokeWidth="1.2" />
            </g>
            {/* Susceptance arcs (B) */}
            <g stroke="#9a3412" strokeOpacity="0.4" strokeWidth="0.75" strokeDasharray="3 3" fill="none">
              {xValues.flatMap((b) => [
                <path key={`b-pos-${b}`} d={getSusceptancePath(b)} />,
                <path key={`b-neg-${b}`} d={getSusceptancePath(-b)} />,
              ])}
            </g>
          </g>
        )}

        {/* ================= GRID LABELS ================= */}
        <g id="grid-labels" fill="#64748b" className="text-[10px] font-mono select-none" pointerEvents="none">
          {/* Resistance labels along Real axis */}
          {rValues.map((r) => {
            const x_pos = CX + ((r - 1) / (r + 1)) * R_chart;
            return (
              <g key={`label-r-${r}`}>
                <text x={x_pos - 4} y={CY - 4} textAnchor="end">
                  {r}
                </text>
              </g>
            );
          })}
          {/* Reactance labels at outer perimeter */}
          {xValues.flatMap((x) => {
            const gammaPos = zToGamma({ re: 0, im: x });
            const pPos = gammaToScreen(gammaPos);
            const gammaNeg = zToGamma({ re: 0, im: -x });
            const pNeg = gammaToScreen(gammaNeg);

            const dxPos = pPos.x - CX;
            const dyPos = pPos.y - CY;
            const lenPos = Math.sqrt(dxPos * dxPos + dyPos * dyPos);
            // Place text slightly outside/inside outer rim
            const txPos = CX + (dxPos / lenPos) * (R_chart + 12);
            const tyPos = CY + (dyPos / lenPos) * (R_chart + 12);

            const dxNeg = pNeg.x - CX;
            const dyNeg = pNeg.y - CY;
            const lenNeg = Math.sqrt(dxNeg * dxNeg + dyNeg * dyNeg);
            const txNeg = CX + (dxNeg / lenNeg) * (R_chart + 12);
            const tyNeg = CY + (dyNeg / lenNeg) * (R_chart + 12);

            return [
              <text key={`lbl-x-pos-${x}`} x={txPos} y={tyPos + 3} textAnchor="middle" fill="#f43f5e" className="font-bold">
                +{x}
              </text>,
              <text key={`lbl-x-neg-${x}`} x={txNeg} y={tyNeg + 3} textAnchor="middle" fill="#06b6d4" className="font-bold">
                -{x}
              </text>,
            ];
          })}
          {/* Special boundaries */}
          <text x={CX - R_chart - 8} y={CY + 14} textAnchor="start" fill="#10b981" className="font-bold">SHORT</text>
          <text x={CX + R_chart + 8} y={CY + 14} textAnchor="end" fill="#0ea5e9" className="font-bold">OPEN</text>
          <text x={CX} y={CY - 10} textAnchor="middle" fill="#10b981" className="font-bold">1.0 (MATCH)</text>
        </g>

        {/* SWR (VSWR) Circle Overlay */}
        {vswrCircleVal && vswrCircleVal > 1.0 && (
          <circle
            cx={CX}
            cy={CY}
            r={((vswrCircleVal - 1) / (vswrCircleVal + 1)) * R_chart}
            fill="none"
            stroke="var(--color-violet-500)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* ================= MATCHING PATH TRAJECTORY ================= */}
        {renderMatchingPaths()}

        {/* ================= LOAD AND STAGE MARKERS ================= */}
        {matchingStates.map((state, idx) => {
          const pt = gammaToScreen(state.gamma);
          const isLoad = idx === 0;
          const isMatch = idx === matchingStates.length - 1;

          let markerColor = 'fill-cyan-400 stroke-cyan-200';
          let markerSize = 6;
          if (isLoad) {
            markerColor = 'fill-rose-500 stroke-white';
            markerSize = 8;
          } else if (isMatch) {
            markerColor = 'fill-emerald-500 stroke-white';
            markerSize = 8;
          }

          return (
            <g key={`marker-${idx}`} className="group/marker">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={markerSize}
                className={`${markerColor} stroke-2 cursor-pointer shadow-lg`}
              />
              {/* Pulsing ring for current endpoint */}
              {isMatch && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={markerSize + 4}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
              )}
              {/* Mini Label */}
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                fill="#f8fafc"
                className="text-[9px] font-bold bg-slate-950 px-1 py-0.5 rounded opacity-0 group-hover/marker:opacity-100 transition-opacity duration-200 font-mono pointer-events-none"
              >
                {state.label}
              </text>
            </g>
          );
        })}

        {/* Dynamic Hover Cursor crosshairs */}
        {hoverData && (
          <g pointerEvents="none">
            {/* Concentric helper circle from center to hover */}
            <circle
              cx={CX}
              cy={CY}
              r={magnitude(hoverData.gamma) * R_chart}
              fill="none"
              stroke="#e2e8f0"
              strokeOpacity="0.15"
              strokeWidth="1"
            />
            {/* Radial line from center */}
            <line
              x1={CX}
              y1={CY}
              x2={hoverData.screenX}
              y2={hoverData.screenY}
              stroke="#64748b"
              strokeOpacity="0.4"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            {/* Hover Dot */}
            <circle cx={hoverData.screenX} cy={hoverData.screenY} r="5" fill="#f43f5e" />
          </g>
        )}
      </svg>

      {/* Live Tooltip Overlay */}
      {hoverData && (
        <div 
          className="absolute z-10 bg-slate-950/95 border border-slate-800 text-slate-100 p-3 rounded-lg shadow-xl font-mono text-[11px] w-[210px] pointer-events-none transition-all duration-75"
          style={{
            left: `${Math.min(hoverData.screenX + 15, dimensions.width - 230)}px`,
            top: `${Math.min(hoverData.screenY + 15, dimensions.height - 180)}px`,
          }}
        >
          <div className="text-rose-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
            <span>Smith Chart Probe</span>
            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">Active</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Norm. Z:</span>
              <span className="font-bold">{hoverData.z.re.toFixed(2)} + j{hoverData.z.im.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Z:</span>
              <span className="font-bold text-teal-300">{(hoverData.z.re * z0).toFixed(1)} + j{(hoverData.z.im * z0).toFixed(1)} Ω</span>
            </div>
            <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-1">
              <span className="text-slate-400">Norm. Y:</span>
              <span className="font-bold">{hoverData.y.re.toFixed(2)} + j{hoverData.y.im.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Actual Y:</span>
              <span className="font-bold text-amber-400">{(hoverData.y.re * (1000/z0)).toFixed(1)} + j{(hoverData.y.im * (1000/z0)).toFixed(1)} mS</span>
            </div>
            <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-1">
              <span className="text-slate-400">Gamma (Γ):</span>
              <span className="font-bold">
                {magnitude(hoverData.gamma).toFixed(3)} ∠ {((Math.atan2(hoverData.gamma.im, hoverData.gamma.re) * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-1">
              <span className="text-slate-400">SWR:</span>
              <span className="font-bold text-violet-400">{hoverData.swr >= 50 ? '>50' : hoverData.swr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Return Loss:</span>
              <span className="font-bold text-emerald-400">{hoverData.rl.toFixed(1)} dB</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Instructions */}
      <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 border border-slate-800/50 rounded p-1.5 text-center text-[10px] text-slate-400 font-sans pointer-events-none">
        💡 <strong className="text-slate-200">Click anywhere</strong> on the grid to change the load impedance ($Z_L$)!
      </div>
    </div>
  );
}
