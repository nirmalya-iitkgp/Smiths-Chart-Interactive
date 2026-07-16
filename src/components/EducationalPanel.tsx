import React, { useState } from 'react';
import { TutorialStep, Complex, MatchComponent } from '../types';
import { BookOpen, ChevronLeft, ChevronRight, HelpCircle, Trophy, Sparkles } from 'lucide-react';

interface EducationalPanelProps {
  onSetHighlight: (region: TutorialStep['highlightRegion']) => void;
  onSetLoadImpedance: (z: Complex) => void;
  onSetComponents: (comps: MatchComponent[]) => void;
  currentHighlight: string;
}

export default function EducationalPanel({
  onSetHighlight,
  onSetLoadImpedance,
  onSetComponents,
  currentHighlight,
}: EducationalPanelProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [challengeSolved, setChallengeSolved] = useState(false);

  // Define interactive educational steps
  const tutorialSteps: TutorialStep[] = [
    {
      id: 'intro',
      title: '🌟 Welcome to the Smith Chart!',
      content: `The Smith Chart is an elegant mathematical tool used by RF engineers to design antennas, transmission lines, and high-frequency amplifiers. At its heart, it maps all possible impedances (z = r + jx) inside a simple unit circle representing the complex reflection coefficient (Γ). This app contains a 100% client-side mathematical engine with ZERO AI runtime calls.`,
      highlightRegion: 'all',
    },
    {
      id: 'short_circuit',
      title: '🔌 The Short Circuit Point',
      content: `Let's find the Short Circuit point! When a load is shorted, its impedance is Z = 0 + j0 Ω. Mathematically, its reflection coefficient is Γ = -1. This corresponds to the FAR LEFT edge of the chart. Try clicking on the left-most edge of the horizontal real axis to see the impedance read 0 + j0 in the hover probe.`,
      highlightRegion: 'short',
      setup: {
        z_load: { re: 0, im: 0 },
        components: [],
      },
    },
    {
      id: 'open_circuit',
      title: '📡 The Open Circuit Point',
      content: `On the opposite side lies the Open Circuit point! When a load is open, its impedance is Z = ∞ Ω. This corresponds to Γ = 1, which sits at the FAR RIGHT edge of the chart. No current flows, and all power is reflected back.`,
      highlightRegion: 'open',
      setup: {
        z_load: { re: 100, im: 0 }, // large value
        components: [],
      },
    },
    {
      id: 'center_match',
      title: '🎯 Center of the Chart (Perfect Match)',
      content: `The very center of the chart represents Z = 50 Ω (normalized z = 1 + j0). At this point, the reflection coefficient Γ = 0, meaning all high-frequency power is absorbed by the load, and there are ZERO reflections. The ultimate goal of impedance matching is to transform any arbitrary load impedance to land exactly at this center point!`,
      highlightRegion: 'center',
      setup: {
        z_load: { re: 1.0, im: 0.0 },
        components: [],
      },
    },
    {
      id: 'regions',
      title: '⚡ Inductive vs. Capacitive Regions',
      content: `The Smith Chart is divided by the horizontal line across the center (where reactance x = 0). The UPPER HALF represents INDUCTIVE reactances (+j), where inductors dominate. The LOWER HALF represents CAPACITIVE reactances (-j), where capacitors dominate. This divides the impedance world!`,
      highlightRegion: 'inductive',
    },
    {
      id: 'unity_r',
      title: '⭕ Unity Circles & Impedance Matching',
      content: `To match a load, we must cross the "Unity Circle" (r = 1). Adding shunt or series inductors and capacitors moves the load impedance along constant-resistance circles or constant-conductance circles. The goal is to traverse these circles until we intersect r = 1, then travel along the r = 1 circle until we reach the center (1 + j0).`,
      highlightRegion: 'unity_r',
      setup: {
        z_load: { re: 0.3, im: -0.6 },
        components: [],
      },
    },
    {
      id: 'challenge',
      title: '🏆 Challenge: Match this Load!',
      content: `We have set the load to a mismatched antenna impedance: Z = 15 - j35 Ω (normalized z = 0.3 - j0.7). Your mission is to find a matching network that lands exactly at the center (1 + j0). 
      
      💡 Hint: You can solve this in 2 steps. Or click the "Smart L-Match Solver" below to see how our custom analytic math automatically generates the exact solution!`,
      highlightRegion: 'all',
      setup: {
        z_load: { re: 0.3, im: -0.7 },
        components: [],
      },
    },
  ];

  const currentStep = tutorialSteps[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < tutorialSteps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      applyStepSetup(tutorialSteps[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      applyStepSetup(tutorialSteps[prevIdx]);
    }
  };

  const applyStepSetup = (step: TutorialStep) => {
    if (step.highlightRegion) {
      onSetHighlight(step.highlightRegion);
    }
    if (step.setup) {
      onSetLoadImpedance(step.setup.z_load);
      onSetComponents(step.setup.components);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-slate-100">Interactive Smith Chart Academy</h3>
            <p className="text-xs text-slate-400">Step-by-step masterclass with interactive simulations</p>
          </div>
        </div>

        {/* Step Card */}
        <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-xl space-y-3.5 min-h-[180px]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Step {currentStepIdx + 1} of {tutorialSteps.length}
            </span>
            {currentStep.id === 'challenge' && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                <Trophy className="w-3 h-3" /> Special Challenge
              </span>
            )}
          </div>

          <h4 className="text-sm font-extrabold text-slate-100">{currentStep.title}</h4>
          <p className="text-xs leading-relaxed text-slate-350">{currentStep.content}</p>

          {currentStep.id === 'challenge' && (
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
              <span className="text-xs text-slate-400">Target Impedance:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">50 + j0 Ω (Match!)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4 gap-3">
        <button
          onClick={handlePrev}
          disabled={currentStepIdx === 0}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="flex gap-1.5">
          {tutorialSteps.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStepIdx ? 'bg-emerald-400 w-4' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepIdx === tutorialSteps.length - 1}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
