let elutionChart = null;
let currentSimulationData = null;

// Enhanced molecular constants based on literature
const MOLECULAR_CONSTANTS = {
  proteinA_pKa: {
    wild_type: { histidine: 6.0, binding_site: 5.8 },
    engineered_mild: { histidine: 6.2, binding_site: 6.0 },
    engineered_harsh: { histidine: 5.8, binding_site: 5.5 },
  },
  antibody_properties: {
    human_igg1: {
      fc_pKa: 6.1,
      stability: 0.9,
      aggregation_tendency: 0.3,
    },
    human_igg2: {
      fc_pKa: 6.0,
      stability: 0.85,
      aggregation_tendency: 0.4,
    },
    human_igg4: {
      fc_pKa: 6.15,
      stability: 0.8,
      aggregation_tendency: 0.5,
    },
    mouse_igg1: {
      fc_pKa: 5.9,
      stability: 0.88,
      aggregation_tendency: 0.35,
    },
    fc_fusion: {
      fc_pKa: 6.05,
      stability: 0.75,
      aggregation_tendency: 0.6,
    },
    fab_fragment: {
      fc_pKa: 6.3,
      stability: 0.95,
      aggregation_tendency: 0.2,
    },
    bispecific: {
      fc_pKa: 6.0,
      stability: 0.7,
      aggregation_tendency: 0.7,
    },
  },
  binding_constants: {
    base_affinity: 1e8, // M^-1
    temperature_factor: 0.02, // per °C deviation from 25°C
    ionic_strength_factor: 0.1,
  },
};

function analyzeSequence() {
  const sequence = document
    .getElementById("proteinSeq")
    .value.toUpperCase()
    .replace(/\s/g, "");
  const ligandFormat = document.getElementById("ligandFormat").value;

  if (!sequence || sequence.length < 10) {
    document.getElementById("sequenceDisplay").innerHTML =
      '<span style="color: #ef4444;">Please enter a valid protein sequence (minimum 10 residues)</span>';
    return null;
  }

  // Calculate effective sequence based on format
  let effectiveSequence = sequence;
  let domainCount = 1;

  const formatMultipliers = {
    monomeric: 1,
    dimeric: 2,
    tetrameric: 4,
    multimeric: 6,
  };

  domainCount = formatMultipliers[ligandFormat] || 1;
  if (domainCount > 1) {
    effectiveSequence = sequence.repeat(domainCount);
  }

  // Enhanced residue analysis
  const residueCounts = {
    histidine: (effectiveSequence.match(/H/g) || []).length,
    asparagine: (effectiveSequence.match(/N/g) || []).length,
    glutamine: (effectiveSequence.match(/Q/g) || []).length,
    tyrosine: (effectiveSequence.match(/Y/g) || []).length,
    phenylalanine: (effectiveSequence.match(/F/g) || []).length,
    cysteine: (effectiveSequence.match(/C/g) || []).length,
    tryptophan: (effectiveSequence.match(/W/g) || []).length,
    aspartic: (effectiveSequence.match(/D/g) || []).length,
    glutamic: (effectiveSequence.match(/E/g) || []).length,
    lysine: (effectiveSequence.match(/K/g) || []).length,
    arginine: (effectiveSequence.match(/R/g) || []).length,
    total: effectiveSequence.length,
  };

  // Highlight sequence with better visualization
  let highlightedSeq = sequence;
  const highlightMap = {
    H: "histidine",
    N: "asparagine",
    Q: "glutamine",
    Y: "tyrosine",
    F: "phenylalanine",
    C: "cysteine",
  };

  Object.entries(highlightMap).forEach(([residue, className]) => {
    const regex = new RegExp(residue, "g");
    highlightedSeq = highlightedSeq.replace(
      regex,
      `<span class="${className}">${residue}</span>`
    );
  });

  // Add domain indicators for multimeric formats
  if (domainCount > 1) {
    highlightedSeq += ` <span style="color: #6b7280; font-style: italic;">×${domainCount} domains</span>`;
  }

  document.getElementById("sequenceDisplay").innerHTML = highlightedSeq;

  // Update residue highlights
  document.getElementById("residueHighlights").innerHTML = `
                <div class="residue-count"><strong>Histidine:</strong> ${
                  residueCounts.histidine
                }</div>
                <div class="residue-count"><strong>Asparagine:</strong> ${
                  residueCounts.asparagine
                }</div>
                <div class="residue-count"><strong>Glutamine:</strong> ${
                  residueCounts.glutamine
                }</div>
                <div class="residue-count"><strong>Aromatic:</strong> ${
                  residueCounts.tyrosine +
                  residueCounts.phenylalanine +
                  residueCounts.tryptophan
                }</div>
                <div class="residue-count"><strong>Cysteine:</strong> ${
                  residueCounts.cysteine
                }</div>
                <div class="residue-count"><strong>Total Length:</strong> ${
                  residueCounts.total
                }</div>
            `;

  return { residueCounts, effectiveSequence, domainCount };
}

