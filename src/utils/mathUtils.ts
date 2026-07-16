import { Complex, MatchComponent, MatchingState, ComponentType } from '../types';

export const Z0_DEFAULT = 50; // Ohms
export const FREQ_DEFAULT = 1.0e9; // 1 GHz

// Helper to create complex number
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

// Complex arithmetic
export function add(c1: Complex, c2: Complex): Complex {
  return { re: c1.re + c2.re, im: c1.im + c2.im };
}

export function sub(c1: Complex, c2: Complex): Complex {
  return { re: c1.re - c2.re, im: c1.im - c2.im };
}

export function mul(c1: Complex, c2: Complex): Complex {
  return {
    re: c1.re * c2.re - c1.im * c2.im,
    im: c1.re * c2.im + c1.im * c2.re,
  };
}

export function div(c1: Complex, c2: Complex): Complex {
  const denom = c2.re * c2.re + c2.im * c2.im;
  if (denom < 1e-12) {
    return { re: 1e9, im: 0 }; // Handle division by zero
  }
  return {
    re: (c1.re * c2.re + c1.im * c2.im) / denom,
    im: (c1.im * c2.re - c1.re * c2.im) / denom,
  };
}

export function conj(c: Complex): Complex {
  return { re: c.re, im: -c.im };
}

export function magnitude(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}

// 1. Convert Normalized Impedance (z) to Reflection Coefficient (Gamma)
// Gamma = (z - 1) / (z + 1)
export function zToGamma(z: Complex): Complex {
  const num = sub(z, complex(1, 0));
  const den = add(z, complex(1, 0));
  return div(num, den);
}

// 2. Convert Reflection Coefficient (Gamma) to Normalized Impedance (z)
// z = (1 + Gamma) / (1 - Gamma)
export function gammaToZ(gamma: Complex): Complex {
  const num = add(complex(1, 0), gamma);
  const den = sub(complex(1, 0), gamma);
  return div(num, den);
}

// 3. Convert Impedance (z) to Admittance (y)
// y = 1 / z
export function zToY(z: Complex): Complex {
  return div(complex(1, 0), z);
}

// 4. Convert Admittance (y) to Impedance (z)
// z = 1 / y
export function yToZ(y: Complex): Complex {
  return div(complex(1, 0), y);
}

// Calculate normalized component value
export function getNormalizedValue(
  type: ComponentType,
  value: number, // in nH for L, pF for C, Ohms for R
  freq: number = FREQ_DEFAULT,
  z0: number = Z0_DEFAULT
): number {
  const omega = 2 * Math.PI * freq;
  if (value <= 0) return 0;

  switch (type) {
    case 'series_l': {
      const x = omega * (value * 1e-9); // L in nH
      return x / z0; // Normalized reactance
    }
    case 'series_c': {
      const x = -1 / (omega * (value * 1e-12)); // C in pF
      return x / z0; // Normalized reactance
    }
    case 'series_r': {
      return value / z0; // Normalized resistance
    }
    case 'shunt_l': {
      const b = -1 / (omega * (value * 1e-9)); // L in nH
      return b * z0; // Normalized susceptance
    }
    case 'shunt_c': {
      const b = omega * (value * 1e-12); // C in pF
      return b * z0; // Normalized susceptance
    }
    case 'shunt_r': {
      // Conductance is 1/R. Normalized conductance is Y_R * Z0 = (1/R) * Z0 = Z0 / R.
      return z0 / value; // Normalized conductance
    }
    default:
      return 0;
  }
}

// Applies a matching component's addition and returns the final impedance
export function applyComponent(
  zStart: Complex,
  type: ComponentType,
  val: number, // actual value (nH / pF / Ohms)
  freq: number = FREQ_DEFAULT,
  z0: number = Z0_DEFAULT
): Complex {
  const normVal = getNormalizedValue(type, val, freq, z0);

  if (type === 'series_l' || type === 'series_c') {
    // Adding series reactance: z_new = z_start + j * x
    return { re: zStart.re, im: zStart.im + normVal };
  } else if (type === 'series_r') {
    // Adding series resistance: z_new = z_start + r
    return { re: zStart.re + normVal, im: zStart.im };
  } else if (type === 'shunt_l' || type === 'shunt_c') {
    // Adding shunt susceptance: y_new = y_start + j * b
    const yStart = zToY(zStart);
    const yNew = { re: yStart.re, im: yStart.im + normVal };
    return yToZ(yNew);
  } else if (type === 'shunt_r') {
    // Adding shunt conductance: y_new = y_start + g
    const yStart = zToY(zStart);
    const yNew = { re: yStart.re + normVal, im: yStart.im };
    return yToZ(yNew);
  } else {
    return zStart;
  }
}

