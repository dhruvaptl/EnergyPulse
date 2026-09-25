// Add this helper to your EnergyPulse frontend script.js
// after starting the R Plumber API on http://127.0.0.1:8000.

async function getEnergyPulseModelMetrics() {
  const response = await fetch("http://127.0.0.1:8000/metrics");
  if (!response.ok) throw new Error("Unable to load model metrics");
  return response.json();
}

async function predictEnergy(inputFeatures) {
  const response = await fetch("http://127.0.0.1:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: inputFeatures })
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || "Prediction failed");
  }

  return result;
}

// Example:
// predictEnergy({ lights: 20, T1: 20.5, RH_1: 40 })
//   .then(result => console.log("Predicted energy:", result.prediction))
//   .catch(console.error);