function calculateAdvancedMetrics(sequenceData) {
  if (!sequenceData) return null;

  const { residueCounts, domainCount } = sequenceData;
  const ligandType = document.getElementById("ligandType").value;
  const targetMolecule = document.getElementById("targetMolecule").value;
  const temperature = parseFloat(document.getElementById("temperature").value);

  // Advanced stability calculations
  const stabilityFactors = {
    histidine: residueCounts.histidine * 3.5, // Protonation stability
    aromatic: (residueCounts.tyrosine + residueCounts.phenylalanine) * 2.1, // Hydrophobic stability
    disulfide: Math.min(residueCounts.cysteine / 2, 4) * 8.0, // Disulfide bonds
    amide: (residueCounts.asparagine + residueCounts.glutamine) * -1.2, // Deamidation risk
    charge:
      (residueCounts.lysine +
        residueCounts.arginine -
        residueCounts.aspartic -
        residueCounts.glutamic) *
      0.8,
  };

  const baseStability =
    65 + Object.values(stabilityFactors).reduce((a, b) => a + b, 0);
  const alkalineStability = Math.max(
    20,
    Math.min(98, baseStability + (temperature - 25) * -0.8)
  );

  // Enhanced binding capacity calculation
  const bindingFactors = {
    base: 75,
    histidine_binding: residueCounts.histidine * 4.5, // Key for protein A binding
    aromatic_interactions:
      (residueCounts.tyrosine + residueCounts.phenylalanine) * 3.2,
    domain_multiplier: domainCount * 15,
    ligand_type_bonus:
      ligandType === "engineered_mild"
        ? 20
        : ligandType === "wild_type"
        ? 0
        : 10,
  };

  const dynamicBindingCapacity = Math.min(
    180,
    Object.values(bindingFactors).reduce((a, b) => a + b, 0)
  );

  // Aggregation and leakage predictions
  const targetProps = MOLECULAR_CONSTANTS.antibody_properties[targetMolecule];
  const aggregationRisk = Math.max(
    2,
    Math.min(
      45,
      targetProps.aggregation_tendency * 30 +
        (temperature > 25 ? (temperature - 25) * 1.2 : 0) +
        (alkalineStability < 70 ? (70 - alkalineStability) * 0.3 : 0)
    )
  );

  const ligandLeakage = Math.max(
    0.5,
    Math.min(
      15,
      8 -
        alkalineStability / 12 +
        residueCounts.asparagine * 0.4 +
        (temperature > 30 ? (temperature - 30) * 0.3 : 0)
    )
  );

  return {
    alkalineStability: parseFloat(alkalineStability.toFixed(1)),
    dynamicBindingCapacity: parseFloat(dynamicBindingCapacity.toFixed(1)),
    aggregationRisk: parseFloat(aggregationRisk.toFixed(1)),
    ligandLeakage: parseFloat(ligandLeakage.toFixed(2)),
    bindingAffinity: this.calculateBindingAffinity(
      residueCounts,
      targetMolecule,
      temperature
    ),
    elutionSharpness: this.calculateElutionSharpness(residueCounts, ligandType),
  };
}

