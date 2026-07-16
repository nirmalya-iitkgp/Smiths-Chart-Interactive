import React from 'react';
import { runMathTests } from '../tests/math.test';
import { CheckCircle2, XCircle, ShieldAlert, Award } from 'lucide-react';

export default function UnitTestsPanel() {
  const testResults = runMathTests();
  const allPassed = testResults.every((t) => t.passed);
  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Integrity & Test Suite
          </h3>
          <p className="text-xs text-slate-400">Verifies coordination algorithms against reference values</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
          allPassed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {allPassed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> ALL PASSING ({passedCount}/{testResults.length})
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5" /> ERRORS DETECTED
            </>
          )}
        </div>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
        {testResults.map((res, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg flex items-start gap-3 border ${
              res.passed
                ? 'bg-emerald-950/20 border-emerald-950/50 hover:border-emerald-900/60'
                : 'bg-rose-950/20 border-rose-950/50 hover:border-rose-900/60'
            } transition-colors`}
          >
            {res.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">{res.name}</p>
              <div className="flex gap-4 font-mono text-[9px] text-slate-400">
                <span>Expected: <strong className="text-slate-300">{res.expected}</strong></span>
                <span>Actual: <strong className="text-slate-300">{res.actual}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Run from terminal:</span>
        <code className="text-[10px] bg-slate-900 px-2 py-1 rounded text-teal-400 font-mono border border-slate-800">
          npm run test
        </code>
      </div>
    </div>
  );
}