// Generates an array of intermediate points (trajectories) for smooth drawing
export function generateTrajectory(
  zStart: Complex,
  type: ComponentType,
  val: number,
  steps: number = 30,
  freq: number = FREQ_DEFAULT,
  z0: number = Z0_DEFAULT
): Complex[] {
  const points: Complex[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const partialVal = val * t;
    points.push(applyComponent(zStart, type, partialVal, freq, z0));
  }
  return points;
}

// Rotates reflection coefficient along a transmission line by length in wavelengths
// Moving towards generator (clockwise rotation)
export function rotateOnLine(gamma: Complex, dWavelengths: number): Complex {
  // Angle of rotation in radians: -2 * beta * d = -2 * (2 * pi / lambda) * (d_lambda * lambda) = -4 * pi * d_lambda
  const angle = -4 * Math.PI * dWavelengths;
  const rot = {
    re: Math.cos(angle),
    im: Math.sin(angle),
  };
  return mul(gamma, rot);
}

// Calculate Standing Wave Ratio (SWR) from Gamma
export function calculateSWR(gamma: Complex): number {
  const mag = magnitude(gamma);
  if (mag >= 0.999) return 99.9; // Avoid division by zero
  return (1 + mag) / (1 - mag);
}

// Calculate Return Loss (dB)
export function calculateReturnLoss(gamma: Complex): number {
  const mag = magnitude(gamma);
  if (mag <= 1e-5) return 99.9; // Perfect match
  return -20 * Math.log10(mag);
}

// Generate the list of matching states from a load and matching component list
export function calculateMatchingPath(
  zLoad: Complex,
  components: MatchComponent[],
  freq: number = FREQ_DEFAULT,
  z0: number = Z0_DEFAULT
): MatchingState[] {
  const states: MatchingState[] = [];

  // Start (Load) state
  let currentZ = zLoad;
  let currentY = zToY(currentZ);
  let currentGamma = zToGamma(currentZ);

  states.push({
    label: 'Load',
    z: currentZ,
    y: currentY,
    gamma: currentGamma,
  });

  for (const comp of components) {
    currentZ = applyComponent(currentZ, comp.type, comp.value, freq, z0);
    currentY = zToY(currentZ);
    currentGamma = zToGamma(currentZ);

    const prettyNames: Record<string, string> = {
      series_l: `Series L (${comp.value} nH)`,
      series_c: `Series C (${comp.value} pF)`,
      shunt_l: `Shunt L (${comp.value} nH)`,
      shunt_c: `Shunt C (${comp.value} pF)`,
    };

    states.push({
      label: prettyNames[comp.type] || 'Match Stage',
      z: currentZ,
      y: currentY,
      gamma: currentGamma,
      componentId: comp.id,
    });
  }

  return states;
}