function calculateBindingAffinity(residueCounts, targetMolecule, temperature) {
  const baseAffinity = MOLECULAR_CONSTANTS.binding_constants.base_affinity;
  const targetProps = MOLECULAR_CONSTANTS.antibody_properties[targetMolecule];

  // pH-dependent binding strength
  const histidineContribution = residueCounts.histidine * 1.5;
  const aromaticContribution =
    (residueCounts.tyrosine + residueCounts.phenylalanine) * 1.2;
  const temperatureFactor = Math.exp(
    -MOLECULAR_CONSTANTS.binding_constants.temperature_factor *
      (temperature - 25)
  );

  const effectiveAffinity =
    baseAffinity *
    (1 + histidineContribution / 100) *
    (1 + aromaticContribution / 100) *
    temperatureFactor *
    targetProps.stability;

  return Math.min(9.9e8, Math.max(1e6, effectiveAffinity));
}

function calculateElutionSharpness(residueCounts, ligandType) {
  const baseSigma = 0.3; // pH units
  const histidineFactor = Math.min(2.0, residueCounts.histidine * 0.1);
  const ligandFactor = ligandType === "engineered_mild" ? 0.8 : 1.0;

  return parseFloat((baseSigma * histidineFactor * ligandFactor).toFixed(2));
}

function generateElutionProfile(sequenceData, parameters) {
  if (!sequenceData) return [];

  const { residueCounts } = sequenceData;
  const elutionStrategy = parameters.elutionStrategy;
  const gradientTime = parameters.gradientTime;
  const ligandType = parameters.ligandType;
  const targetMolecule = parameters.targetMolecule;
  const temperature = parameters.temperature;

  // Define pH ranges based on strategy
  const pHRanges = {
    traditional: { start: 7.4, end: 2.5, steps: 150 },
    mild: { start: 7.4, end: 3.5, steps: 120 },
    step: { start: 7.4, end: 3.0, steps: 50 },
    salt_assisted: { start: 7.4, end: 3.2, steps: 100 },
    competitive: { start: 7.4, end: 4.0, steps: 80 },
  };

  const range = pHRanges[elutionStrategy];
  const dataPoints = [];
  const targetProps = MOLECULAR_CONSTANTS.antibody_properties[targetMolecule];
  const ligandProps =
    MOLECULAR_CONSTANTS.proteinA_pKa[ligandType] ||
    MOLECULAR_CONSTANTS.proteinA_pKa.wild_type;

  // Calculate elution parameters
  const elutionPH = this.calculateOptimalElutionPH(
    residueCounts,
    ligandType,
    targetMolecule
  );
  const peakWidth = this.calculateElutionSharpness(residueCounts, ligandType);
  const maxIntensity = Math.min(
    150,
    50 + residueCounts.histidine * 8 + parameters.targetConcentration * 10
  );

  for (let i = 0; i <= range.steps; i++) {
    const progress = i / range.steps;
    const currentPH = range.start - progress * (range.start - range.end);
    const timeMinutes = progress * gradientTime;

    // Advanced binding model based on Henderson-Hasselbalch and protein A mechanism
    let bindingStrength = 1.0;

    // Histidine protonation effect (major factor)
    const histidineProtonation =
      residueCounts.histidine > 0
        ? Math.pow(10, ligandProps.histidine - currentPH) /
          (1 + Math.pow(10, ligandProps.histidine - currentPH))
        : 0;

    // Fc binding site protonation
    const fcProtonation =
      Math.pow(10, targetProps.fc_pKa - currentPH) /
      (1 + Math.pow(10, targetProps.fc_pKa - currentPH));

    // Electrostatic repulsion calculation
    const electrostaticRepulsion = histidineProtonation * fcProtonation * 2.0;

    // Hydrophobic contributions (less pH sensitive)
    const hydrophobicContribution =
      (residueCounts.tyrosine + residueCounts.phenylalanine) *
      0.03 *
      (1 - electrostaticRepulsion * 0.5);

    bindingStrength = Math.max(
      0,
      1 - electrostaticRepulsion + hydrophobicContribution
    );

    // Calculate elution intensity (inverse of binding strength)
    let elutionIntensity = 0;
    if (bindingStrength < 0.5) {
      // Gaussian-like elution peak centered at optimal pH
      const pHDeviation = currentPH - elutionPH;
      elutionIntensity =
        maxIntensity *
        Math.exp(-(pHDeviation * pHDeviation) / (2 * peakWidth * peakWidth)) *
        (1 - bindingStrength);

      // Add tailing effects for harsh conditions
      if (elutionStrategy === "traditional" && currentPH < elutionPH) {
        elutionIntensity +=
          maxIntensity * 0.1 * Math.exp(-Math.abs(pHDeviation) / 0.5);
      }
    }

    // Temperature effects
    const tempFactor = 1 + (temperature - 25) * 0.015;
    elutionIntensity *= tempFactor;

    // Add realistic noise
    elutionIntensity += (Math.random() - 0.5) * 2;
    elutionIntensity = Math.max(0, elutionIntensity);

    dataPoints.push({
      time: parseFloat(timeMinutes.toFixed(2)),
      pH: parseFloat(currentPH.toFixed(2)),
      intensity: parseFloat(elutionIntensity.toFixed(2)),
      bindingStrength: parseFloat(bindingStrength.toFixed(3)),
    });
  }

  return dataPoints;
}

