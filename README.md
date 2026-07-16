# Smith Chart Interactive Laboratory & Simulator

An interactive, high-fidelity educational application and visualizer for the Smith Chart. Designed for students, educators, and radio frequency (RF) engineers to master high-frequency transmission lines, standing wave ratios (VSWR), and impedance matching networks.

This application runs **entirely client-side** using standard SVG/React layout systems with **ZERO AI or generative API calls at runtime**, ensuring absolute privacy, lightning-fast performance, and robust execution.

---

## 🚀 Application Capabilities

1. **Interactive Probe**: Mouse tracking on the grid calculates and displays Normalized Impedance ($z$), Actual Impedance ($Z$), Admittance ($y$), Reflection Coefficient ($\Gamma$), VSWR, and Return Loss in real-time.
2. **Interactive Selection & Click Probe**: Clicking anywhere on the grid instantly calculates and displays the exact corresponding impedance ($Z$) and reflection coefficient ($\Gamma$), snapping the Load Impedance ($Z_L$) to the chosen point.
3. **Impedance Exercise Pool**: Allows users to save clicked Smith Chart points with custom labels and load them back later for quick testing, setup, and matching exercises.
4. **Double-Grid Overlays**: Toggleable Admittance ($Y$) grid overlay (conductance and susceptance) to facilitate shunt matching.
5. **Smart L-Match Solver**: Uses analytic double-branch algorithms to solve and suggest exactly which Series/Shunt Inductor or Capacitor combination matches the current load to $50\ \Omega$, with a one-click "Apply Match" option.
6. **Interactive Matching Builder**: Allows manual addition of series or shunt components (**Inductors, Capacitors, and Resistors**) with user-defined values, accompanied by high-fidelity sliders to fine-tune values and view real-time trajectory curves on the Smith Chart.
7. **Transmission Line Simulator**: Rotates the load along constant SWR circles by adjusting electrical length in fractions of a wavelength ($\lambda$).
8. **Educational Academy**: Guided interactive tutorial stages highlighting key sections of the Smith Chart (Short, Open, Center, Unity Circles, Inductive vs Capacitive).
9. **In-App & CLI Unit Test Suite**: Comprehensive, automated mathematical assertions verifying all coordinate conversions, SWR, and series/shunt resistor additions.

---

## 📐 Mathematical Framework & Möbius Transformations

### 1. Impedance to Reflection Coefficient ($\Gamma$)
The Smith Chart is plotted on the complex reflection coefficient $\Gamma$ plane ($\Gamma = \Gamma_r + j\Gamma_i$) where $|\Gamma| \le 1$. The mapping from normalized load impedance $z = r + jx$ is an exact **Möbius Transformation**:

$$\Gamma = \frac{z - 1}{z + 1} = \frac{(r - 1) + jx}{(r + 1) + jx}$$

Expressing the real and imaginary components:

$$\Gamma_r = \frac{r^2 - 1 + x^2}{(r+1)^2 + x^2}, \quad \Gamma_i = \frac{2x}{(r+1)^2 + x^2}$$

### 2. Reflection Coefficient ($\Gamma$) to Impedance ($z$)
The inverse mapping transforms coordinates from the $\Gamma$-plane back to the normalized impedance $z = r + jx$:

$$z = \frac{1 + \Gamma}{1 - \Gamma} = \frac{(1 + \Gamma_r) + j\Gamma_i}{(1 - \Gamma_r) - j\Gamma_i}$$

$$\text{Resistance } r = \frac{1 - \Gamma_r^2 - \Gamma_i^2}{(1 - \Gamma_r)^2 + \Gamma_i^2}$$
$$\text{Reactance } x = \frac{2\Gamma_i}{(1 - \Gamma_r)^2 + \Gamma_i^2}$$

### 3. Screen Mapping Coordinates
Let the visual center of the circular grid be $(CX, CY)$ and the radius on-screen be $R_{\text{chart}}$. To map $\Gamma = \Gamma_r + j\Gamma_i$ to screen coordinates $(X_{\text{screen}}, Y_{\text{screen}})$:

$$X_{\text{screen}} = CX + \Gamma_r \cdot R_{\text{chart}}$$
$$Y_{\text{screen}} = CY - \Gamma_i \cdot R_{\text{chart}}$$

*(Note: The subtraction for $Y_{\text{screen}}$ handles the inverted vertical axis in screen-space).*

---

## 🎨 UI Layout & Step-by-Step Rendering Logic

The layout is arranged as a responsive single-page dashboard.

```
+-------------------------------------------------------------------------+
|                  [Smith Chart Interactive Laboratory]                   |
+----------------------------------------+--------------------------------+
|                                        |  [Workspaces Tabbed Panel]     |
|         [Smith Chart Visualizer]       |  (Academy / Matching / T-Line) |
|         - Interactive SVG Grid         |                                |
|         - Real-time Hover Probe        |  +--------------------------+  |
|         - Glowing Matching Traces      |  |                          |  |
|                                        |  | Active Tab View Content  |  |
|                                        |  |                          |  |
|                                        |  +--------------------------+  |
+----------------------------------------+--------------------------------+
|  [Impedance & Environment Controls]    |                                |
|  - Load R_L and X_L sliders            |  [Integrity Tests Results]     |
|  - Freq and Z_0 adjustments            |  - Real-time passing badges    |
+----------------------------------------+--------------------------------+
```

### Rendering Steps for the SVG Grid:
1. **Constant-Resistance Circles**: Render a `<circle>` for each $r \in \{0.2, 0.5, 1.0, 2.0, 5.0\}$:
   - Center: $X = CX + \frac{r}{r+1} \cdot R_{\text{chart}}$, $Y = CY$
   - Radius: $Radius = \frac{1}{r+1} \cdot R_{\text{chart}}$
2. **Constant-Reactance Arcs**: Rather than approximating arcs via SVG commands, this app uses a high-performance **Polyline Trajectory Generator** for mathematical precision. For each $x \in \{\pm 0.2, \pm 0.5, \pm 1.0, \pm 2.0, \pm 5.0\}$:
   - Vary $r$ continuously on a logarithmic scale from $0$ to $50$.
   - Calculate $\Gamma = zToGamma(r + jx)$.
   - Project each $\Gamma$ to screen coordinates.
   - Render as a smooth `<path>` that converges cleanly at the Open Circuit point $(CX + R_{\text{chart}}, CY)$.
3. **Admittance Grid Circles**: When enabled, render mirror-image constant-conductance and constant-susceptance arcs to assist shunt element visualizations.
4. **Trajectory Traces**: When matching components are active, the app samples the addition value into 40 discrete steps, maps each state to screen coordinates, and renders a glowing, directional polyline curve showing the exact circular matching path!

---

## 🧪 Automated Testing

We have built a custom math test runner checking 8 critical assertions:
* Matched Load conversion ($\Gamma = 0$)
* Short Circuit conversion ($\Gamma = -1$)
* Left outer edge back-conversion
* Admittance conversions ($Y = 1/Z$)
* VSWR calculations
* Return Loss calculations
* Series components trajectory mapping

### Running the tests:
To execute the tests from the command line:
```bash
npm run test
```

Alternatively, you can view the live execution and confirmation within the **Integrity Tests** tab inside the web UI.
