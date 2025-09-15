# An Engineered Protein A pH Elution Simulator 

An interactive web tool to simulate antibody elution profiles for engineered **Protein A variants** and **peptide ligands**.  
The simulator predicts pH-dependent elution chromatograms, highlights key amino acid residues, and estimates performance metrics like **binding capacity**, **alkaline stability**, and **ligand leakage**.

<img width="835" height="1006" alt="Screenshot 2025-09-12 at 15-45-04 Engineered Protein A pH Elution Simulator" src="https://github.com/user-attachments/assets/a4362ea8-4035-4d8c-9484-3f3e87e07f5a" />

---

## 🚀 Features
- Interactive input for engineered Protein A sequences  
- Support for **monomeric, tetrameric, and peptide ligands**  
- Adjustable **column volume**, **flow rate**, and **pH gradient slope**  
- Real-time **chromatogram plotting** using Chart.js  
- Residue highlighting for **H, N, Q, Y, F, C**  
- Predicted metrics:
  - Elution peak pH & time  
  - Binding capacity  
  - Alkaline stability  
  - Aggregation risk  
  - Ligand leakage  

## 🔗 Access Here - [pH Simulation](https://gopizux.github.io/Virtual-Affinity-Chromatography-Simulation/)
---

## 📂 Project Structure
Depending on ligand type:

Monomeric → sequence used as-is.

Tetrameric → sequence is repeated 4× (simulating 4 binding domains).

Peptide ligand → uses sequence directly, but different scaling later.

Key residues are counted:

Histidines (H) → pH-sensitive (pKa ~6.0). Protonation at low pH destabilizes binding.

Asparagines (N) → prone to deamidation, reducing stability.

Glutamines (Q) → similar polarity effect.

Tyrosines (Y) & Phenylalanines (F) → aromatic residues, contribute to hydrophobic interactions.

Cysteines (C) → may form disulfide bonds (stability contribution).

## Performance Metrics

From residue counts, the simulator computes:

Alkaline Stability
70 + (Histidines × 2) – (Asparagines × 1.5)
(capped at 100%)

Binding Capacity
80 + (Y + F) × 5 + (extra 40 if tetrameric)
(capped at 150 mg/mL)

Ligand Leakage
10 – (stabilityScore ÷ 10) (min 2 µg/mL)

##  Biological Interpretation

A lower Elution Peak pH means antibodies release at harsher (more acidic) conditions → can damage antibody.

A higher Elution Peak pH means gentler elution (desired for engineered ligands).

Binding Capacity estimates how much antibody can bind per mL of resin.

Alkaline Stability reflects resistance to CIP (cleaning in place with NaOH).

Ligand Leakage indicates how much ligand contaminates eluate (lower is better).

Aggregation Risk predicts whether low pH will cause antibody aggregation.