function calculateOptimalElutionPH(residueCounts, ligandType, targetMolecule) {
  const ligandProps =
    MOLECULAR_CONSTANTS.proteinA_pKa[ligandType] ||
    MOLECULAR_CONSTANTS.proteinA_pKa.wild_type;
  const targetProps = MOLECULAR_CONSTANTS.antibody_properties[targetMolecule];

  // Base elution pH influenced by histidine content and target properties
  const baseElutionPH = ligandProps.binding_site - 0.5;
  const histidineAdjustment = residueCounts.histidine * 0.1;
  const targetAdjustment = (targetProps.fc_pKa - 6.0) * 0.5;

  return Math.max(
    2.8,
    Math.min(5.5, baseElutionPH - histidineAdjustment + targetAdjustment)
  );
}

function findElutionPeak(dataPoints) {
  let maxIntensity = 0;
  let peakData = { time: 0, pH: 7.0, intensity: 0 };

  dataPoints.forEach((point) => {
    if (point.intensity > maxIntensity) {
      maxIntensity = point.intensity;
      peakData = { ...point };
    }
  });

  // Calculate peak characteristics
  const halfMax = maxIntensity / 2;
  let peakStart = peakData.time;
  let peakEnd = peakData.time;

  // Find FWHM
  for (let i = 0; i < dataPoints.length; i++) {
    if (dataPoints[i].intensity >= halfMax) {
      if (dataPoints[i].time < peakData.time) {
        peakStart = dataPoints[i].time;
      }
      if (dataPoints[i].time > peakData.time) {
        peakEnd = dataPoints[i].time;
        break;
      }
    }
  }

  const peakWidth = peakEnd - peakStart;

  return {
    ...peakData,
    peakWidth: parseFloat(peakWidth.toFixed(2)),
  };
}

function updatePerformanceMetrics(metrics, warnings = []) {
  if (!metrics) return;

  const metricsHtml = `
                <div class="metric-card">
                    <div class="label">Alkaline Stability</div>
                    <div class="value">${metrics.alkalineStability}%</div>
                </div>
                <div class="metric-card">
                    <div class="label">Binding Capacity</div>
                    <div class="value">${metrics.dynamicBindingCapacity}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Aggregation Risk</div>
                    <div class="value">${metrics.aggregationRisk}%</div>
                </div>
                <div class="metric-card">
                    <div class="label">Ligand Leakage</div>
                    <div class="value">${metrics.ligandLeakage} μg/mL</div>
                </div>
                <div class="metric-card">
                    <div class="label">Binding Affinity</div>
                    <div class="value">${(
                      metrics.bindingAffinity / 1e8
                    ).toFixed(1)}×10⁸</div>
                </div>
                <div class="metric-card">
                    <div class="label">Peak Width</div>
                    <div class="value">${metrics.elutionSharpness} pH</div>
                </div>
            `;

  document.getElementById("performanceMetrics").innerHTML = metricsHtml;

  // Show warnings if any
  const warningContainer = document.getElementById("warningContainer");
  if (warnings.length > 0) {
    const warningsHtml = warnings
      .map(
        (warning) => `
                    <div class="warning-box">
                        <h5>⚠️ ${warning.title}</h5>
                        <p>${warning.message}</p>
                    </div>
                `
      )
      .join("");
    warningContainer.innerHTML = warningsHtml;
  } else {
    warningContainer.innerHTML = "";
  }
}

