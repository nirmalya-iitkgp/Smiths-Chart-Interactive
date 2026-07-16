import { 
  complex, 
  zToGamma, 
  gammaToZ, 
  zToY, 
  yToZ, 
  calculateSWR, 
  calculateReturnLoss,
  magnitude,
  applyComponent,
  getNormalizedValue
} from '../utils/mathUtils';
import { TestResult } from '../types';

export const runMathTests = (): TestResult[] => {
  const results: TestResult[] = [];

  // Test 1: Matched load
  {
    const z = complex(1, 0);
    const gamma = zToGamma(z);
    const passed = Math.abs(gamma.re) < 1e-6 && Math.abs(gamma.im) < 1e-6;
    results.push({
      name: 'zToGamma: Matched Load (z = 1 => gamma = 0)',
      passed,
      expected: '0 + j0',
      actual: `${gamma.re.toFixed(4)} + j${gamma.im.toFixed(4)}`,
    });
  }

  // Test 2: Short circuit
  {
    const z = complex(0, 0);
    const gamma = zToGamma(z);
    const passed = Math.abs(gamma.re + 1) < 1e-6 && Math.abs(gamma.im) < 1e-6;
    results.push({
      name: 'zToGamma: Short Circuit (z = 0 => gamma = -1)',
      passed,
      expected: '-1.0000 + j0.0000',
      actual: `${gamma.re.toFixed(4)} + j${gamma.im.toFixed(4)}`,
    });
  }

  // Test 3: Gamma to Z (Matched load inverse)
  {
    const gamma = complex(0, 0);
    const z = gammaToZ(gamma);
    const passed = Math.abs(z.re - 1) < 1e-6 && Math.abs(z.im) < 1e-6;
    results.push({
      name: 'gammaToZ: Center of chart (gamma = 0 => z = 1)',
      passed,
      expected: '1.0000 + j0.0000',
      actual: `${z.re.toFixed(4)} + j${z.im.toFixed(4)}`,
    });
  }

  // Test 4: Gamma to Z (Short circuit inverse)
  {
    const gamma = complex(-1, 0);
    const z = gammaToZ(gamma);
    const passed = Math.abs(z.re) < 1e-6 && Math.abs(z.im) < 1e-6;
    results.push({
      name: 'gammaToZ: Left outer edge (gamma = -1 => z = 0)',
      passed,
      expected: '0.0000 + j0.0000',
      actual: `${z.re.toFixed(4)} + j${z.im.toFixed(4)}`,
    });
  }

  // Test 5: Admittance conversion
  {
    const z = complex(2, -1); // 2 - j1
    const y = zToY(z); // 1 / (2-j1) = (2+j1)/5 = 0.4 + j0.2
    const passed = Math.abs(y.re - 0.4) < 1e-6 && Math.abs(y.im - 0.2) < 1e-6;
    results.push({
      name: 'zToY: 2 - j1 => 0.4 + j0.2',
      passed,
      expected: '0.4000 + j0.2000',
      actual: `${y.re.toFixed(4)} + j${y.im.toFixed(4)}`,
    });
  }

  // Test 6: VSWR Calculation
  {
    const gamma = complex(0.5, 0); // Reflection coeff magnitude = 0.5
    const swr = calculateSWR(gamma); // (1 + 0.5) / (1 - 0.5) = 3.0
    const passed = Math.abs(swr - 3) < 1e-6;
    results.push({
      name: 'calculateSWR: gamma = 0.5 => swr = 3.0',
      passed,
      expected: '3.0000',
      actual: swr.toFixed(4),
    });
  }

  // Test 7: Return Loss Calculation
  {
    const gamma = complex(0.1, 0); // Magnitude = 0.1
    const rl = calculateReturnLoss(gamma); // -20 * log10(0.1) = 20 dB
    const passed = Math.abs(rl - 20) < 1e-6;
    results.push({
      name: 'calculateReturnLoss: gamma = 0.1 => rl = 20 dB',
      passed,
      expected: '20.0000',
      actual: rl.toFixed(4),
    });
  }

  // Test 8: Series Component Adding
  {
    const zStart = complex(1, 1);
    // Add series L of 10 nH at 1 GHz, Z0 = 50 ohms
    // w = 2*pi*1e9 => X_L = 2*pi*10 = 62.83 => normalized = 1.2566
    const zEnd = applyComponent(zStart, 'series_l', 10, 1.0e9, 50);
    const expectedIm = 1 + (2 * Math.PI * 1e9 * 10e-9) / 50;
    const passed = Math.abs(zEnd.re - 1.0) < 1e-6 && Math.abs(zEnd.im - expectedIm) < 1e-6;
    results.push({
      name: 'applyComponent: Series L 10nH at 1GHz',
      passed,
      expected: `1.0000 + j${expectedIm.toFixed(4)}`,
      actual: `${zEnd.re.toFixed(4)} + j${zEnd.im.toFixed(4)}`,
    });
  }

  // Test 9: Series Resistor Adding
  {
    const zStart = complex(1.2, 0.8);
    // Add series resistor of 40 Ohms, Z0 = 50 Ohms => normVal = 0.8
    const zEnd = applyComponent(zStart, 'series_r', 40, 1.0e9, 50);
    const passed = Math.abs(zEnd.re - 2.0) < 1e-6 && Math.abs(zEnd.im - 0.8) < 1e-6;
    results.push({
      name: 'applyComponent: Series R 40Ω (Z0=50)',
      passed,
      expected: '2.0000 + j0.8000',
      actual: `${zEnd.re.toFixed(4)} + j${zEnd.im.toFixed(4)}`,
    });
  }

  // Test 10: Shunt Resistor Adding
  {
    const zStart = complex(1.0, 0.0); // yStart = 1.0 + j0.0
    // Add shunt resistor of 50 Ohms, Z0 = 50 Ohms => conductance G_norm = 1.0
    // yEnd = 1.0 + 1.0 + j0.0 = 2.0 => zEnd = 0.5 + j0.0
    const zEnd = applyComponent(zStart, 'shunt_r', 50, 1.0e9, 50);
    const passed = Math.abs(zEnd.re - 0.5) < 1e-6 && Math.abs(zEnd.im) < 1e-6;
    results.push({
      name: 'applyComponent: Shunt R 50Ω (Z0=50)',
      passed,
      expected: '0.5000 + j0.0000',
      actual: `${zEnd.re.toFixed(4)} + j${zEnd.im.toFixed(4)}`,
    });
  }

  return results;
};

// If run directly via tsx/node (CLI only)
if (typeof window === 'undefined' && (typeof require !== 'undefined' && require.main === module || (import.meta && import.meta.url && import.meta.url.endsWith('math.test.ts')))) {
  console.log('🧪 Running Smith Chart Math Unit Tests...');
  const tests = runMathTests();
  let failed = 0;
  tests.forEach((t) => {
    if (t.passed) {
      console.log(` ✅ PASS: ${t.name}`);
    } else {
      console.log(` ❌ FAIL: ${t.name}`);
      console.log(`    Expected: ${t.expected}`);
      console.log(`    Actual:   ${t.actual}`);
      failed++;
    }
  });
  console.log(`\n📊 Summary: ${tests.length - failed}/${tests.length} tests passed.`);
  if (failed > 0) {
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit(1);
    }
  } else {
    console.log('🎉 All math tests passed successfully!');
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
      process.exit(0);
    }
  }
}
