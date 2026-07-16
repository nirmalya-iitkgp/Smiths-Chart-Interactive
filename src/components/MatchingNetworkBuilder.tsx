import React from 'react';
import { Complex, MatchComponent } from '../types';
import { getNormalizedValue, findLMatchSuggestions } from '../utils/mathUtils';
import { Plus, Trash2, Sliders, Sparkles, RefreshCw } from 'lucide-react';

interface MatchingNetworkBuilderProps {
  zLoad: Complex;
  components: MatchComponent[];
  onUpdateComponents: (comps: MatchComponent[]) => void;
  freq: number;
  z0: number;
}

export default function MatchingNetworkBuilder({
  zLoad,
  components,
  onUpdateComponents,
  freq,
  z0,
}: MatchingNetworkBuilderProps) {
  // Add a new empty matching component
  const handleAddComponent = (type: MatchComponent['type']) => {
    let defaultValue = 10.0;
    if (type.endsWith('l')) {
      defaultValue = 10.0; // 10 nH
    } else if (type.endsWith('c')) {
      defaultValue = 5.0; // 5 pF
    } else if (type.endsWith('r')) {
      defaultValue = 50.0; // 50 Ohms
    }
    const normVal = getNormalizedValue(type, defaultValue, freq, z0);

    const newComp: MatchComponent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: defaultValue,
      normalizedVal: normVal,
    };

    onUpdateComponents([...components, newComp]);
  };

  // Remove a matching component
  const handleRemoveComponent = (id: string) => {
    onUpdateComponents(components.filter((c) => c.id !== id));
  };

  // Update a specific component's slider value
  const handleValueChange = (id: string, newVal: number) => {
    const updated = components.map((c) => {
      if (c.id === id) {
        const norm = getNormalizedValue(c.type, newVal, freq, z0);
        return { ...c, value: Number(newVal.toFixed(2)), normalizedVal: norm };
      }
      return c;
    });
    onUpdateComponents(updated);
  };

  // Clear all components
  const handleClearAll = () => {
    onUpdateComponents([]);
  };

  // Calculate actual Z_load in ohms for suggestions
  const zLoadActual = { re: zLoad.re * z0, im: zLoad.im * z0 };
  const suggestions = findLMatchSuggestions(zLoadActual, freq, z0);

  const applySuggestion = (steps: { type: any; value: number }[]) => {
    const newComps: MatchComponent[] = steps.map((step) => {
      const norm = getNormalizedValue(step.type, step.value, freq, z0);
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: step.type,
        value: step.value,
        normalizedVal: norm,
      };
    });
    onUpdateComponents(newComps);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full space-y-5">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Matching Network Builder
          </h3>
          <p className="text-xs text-slate-400">Add series or shunt components to match the load impedance</p>
        </div>
        {components.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Clear All
          </button>
        )}
      </div>

      {/* Component Add Buttons grouped by series and shunt */}
      <div className="space-y-3">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1.5">Add Series Component</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleAddComponent('series_l')}
              className="text-[11px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-indigo-500/30 hover:border-indigo-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-indigo-400">Inductor</span>
              <span className="text-[9px] text-slate-500 font-mono">+jX (nH)</span>
            </button>
            <button
              onClick={() => handleAddComponent('series_c')}
              className="text-[11px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-indigo-500/30 hover:border-indigo-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-indigo-400">Capacitor</span>
              <span className="text-[9px] text-slate-500 font-mono">-jX (pF)</span>
            </button>
            <button
              onClick={() => handleAddComponent('series_r')}
              className="text-[11px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-indigo-500/30 hover:border-indigo-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-indigo-400">Resistor</span>
              <span className="text-[9px] text-slate-500 font-mono">+R (Ω)</span>
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block mb-1.5">Add Shunt Component</span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleAddComponent('shunt_l')}
              className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-amber-500/30 hover:border-amber-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-amber-400">Inductor</span>
              <span className="text-[9px] text-slate-500 font-mono">-jB (nH)</span>
            </button>
            <button
              onClick={() => handleAddComponent('shunt_c')}
              className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-amber-500/30 hover:border-amber-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-amber-400">Capacitor</span>
              <span className="text-[9px] text-slate-500 font-mono">+jB (pF)</span>
            </button>
            <button
              onClick={() => handleAddComponent('shunt_r')}
              className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all border border-amber-500/30 hover:border-amber-500/50 cursor-pointer"
            >
              <span className="font-bold text-[10px] text-amber-400">Resistor</span>
              <span className="text-[9px] text-slate-500 font-mono">+G (Ω)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Matching Network Stack */}
      <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[350px] pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
        {components.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-10 border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
            <Sliders className="w-10 h-10 mb-2 stroke-[1.2] text-slate-600" />
            <p className="text-sm font-semibold">No components in the matching network yet</p>
            <p className="text-xs max-w-[200px] mt-1">Use the buttons above to build your circuit, or apply a suggested L-match below.</p>
          </div>
        ) : (
          components.map((comp, idx) => {
            const isSeries = comp.type.startsWith('series');
            let label = '';
            let unit = 'nH';
            let minVal = 0.1;
            let maxVal = 100.0;
            let valType = '';

            if (comp.type.endsWith('l')) {
              label = isSeries ? 'Series Inductor' : 'Shunt Inductor';
              unit = 'nH';
              minVal = 0.1;
              maxVal = 100.0;
              valType = isSeries ? 'Reactance' : 'Susceptance';
            } else if (comp.type.endsWith('c')) {
              label = isSeries ? 'Series Capacitor' : 'Shunt Capacitor';
              unit = 'pF';
              minVal = 0.1;
              maxVal = 50.0;
              valType = isSeries ? 'Reactance' : 'Susceptance';
            } else if (comp.type.endsWith('r')) {
              label = isSeries ? 'Series Resistor' : 'Shunt Resistor';
              unit = 'Ω';
              minVal = 1.0;
              maxVal = 500.0;
              valType = isSeries ? 'Resistance' : 'Conductance';
            }

            return (
              <div
                key={comp.id}
                className={`p-3.5 rounded-xl border border-slate-850 bg-slate-950/70 relative transition-all group ${
                  isSeries ? 'border-l-4 border-l-indigo-500' : 'border-l-4 border-l-amber-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Stage {idx + 1}</span>
                    <h4 className="text-xs font-bold text-slate-200">{label}</h4>
                  </div>
                  <button
                    onClick={() => handleRemoveComponent(comp.id)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Remove stage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Slider and values */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Value:</span>
                    <span className="font-bold text-slate-100">{comp.value} {unit}</span>
                  </div>
                  <input
                    type="range"
                    min={minVal}
                    max={maxVal}
                    step={comp.type.endsWith('r') ? '1' : '0.1'}
                    value={comp.value}
                    onChange={(e) => handleValueChange(comp.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{minVal} {unit}</span>
                    <span>
                      {valType}: {comp.normalizedVal > 0 ? '+' : ''}
                      {comp.normalizedVal.toFixed(3)}
                    </span>
                    <span>{maxVal} {unit}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* L-Match Suggestions Panel */}
      <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-3.5">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          Smart L-Match Solver (to {z0}Ω)
        </h4>

        {suggestions.length === 0 ? (
          <p className="text-[11px] text-slate-500 font-sans italic">
            No matching suggestions found. (Check if your load is already close to {z0}Ω or if resistance is zero).
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((sol, index) => {
              // Create readable visual steps
              const stepStrings = sol.steps.map((s) => {
                const label = s.type === 'series_l' ? 'Series L' : s.type === 'series_c' ? 'Series C' : s.type === 'shunt_l' ? 'Shunt L' : 'Shunt C';
                const unit = s.type.endsWith('l') ? 'nH' : 'pF';
                return `${label} (${s.value}${unit})`;
              });

              return (
                <div
                  key={index}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors gap-2"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">Solution #{index + 1}</span>
                    <p className="text-[11px] font-semibold text-slate-200">{stepStrings.join(' ➔ ')}</p>
                  </div>
                  <button
                    onClick={() => applySuggestion(sol.steps)}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded shadow transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 self-end md:self-auto"
                  >
                    Apply Match
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