// Analytic calculation for single L-match (Series-Shunt or Shunt-Series options)
// to match Z_load to 50 ohms. Returns component types and target values.
export function findLMatchSuggestions(
  zLoad: Complex, // in Ohms (actual, not normalized)
  freq: number = FREQ_DEFAULT,
  z0: number = Z0_DEFAULT
): { description: string; steps: { type: 'series_l' | 'series_c' | 'shunt_l' | 'shunt_c'; value: number }[] }[] {
  const r = zLoad.re;
  const x = zLoad.im;
  const solutions: { description: string; steps: { type: 'series_l' | 'series_c' | 'shunt_l' | 'shunt_c'; value: number }[] }[] = [];

  const omega = 2 * Math.PI * freq;

  // Case 1: r > z0 (Use Shunt component first, then Series)
  // Let's implement robust standard double-branch L-matching calculations.
  // We can solve this numerically or algebraically for maximum simplicity and educational value.
  // Algebraically:
  if (r > 0) {
    if (r >= z0) {
      // Shunt-C, Series-L or Shunt-L, Series-C
      // Let's calculate the susceptance B and reactance X
      // B = [ x +/- sqrt(r/z0) * sqrt(r^2 + x^2 - z0*r) ] / (r^2 + x^2)
      const radical = r * (r * r + x * x - z0 * r);
      if (radical >= 0) {
        const root = Math.sqrt(radical);
        const b1 = (x + root / r) / (r * r + x * x);
        const b2 = (x - root / r) / (r * r + x * x);

        // Series Reactance: X = 1/B_shunt + (X_load * Z0) / ... or simply matching standard formulas
        // For each B, the new admittance is Y_new = Y_load + jB. This gives a Z_new = 1/Y_new with real part = z0.
        // Then we add Series Reactance X = -Im(Z_new) to make it real and equal to Z0.
        for (const B of [b1, b2]) {
          const yLoad = div(complex(1, 0), complex(r, x));
          const yNew = complex(yLoad.re, yLoad.im + B);
          const zNew = div(complex(1, 0), yNew);
          const X_series = -zNew.im;

          const steps: { type: 'series_l' | 'series_c' | 'shunt_l' | 'shunt_c'; value: number }[] = [];

          // Shunt component
          if (B > 0) {
            // Shunt Capacitor
            const C_val = B / omega * 1e12; // in pF
            steps.push({ type: 'shunt_c', value: Number(C_val.toFixed(2)) });
          } else if (B < 0) {
            // Shunt Inductor
            const L_val = -1 / (B * omega) * 1e9; // in nH
            steps.push({ type: 'shunt_l', value: Number(L_val.toFixed(2)) });
          }

          // Series component
          if (X_series > 0) {
            // Series Inductor
            const L_val = X_series / omega * 1e9; // in nH
            steps.push({ type: 'series_l', value: Number(L_val.toFixed(2)) });
          } else if (X_series < 0) {
            // Series Capacitor
            const C_val = -1 / (X_series * omega) * 1e12; // in pF
            steps.push({ type: 'series_c', value: Number(C_val.toFixed(2)) });
          }

          if (steps.length === 2 && steps[0].value > 0 && steps[1].value > 0) {
            solutions.push({
              description: `Shunt ${steps[0].type.includes('c') ? 'Capacitor' : 'Inductor'} then Series ${steps[1].type.includes('l') ? 'Inductor' : 'Capacitor'}`,
              steps,
            });
          }
        }
      }
    } else {
      // Case 2: r < z0 (Use Series component first, then Shunt)
      // Series Reactance X, then Shunt Susceptance B
      // X = -x +/- sqrt(r * (z0 - r))
      const radical = r * (z0 - r);
      if (radical >= 0) {
        const root = Math.sqrt(radical);
        const x1 = -x + root;
        const x2 = -x - root;

        for (const X of [x1, x2]) {
          const zNew = complex(r, x + X);
          const yNew = div(complex(1, 0), zNew);
          const B_shunt = -yNew.im; // Susceptance to cancel the imaginary part of Y_new (1/Z0 = 0.02)

          const steps: { type: 'series_l' | 'series_c' | 'shunt_l' | 'shunt_c'; value: number }[] = [];

          // Series component
          if (X > 0) {
            const L_val = X / omega * 1e9;
            steps.push({ type: 'series_l', value: Number(L_val.toFixed(2)) });
          } else if (X < 0) {
            const C_val = -1 / (X * omega) * 1e12;
            steps.push({ type: 'series_c', value: Number(C_val.toFixed(2)) });
          }

          // Shunt component
          if (B_shunt > 0) {
            const C_val = B_shunt / omega * 1e12;
            steps.push({ type: 'shunt_c', value: Number(C_val.toFixed(2)) });
          } else if (B_shunt < 0) {
            const L_val = -1 / (B_shunt * omega) * 1e9;
            steps.push({ type: 'shunt_l', value: Number(L_val.toFixed(2)) });
          }

          if (steps.length === 2 && steps[0].value > 0 && steps[1].value > 0) {
            solutions.push({
              description: `Series ${steps[0].type.includes('l') ? 'Inductor' : 'Capacitor'} then Shunt ${steps[1].type.includes('c') ? 'Capacitor' : 'Inductor'}`,
              steps,
            });
          }
        }
      }
    }
  }

  return solutions;
}
