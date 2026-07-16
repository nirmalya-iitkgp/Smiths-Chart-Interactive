export interface Complex {
  re: number;
  im: number;
}

export type ComponentType = 
  | 'series_l' 
  | 'series_c' 
  | 'series_r' 
  | 'shunt_l' 
  | 'shunt_c' 
  | 'shunt_r';

export interface MatchComponent {
  id: string;
  type: ComponentType;
  value: number; // in nH for L, pF for C, Ohms for R
  normalizedVal: number; // normalized reactance/susceptance/resistance/conductance
}

export interface MatchingState {
  label: string;
  z: Complex; // normalized impedance
  y: Complex; // normalized admittance
  gamma: Complex; // reflection coefficient
  componentId?: string; // which component caused this transition
}

export interface SavedPoint {
  id: string;
  name: string;
  z: Complex; // normalized impedance
  z0: number; // reference impedance at saving
  timestamp: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlightRegion?: 'short' | 'open' | 'unity_r' | 'unity_g' | 'inductive' | 'capacitive' | 'center' | 'all';
  setup?: {
    z_load: Complex;
    components: MatchComponent[];
  };
}

export interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}
