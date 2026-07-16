import React, { useState } from 'react';
import { Complex, SavedPoint } from '../types';
import { zToGamma, magnitude } from '../utils/mathUtils';
import { Save, Trash2, Crosshair, ChevronRight, Bookmark } from 'lucide-react';

interface SavedPointsPoolProps {
  activeZ: Complex;
  z0: number;
  savedPoints: SavedPoint[];
  onSavePoint: (name: string, z: Complex) => void;
  onSelectPoint: (z: Complex) => void;
  onDeletePoint: (id: string) => void;
}

export default function SavedPointsPool({
  activeZ,
  z0,
  savedPoints,
  onSavePoint,
  onSelectPoint,
  onDeletePoint,
}: SavedPointsPoolProps) {
  const [customName, setCustomName] = useState('');

  // Calculate values for active clicked point
  const gamma = zToGamma(activeZ);
  const gammaMag = magnitude(gamma);
  const gammaAngRad = Math.atan2(gamma.im, gamma.re);
  const gammaAngDeg = (gammaAngRad * 180) / Math.PI;

  const realZ = activeZ.re * z0;
  const imagZ = activeZ.im * z0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customName.trim() || `Point Z = ${realZ.toFixed(0)} ${imagZ >= 0 ? '+' : ''}${imagZ.toFixed(0)}j Ω`;
    onSavePoint(name, activeZ);
    setCustomName('');
  };

  const handleQuickSave = (name: string, z: Complex) => {
    onSavePoint(name, z);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Bookmark className="w-4.5 h-4.5 text-rose-500" />
            Impedance Exercise Pool
          </h3>
          <p className="text-xs text-slate-400">Save clicked Smith Chart points for impedance matching exercises</p>
        </div>
      </div>

      {/* Active Clicked Point Summary card */}
      <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-rose-500" />
            Active Point On Chart
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Real-time calculations</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-850">
            <span className="text-slate-500 block text-[9px] uppercase">Normalized Impedance (z)</span>
            <span className="font-bold text-slate-200">
              {activeZ.re.toFixed(3)} {activeZ.im >= 0 ? '+' : ''} {activeZ.im.toFixed(3)}j
            </span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-850">
            <span className="text-slate-500 block text-[9px] uppercase">Actual Impedance (Z)</span>
            <span className="font-bold text-teal-300">
              {realZ.toFixed(1)} {imagZ >= 0 ? '+' : ''} {imagZ.toFixed(1)}j Ω
            </span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-850 col-span-2">
            <span className="text-slate-500 block text-[9px] uppercase">Reflection Coefficient (Γ)</span>
            <span className="font-bold text-violet-300">
              {gammaMag.toFixed(4)} ∠ {gammaAngDeg.toFixed(1)}° (rect: {gamma.re.toFixed(3)} {gamma.im >= 0 ? '+' : ''} {gamma.im.toFixed(3)}j)
            </span>
          </div>
        </div>

        {/* Save Form */}
        <form onSubmit={handleSave} className="flex gap-2 pt-1.5">
          <input
            type="text"
            placeholder="Label (e.g. My Custom Load)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            maxLength={30}
          />
          <button
            type="submit"
            className="bg-indigo-650 hover:bg-indigo-550 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md border border-indigo-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            Store Point
          </button>
        </form>
      </div>

      {/* Preset Points Pool */}
      {savedPoints.length === 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Quick Preset Exercises</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleQuickSave('High VSWR Cap Load', { re: 0.2, im: -1.5 })}
              className="text-[11px] bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-mono py-1.5 px-2 rounded-lg border border-slate-850 text-left truncate cursor-pointer transition-colors"
            >
              High SWR Cap (10 - 75j Ω)
            </button>
            <button
              onClick={() => handleQuickSave('Highly Inductive Load', { re: 1.5, im: 2.0 })}
              className="text-[11px] bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-mono py-1.5 px-2 rounded-lg border border-slate-850 text-left truncate cursor-pointer transition-colors"
            >
              Inductive (75 + 100j Ω)
            </button>
            <button
              onClick={() => handleQuickSave('Mismatched Resistive', { re: 4.0, im: 0.0 })}
              className="text-[11px] bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-mono py-1.5 px-2 rounded-lg border border-slate-850 text-left truncate cursor-pointer transition-colors"
            >
              Pure Resistive (200 Ω)
            </button>
            <button
              onClick={() => handleQuickSave('Low Resistance Series Cap', { re: 0.1, im: -0.4 })}
              className="text-[11px] bg-slate-950/60 hover:bg-slate-800 text-slate-300 font-mono py-1.5 px-2 rounded-lg border border-slate-850 text-left truncate cursor-pointer transition-colors"
            >
              Low-Z Cap (5 - 20j Ω)
            </button>
          </div>
        </div>
      )}

      {/* Saved Points list */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
          Stored Exercise Pool ({savedPoints.length})
        </span>

        {savedPoints.length === 0 ? (
          <div className="text-center py-5 border border-dashed border-slate-850 rounded-xl bg-slate-950/20 text-slate-500 text-xs">
            No stored points yet. Click anywhere on the Smith Chart and hit "Store Point" to add.
          </div>
        ) : (
          <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {savedPoints.map((point) => {
              const pReal = point.z.re * point.z0;
              const pImag = point.z.im * point.z0;
              const pGamma = zToGamma(point.z);
              const pGammaMag = magnitude(pGamma);

              const isActive = Math.abs(point.z.re - activeZ.re) < 1e-4 && Math.abs(point.z.im - activeZ.im) < 1e-4;

              return (
                <div
                  key={point.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all group ${
                    isActive
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-950/40 border-slate-850 hover:bg-slate-950/70 hover:border-slate-800'
                  }`}
                >
                  <button
                    onClick={() => onSelectPoint(point.z)}
                    className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                    title="Load impedance for matching"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                      <span className={`font-bold truncate block text-[11px] ${isActive ? 'text-rose-300' : 'text-slate-200'}`}>
                        {point.name}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[9px] text-slate-500 pl-5 mt-0.5">
                      <span>Z: {pReal.toFixed(0)}{pImag >= 0 ? '+' : ''}{pImag.toFixed(0)}j Ω</span>
                      <span>•</span>
                      <span>z_norm: {point.z.re.toFixed(2)}{point.z.im >= 0 ? '+' : ''}{point.z.im.toFixed(2)}j</span>
                      <span>•</span>
                      <span>|Γ|: {pGammaMag.toFixed(3)}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onDeletePoint(point.id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Delete from pool"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
