const paramRanges = {
  FeedSize:               { min:   0.0,  max: 100.0 },
  ProductSize:            { min:   5.0,  max:  95.0 },
  MillPowerConsumption1:  { min:  10.0,  max:  90.0 },
  MillInletTemperature:   { min:  20.0,  max:  80.0 },
  BlendingEfficiency:     { min:  25.0,  max:  75.0 },
  C5Temperature:          { min:  30.0,  max:  70.0 },
  HeatRecoveryEfficiency: { min:  35.0,  max:  65.0 },
  FuelFlowRate:           { min:  40.0,  max:  60.0 },
  PrimaryFuelFlow:        { min:  45.0,  max:  55.0 },
  SecondaryAirTemp:       { min:  50.0,  max:  50.0 },
  KilnDrivePower:         { min:   0.0,  max: 200.0 },
  ClinkerInletTemp:       { min:   1.0,  max: 150.0 },
  CoolingAirFlow:         { min:   2.5,  max:  75.0 },
  MillPowerConsumption2:  { min:   5.0,  max: 125.0 },
  PackingRate:            { min:  10.0,  max: 300.0 }
};

const paramStep = {
  FeedSize:1, ProductSize:1, MillPowerConsumption1:1, MillInletTemperature:1,
  BlendingEfficiency:2, C5Temperature:2, HeatRecoveryEfficiency:2,
  FuelFlowRate:3, PrimaryFuelFlow:3, SecondaryAirTemp:3,
  KilnDrivePower:4, ClinkerInletTemp:4,
  CoolingAirFlow:5,
  MillPowerConsumption2:6, PackingRate:6
};

const invalidSteps = new Set();

function validateParam(inputEl) {
  const key   = inputEl.dataset.param;
  const value = parseFloat(inputEl.value);
  const range = paramRanges[key];
  const step  = paramStep[key];

  invalidSteps.delete(step);
  inputEl.closest('.param-row').classList.remove('error');

  if (range && !isNaN(value)) {
    if (value < range.min || value > range.max) {
      invalidSteps.add(step);
      inputEl.closest('.param-row').classList.add('error');
    }
  }
  updateStepImage();
  updateAlerts();
}

function updateStepImage() {
  const img = document.getElementById('stepImage');
  if (invalidSteps.size === 0) {
    img.src = 'images/default.png';
  } else {
    const stepNum = Math.min(...invalidSteps);
    img.src = `images/step${stepNum}.png`;
  }
}

function updateAlerts() {
  const alertDiv = document.getElementById('outOfBoundsMsg');
  if (invalidSteps.size === 0) {
    alertDiv.textContent = '';
    alertDiv.classList.add('hidden');
  } else {
    alertDiv.textContent = 'You are out of bound, please look into the process.';
    alertDiv.classList.remove('hidden');
  }
}

function updateTime() {
  const now = new Date();
  const t   = now.toLocaleTimeString('en-GB', { hour12: false });
  document.getElementById('simTime').textContent = `Time: ${t}`;
}

function handleSubmit() {
  const efficiencyMsg = document.getElementById('efficiencyMsg');
  efficiencyMsg.textContent = 'Your current efficiency of the plant is 77%.';
  efficiencyMsg.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  const controls = document.getElementById('simControls');
  const labels = [
    'Feed Size','Product Size','Mill Power Consumption','Mill Inlet Temperature',
    'Blending Efficiency','C5 Temperature','Heat Recovery Efficiency',
    'Fuel Flow Rate','Primary Fuel Flow','Secondary Air Temperature',
    'Kiln Drive Power','Clinker Inlet Temperature','Cooling Air Flow',
    'Mill Power Consumption','Packing Rate'
  ];
  const keys = Object.keys(paramRanges);

  // Render parameter rows
  keys.forEach((key, idx) => {
    const div = document.createElement('div');
    div.className = 'param-row';
    div.innerHTML = `
      <label for="${key}">${labels[idx]}</label>
      <input type="number"
             id="${key}"
             data-param="${key}"
             step="0.01"
             placeholder="Enter value"
             oninput="validateParam(this)" />`;
    controls.appendChild(div);
  });

  // Submit button listener
  document.getElementById('calculateBtn').addEventListener('click', handleSubmit);

  // Start clock
  updateTime();
  setInterval(updateTime, 1000);

  // Initial validation & alerts
  keys.forEach(key => validateParam(document.getElementById(key)));

  // Firebase listener
  const db = firebase.database();
  db.ref('live_data/step1_raw_material/current').on('value', snap => {
    const data = snap.val();
    document.getElementById('simulatorFrame').textContent =
      data ? JSON.stringify(data, null, 2) : 'No data';
  });
});
