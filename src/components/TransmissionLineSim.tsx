import React, { useState } from 'react';
import { Complex } from '../types';
import { 
  zToGamma, 
  rotateOnLine, 
  gammaToZ, 
  magnitude, 
  calculateSWR, 
  calculateReturnLoss 
} from '../utils/mathUtils';
import { Compass, Info, Check } from 'lucide-react';

interface TransmissionLineSimProps {
  zLoad: Complex;
  z0: number;
  freq: number;
  onSetVswrCircle: (val: number | null) => void;
  vswrCircleVal: number | null;
}

export default function TransmissionLineSim({
  zLoad,
  z0,
  freq,
  onSetVswrCircle,
  vswrCircleVal,
}: TransmissionLineSimProps) {
  const [lineLength, setLineLength] = useState<number>(0.0); // Wavelengths

  // Compute load gamma
  const gammaLoad = zToGamma(zLoad);
  const loadMag = magnitude(gammaLoad);

  // Compute rotated gamma (Moving towards Generator)
  const gammaRotated = rotateOnLine(gammaLoad, lineLength);
  const zRotated = gammaToZ(gammaRotated);

  const swr = calculateSWR(gammaLoad);
  const returnLoss = calculateReturnLoss(gammaLoad);

  const handleSWRToggle = () => {
    if (vswrCircleVal === null) {
      onSetVswrCircle(swr);
    } else {
      onSetVswrCircle(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full space-y-4">
      <div>
        <h3 className="font-bold text-slate-100 flex items-center gap-2">
          <Compass className="w-5 h-5 text-violet-400" />
          Transmission Line Simulator
        </h3>
        <p className="text-xs text-slate-400">See how impedance rotates as you move along a transmission line</p>
      </div>

      {/* Slider for Wavelengths */}
      <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">Line Length (d):</span>
          <span className="font-bold text-violet-400 text-sm">
            {lineLength.toFixed(3)} λ ({(lineLength * 360).toFixed(0)}° electrical)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.005"
          value={lineLength}
          onChange={(e) => setLineLength(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0.0 λ (Load)</span>
          <span>0.25 λ (Quarter-wave inversion)</span>
          <span>0.5 λ (Full rotation)</span>
        </div>
      </div>

      {/* SWR Highlight Circle Toggle */}
      <button
        onClick={handleSWRToggle}
        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors border cursor-pointer ${
          vswrCircleVal !== null
            ? 'bg-violet-950/40 border-violet-700/50 text-violet-300'
            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-4 h-4 rounded flex items-center justify-center border ${vswrCircleVal !== null ? 'bg-violet-500 border-violet-400' : 'border-slate-700'}`}>
            {vswrCircleVal !== null && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
          </span>
          Trace SWR (VSWR) Circle on Chart
        </span>
        <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
          SWR = {swr >= 50 ? '>50' : swr.toFixed(2)}
        </span>
      </button>

      {/* Simulator Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 font-mono text-xs">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">Rotated Z_in (Normal)</span>
          <p className="font-bold text-slate-200">
            {zRotated.re.toFixed(3)} {zRotated.im >= 0 ? '+' : ''} j{zRotated.im.toFixed(3)}
          </p>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 font-mono text-xs">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">Rotated Z_in (Actual)</span>
          <p className="font-bold text-violet-300">
            {(zRotated.re * z0).toFixed(1)} {zRotated.im >= 0 ? '+' : ''} j{(zRotated.im * z0).toFixed(1)} Ω
          </p>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 font-mono text-xs">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">SWR</span>
          <p className="font-bold text-slate-200">{swr >= 50 ? 'Infinity (Short/Open)' : swr.toFixed(2)}</p>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/60 font-mono text-xs">
          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1 font-bold">Return Loss (S11)</span>
          <p className="font-bold text-emerald-400">{returnLoss.toFixed(1)} dB</p>
        </div>
      </div>

      {/* Physical Explanation Box */}
      <div className="bg-slate-950/30 border border-slate-850 p-3.5 rounded-xl flex gap-2.5 items-start">
        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300">Quarter-Wave Transformer Inversion</h4>
          <p className="text-[11px] leading-relaxed text-slate-400">
            At exactly <span className="text-violet-400 font-bold">0.250 λ</span>, the input impedance becomes completely inverted: 
            <span className="font-mono text-slate-300 bg-slate-950 px-1 py-0.5 rounded ml-1 font-bold">Z_in = Z0² / Z_load</span>. 
            This is used for quarter-wave impedance matching and turns open circuits into short circuits!
          </p>
        </div>
      </div>
    </div>
  );
}