function updateElutionChart(data, peakInfo) {
  const ctx = document.getElementById("elutionChart").getContext("2d");

  if (elutionChart) {
    elutionChart.destroy();
  }

  const maxIntensity = Math.max(...data.map((d) => d.intensity));

  elutionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((d) => d.time),
      datasets: [
        {
          label: "Antibody Elution (A280 nm)",
          data: data.map((d) => d.intensity),
          borderColor: "rgb(108, 92, 231)",
          backgroundColor: "rgba(108, 92, 231, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 8,
          borderWidth: 3,
        },
        {
          label: "pH Gradient",
          data: data.map((d) => d.pH * (maxIntensity / 8)), // Scale for visibility
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
          yAxisID: "y1",
        },
        {
          label: "Binding Strength",
          data: data.map((d) => d.bindingStrength * maxIntensity),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.05)",
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [3, 3],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12, weight: "600" },
          },
        },
        title: {
          display: true,
          text: `Predicted Chromatogram - Peak at pH ${peakInfo.pH} (${peakInfo.time} min)`,
          font: { size: 16, weight: "bold" },
          color: "#1f2937",
        },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(108, 92, 231, 0.5)",
          borderWidth: 1,
          callbacks: {
            title: function (context) {
              return `Time: ${context[0].label} min`;
            },
            label: function (context) {
              const point = data[context.dataIndex];
              if (context.datasetIndex === 0) {
                return `Elution: ${context.parsed.y.toFixed(1)} mAU`;
              } else if (context.datasetIndex === 1) {
                return `pH: ${point.pH}`;
              } else {
                return `Binding: ${point.bindingStrength.toFixed(3)}`;
              }
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: "Time (minutes)",
            font: { size: 14, weight: "600" },
          },
          grid: { color: "rgba(0, 0, 0, 0.1)" },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: {
            display: true,
            text: "Absorbance (mAU) / Binding Strength",
            font: { size: 14, weight: "600" },
          },
          grid: { color: "rgba(0, 0, 0, 0.1)" },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: {
            display: true,
            text: "pH (scaled)",
            font: { size: 14, weight: "600" },
          },
          grid: { drawOnChartArea: false },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      animation: {
        duration: 2000,
        easing: "easeInOutQuart",
      },
    },
  });
}

function generateWarnings(metrics, peakInfo, parameters) {
  const warnings = [];

  if (metrics.aggregationRisk > 25) {
    warnings.push({
      title: "High Aggregation Risk",
      message: `Aggregation risk is ${metrics.aggregationRisk}%. Consider using milder elution conditions or adding stabilizers.`,
    });
  }

  if (peakInfo.pH < 3.2) {
    warnings.push({
      title: "Harsh Elution Conditions",
      message: `Elution pH of ${peakInfo.pH} may cause protein degradation. Consider engineered ligands for milder conditions.`,
    });
  }

  if (metrics.ligandLeakage > 8) {
    warnings.push({
      title: "High Ligand Leakage",
      message: `Predicted ligand leakage of ${metrics.ligandLeakage} μg/mL exceeds recommended levels. Check ligand stability.`,
    });
  }

  if (metrics.dynamicBindingCapacity < 60) {
    warnings.push({
      title: "Low Binding Capacity",
      message: `Binding capacity of ${metrics.dynamicBindingCapacity} mg/mL is below typical ranges. Optimize ligand density.`,
    });
  }

  if (parameters.temperature > 30) {
    warnings.push({
      title: "Elevated Temperature",
      message: `Operating temperature of ${parameters.temperature}°C may reduce stability and increase aggregation.`,
    });
  }

  return warnings;
}

