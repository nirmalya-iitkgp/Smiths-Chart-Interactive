import React, { useState, useEffect } from 'react';
import { Complex, MatchComponent, MatchingState, SavedPoint } from './types';
import { calculateMatchingPath, complex, zToGamma } from './utils/mathUtils';
import SmithChartVisualizer from './components/SmithChartVisualizer';
import MatchingNetworkBuilder from './components/MatchingNetworkBuilder';
import TransmissionLineSim from './components/TransmissionLineSim';
import EducationalPanel from './components/EducationalPanel';
import UnitTestsPanel from './components/UnitTestsPanel';
import SavedPointsPool from './components/SavedPointsPool';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, Compass, BookOpen, Award, Layers, Zap, Radio, CheckCircle, HelpCircle } from 'lucide-react';

export default function App() {
  // Application State
  const [zLoad, setZLoad] = useState<Complex>({ re: 0.5, im: -1.0 }); // Normalized z = 0.5 - j1.0 (mismatched)
  const [components, setComponents] = useState<MatchComponent[]>([]);
  const [freq, setFreq] = useState<number>(1.0e9); // 1.0 GHz
  const [z0, setZ0] = useState<number>(50); // 50 Ohms
  const [showAdmittanceGrid, setShowAdmittanceGrid] = useState<boolean>(false);
  const [highlightRegion, setHighlightRegion] = useState<
    'short' | 'open' | 'unity_r' | 'unity_g' | 'inductive' | 'capacitive' | 'center' | 'all'
  >('all');
  const [activeTab, setActiveTab] = useState<'match' | 'tline' | 'academy' | 'tests'>('academy');
  const [vswrCircleVal, setVswrCircleVal] = useState<number | null>(null);

  // Exercise pool of saved impedance points
  const [savedPoints, setSavedPoints] = useState<SavedPoint[]>(() => {
    try {
      const stored = localStorage.getItem('smith_chart_saved_points');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Sync saved points with local storage
  useEffect(() => {
    localStorage.setItem('smith_chart_saved_points', JSON.stringify(savedPoints));
  }, [savedPoints]);

  const handleSavePoint = (name: string, z: Complex) => {
    const newPoint: SavedPoint = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      z,
      z0,
      timestamp: new Date().toISOString(),
    };
    setSavedPoints((prev) => [newPoint, ...prev]);
  };

  const handleDeletePoint = (id: string) => {
    setSavedPoints((prev) => prev.filter((p) => p.id !== id));
  };

  // Derive actual Z load values in ohms
  const rLoadActual = Number((zLoad.re * z0).toFixed(1));
  const xLoadActual = Number((zLoad.im * z0).toFixed(1));

  // Bi-directional binding handlers for sliders
  const handleRLoadChange = (val: number) => {
    setZLoad({ re: Math.max(0.01, val / z0), im: zLoad.im });
  };

  const handleXLoadChange = (val: number) => {
    setZLoad({ re: zLoad.re, im: val / z0 });
  };

  // Compute full matching path coordinates for the visualizer
  const matchingStates = calculateMatchingPath(zLoad, components, freq, z0);

  // Auto-sync VSWR circle if enabled
  useEffect(() => {
    if (vswrCircleVal !== null) {
      // Recalculate SWR
      const gamma = zToGamma(zLoad);
      const mag = Math.sqrt(gamma.re * gamma.re + gamma.im * gamma.im);
      if (mag >= 0.999) {
        setVswrCircleVal(99.9);
      } else {
        setVswrCircleVal((1 + mag) / (1 - mag));
      }
    }
  }, [zLoad, z0]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/35">
      {/* Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-indigo-500/20 shadow-md border border-slate-800 flex-shrink-0">
              <img
                src="/src/assets/images/icon_1784229226494.jpg"
                alt="Smith Chart Icon"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-100 font-sans">
                  Smith Chart <span className="text-indigo-400 font-medium">Interactive Lab</span>
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  v1.2.0 (Verified)
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl mt-0.5">
                Full-fidelity transmission line simulator and impedance matching workbook. Built with exact Möbius transformation math.
              </p>
            </div>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-850">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-slate-400">f =</span>
              <span className="text-slate-200 font-bold">{(freq / 1e9).toFixed(2)} GHz</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-slate-400">Z₀ =</span>
              <span className="text-slate-200 font-bold">{z0} Ω</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Visualizer + Environmental Controls (Col Span: 5 or 6) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          {/* Smith Chart Visualizer Card */}
          <div className="flex flex-col">
            <SmithChartVisualizer
              zLoad={zLoad}
              onSelectImpedance={setZLoad}
              matchingStates={matchingStates}
              components={components}
              highlightRegion={highlightRegion}
              showAdmittanceGrid={showAdmittanceGrid}
              freq={freq}
              z0={z0}
              vswrCircleVal={vswrCircleVal}
            />
          </div>

          {/* Environmental and Load Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-4.5 h-4.5 text-indigo-400" />
                Impedance & Environment Controls
              </h3>
              <p className="text-xs text-slate-400">Tweak the generator environment and load parameters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Load resistance slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Resistance (R_L):</span>
                  <span className="font-mono font-black text-rose-400 bg-slate-950 px-2 py-0.5 rounded">
                    {rLoadActual} Ω
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="300"
                  step="0.5"
                  value={rLoadActual}
                  onChange={(e) => handleRLoadChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>0.1 Ω (Short)</span>
                  <span>150 Ω</span>
                  <span>300 Ω</span>
                </div>
              </div>

              {/* Load reactance slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Reactance (X_L):</span>
                  <span className="font-mono font-black text-cyan-400 bg-slate-950 px-2 py-0.5 rounded">
                    {xLoadActual >= 0 ? '+' : ''}
                    {xLoadActual} Ω
                  </span>
                </div>
                <input
                  type="range"
                  min="-250"
                  max="250"
                  step="0.5"
                  value={xLoadActual}
                  onChange={(e) => handleXLoadChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>-250 Ω (Cap)</span>
                  <span>0 Ω (Resistive)</span>
                  <span>+250 Ω (Ind)</span>
                </div>
              </div>
            </div>

            {/* Environmental Advanced Parameters */}
            <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Characteristic Impedance */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Char. Impedance (Z₀)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="1"
                    value={z0}
                    onChange={(e) => setZ0(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-300"
                  />
                  <span className="text-xs font-mono font-bold w-10 text-right text-slate-200">{z0}Ω</span>
                </div>
              </div>

              {/* Operating Frequency */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Frequency (f)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={freq / 1e9}
                    onChange={(e) => setFreq(parseFloat(e.target.value) * 1e9)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-300"
                  />
                  <span className="text-xs font-mono font-bold w-12 text-right text-slate-200">
                    {(freq / 1e9).toFixed(1)}G
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-start md:justify-end gap-2 pt-2 md:pt-0">
                <button
                  onClick={() => setShowAdmittanceGrid(!showAdmittanceGrid)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer ${
                    showAdmittanceGrid
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-250 hover:border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Y-Grid Overlay
                </button>
              </div>
            </div>
          </div>

          {/* Saved Impedance Points Exercise Pool */}
          <SavedPointsPool
            activeZ={zLoad}
            z0={z0}
            savedPoints={savedPoints}
            onSavePoint={handleSavePoint}
            onSelectPoint={setZLoad}
            onDeletePoint={handleDeletePoint}
          />
        </div>

        {/* RIGHT COLUMN: Tabbed Workspace Modules (Col Span: 7 or 6) */}
        <div className="lg:col-span-6 flex flex-col gap-6 h-full">
          
          {/* Workspace Tab Header */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('academy');
                setHighlightRegion('all');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'academy'
                  ? 'bg-emerald-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Chart Academy
            </button>
            <button
              onClick={() => {
                setActiveTab('match');
                setHighlightRegion('all');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'match'
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              L-Match Builder
            </button>
            <button
              onClick={() => {
                setActiveTab('tline');
                setHighlightRegion('all');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tline'
                  ? 'bg-violet-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              Line Simulator
            </button>
            <button
              onClick={() => {
                setActiveTab('tests');
                setHighlightRegion('all');
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'tests'
                  ? 'bg-slate-800 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Integrity Tests
            </button>
          </div>

          {/* Animated Tab Content Frame */}
          <div className="flex-1 min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'academy' && (
                  <EducationalPanel
                    onSetHighlight={setHighlightRegion}
                    onSetLoadImpedance={setZLoad}
                    onSetComponents={setComponents}
                    currentHighlight={highlightRegion}
                  />
                )}
                {activeTab === 'match' && (
                  <MatchingNetworkBuilder
                    zLoad={zLoad}
                    components={components}
                    onUpdateComponents={setComponents}
                    freq={freq}
                    z0={z0}
                  />
                )}
                {activeTab === 'tline' && (
                  <TransmissionLineSim
                    zLoad={zLoad}
                    z0={z0}
                    freq={freq}
                    onSetVswrCircle={setVswrCircleVal}
                    vswrCircleVal={vswrCircleVal}
                  />
                )}
                {activeTab === 'tests' && <UnitTestsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-5 px-6 text-center text-xs text-slate-500 font-mono mt-12">
        <p>
          Smith Chart Interactive Laboratory &copy; 2026 • Under strict offline client-side mathematics design laws.
        </p>
      </footer>
    </div>
  );
}