function runAdvancedSimulation() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.style.display = "flex";

  setTimeout(() => {
    try {
      // Get current parameters
      const parameters = {
        ligandType: document.getElementById("ligandType").value,
        ligandFormat: document.getElementById("ligandFormat").value,
        targetMolecule: document.getElementById("targetMolecule").value,
        targetConcentration: parseFloat(
          document.getElementById("targetConcentration").value
        ),
        columnVolume: parseFloat(document.getElementById("columnVolume").value),
        flowRate: parseFloat(document.getElementById("flowRate").value),
        loadingCapacity: parseFloat(
          document.getElementById("loadingCapacity").value
        ),
        temperature: parseFloat(document.getElementById("temperature").value),
        elutionStrategy: document.getElementById("elutionStrategy").value,
        gradientTime: parseFloat(document.getElementById("gradientTime").value),
      };

      // Analyze sequence
      const sequenceData = analyzeSequence();
      if (!sequenceData) {
        throw new Error("Invalid sequence data");
      }

      // Calculate metrics
      const metrics = calculateAdvancedMetrics(sequenceData);

      // Generate elution profile
      const elutionData = generateElutionProfile(sequenceData, parameters);
      const peakInfo = findElutionPeak(elutionData);

      // Calculate additional results
      const recoveryYield = Math.min(
        98,
        Math.max(70, 90 - metrics.aggregationRisk * 0.5)
      );
      const purity = Math.min(
        99.5,
        Math.max(85, 95 - metrics.ligandLeakage * 2)
      );
      const productivity =
        (parameters.targetConcentration *
          parameters.columnVolume *
          recoveryYield) /
        100 /
        (parameters.gradientTime / 60);

      // Store simulation data
      currentSimulationData = {
        sequenceData,
        parameters,
        metrics,
        elutionData,
        peakInfo,
        recoveryYield,
        purity,
        productivity,
      };

      // Update displays
      updatePerformanceMetrics(
        metrics,
        generateWarnings(metrics, peakInfo, parameters)
      );
      updateElutionChart(elutionData, peakInfo);
      updateResultsGrid(currentSimulationData);
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Simulation failed. Please check your inputs and try again.");
    } finally {
      loadingOverlay.style.display = "none";
    }
  }, 2000);
}

function updateResultsGrid(simData) {
  const { metrics, peakInfo, recoveryYield, purity, productivity, parameters } =
    simData;

  const resultsHtml = `
                <div class="result-card">
                    <h4>Elution Peak pH</h4>
                    <div class="value">${peakInfo.pH}</div>
                    <div class="unit">pH units</div>
                </div>
                <div class="result-card">
                    <h4>Peak Time</h4>
                    <div class="value">${peakInfo.time}</div>
                    <div class="unit">minutes</div>
                </div>
                <div class="result-card">
                    <h4>Peak Intensity</h4>
                    <div class="value">${peakInfo.intensity.toFixed(1)}</div>
                    <div class="unit">mAU</div>
                </div>
                <div class="result-card">
                    <h4>Recovery Yield</h4>
                    <div class="value">${recoveryYield.toFixed(1)}</div>
                    <div class="unit">%</div>
                </div>
                <div class="result-card">
                    <h4>Product Purity</h4>
                    <div class="value">${purity.toFixed(1)}</div>
                    <div class="unit">%</div>
                </div>
                <div class="result-card">
                    <h4>Productivity</h4>
                    <div class="value">${productivity.toFixed(2)}</div>
                    <div class="unit">mg/h</div>
                </div>
                <div class="result-card">
                    <h4>Peak Width</h4>
                    <div class="value">${peakInfo.peakWidth}</div>
                    <div class="unit">minutes</div>
                </div>
            `;

  document.getElementById("resultsGrid").innerHTML = resultsHtml;
}

// Initialize application
document.addEventListener("DOMContentLoaded", function () {
  // Set up event listeners
  document
    .getElementById("proteinSeq")
    .addEventListener("input", analyzeSequence);
  document
    .getElementById("ligandFormat")
    .addEventListener("change", analyzeSequence);

  // Initial analysis
  analyzeSequence();

  // Run initial simulation
  setTimeout(() => {
    runAdvancedSimulation();
  }, 500);
});
