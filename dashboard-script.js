// Dashboard real-time script using Firebase v8 & Chart.js
// Updated for new layout structure

// Firebase Database reference
const database = firebase.database();

// Map DB keys to HTML IDs 


const stepKeyMap = {
  step1_raw_material: 'step1',
  step2_proportioning: 'step2', 
  step3_preheater: 'step3',
  step4_kiln: 'step4',
  step5_cooling_grinding: 'step5',
  step6_packing_shipping: 'step6'
};

const charts = {};

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard script loaded');
  initCharts();
  startRealtime();
  updateTime();
  setInterval(updateTime, 1000);
});

// Initialize Chart.js instances with updated styling
function initCharts() {
  Object.values(stepKeyMap).forEach(stepId => {
    const canvas = document.getElementById(`${stepId}-chart`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    charts[stepId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          data: [],
          borderColor: '#4285f4',
          backgroundColor: 'rgba(66,133,244,0.1)',
          fill: true,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            display: false,
            grid: {
              display: false
            }
          },
          y: {
            display: false,
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#4285f4',
            borderWidth: 1
          }
        }
      }
    });
    console.log(`Chart for ${stepId} initialized`);
  });
}

// Listen for Firebase updates
function startRealtime() {
  database.ref('live_data').on('value', snap => {
    const data = snap.val();
    console.log('live_data update:', data);
    if (data) updateDashboard(data);
  }, err => console.error('live_data error', err));

  database.ref('alerts/active').on('value', snap => {
    const alerts = snap.val();
    console.log('alerts update:', alerts);
    renderAlerts(alerts);
  });
}

// Update dashboard for each step
function updateDashboard(dbData) {
  Object.entries(dbData).forEach(([dbKey, node]) => {
    const stepId = stepKeyMap[dbKey];
    if (!stepId) return;
    
    console.log(`Updating ${dbKey} → ${stepId}`, node);
    updateChart(stepId, node.current);
    updateMetrics(stepId, node.current);
    updateParameterStatus(stepId, node.current);
  });
}

// Chart update with improved styling
function updateChart(stepId, current) {
  console.log(`Raw current data for ${stepId}:`, current);
  if (!current) return;

  const keys = Object.keys(current);
  console.log(`Keys for ${stepId}:`, keys);
  
  // Skip 'Time' and find numeric field
  const valKey = keys.find(k => k !== 'Time' && !isNaN(parseFloat(current[k])));
  if (!valKey) {
    console.warn(`No numeric field for ${stepId}, skipping chart`);
    return;
  }

  const value = parseFloat(current[valKey]);
  const time = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  console.log(`Plotting ${stepId}: {${valKey}: ${value}} at ${time}`);

  const chart = charts[stepId];
  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(value);
  
  // Keep only last 20 points for performance
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  
  chart.update('none');
}

// Update parameter status indicator
function updateParameterStatus(stepId, current) {
  if (!current) return;

  const statusElement = document.querySelector(`#${stepId} .parameter-status`);
  if (!statusElement) return;

  // Map stepId to descriptive parameter names as per your HTML
  const paramNames = {
    step1: 'LimeStone CaO Content',
    step2: 'LimeStone Proportion',
    step3: 'Heat Recovery Efficiency',
    step4: 'Klin Filling Degree',
    step5: 'Separator Efficiency',
    step6: 'Silo Level'
  };

  // Get the parameter name for this step or fallback to 'Parameter'
  const displayName = paramNames[stepId] || 'Parameter';

  // Find the first numeric value (excluding 'Time')
  const keys = Object.keys(current);
  const valKey = keys.find(k => k !== 'Time' && !isNaN(parseFloat(current[k])));
  if (valKey) {
    const value = parseFloat(current[valKey]);
    // Calculate percentage like before or adjust logic as needed
    const percentage = Math.min(100, Math.max(0, Math.round((value / 100) * 40 + 20)));

    statusElement.textContent = `${displayName}: ${percentage}%`;

    // Update status class based on percentage
    statusElement.classList.remove('warning', 'success', 'critical');
    if (percentage < 30) {
      statusElement.classList.add('critical');
    } else if (percentage < 50) {
      statusElement.classList.add('warning');
    } else {
      statusElement.classList.add('success');
    }
  }
}


// Update top KPIs with better formatting
function updateMetrics(stepId, current) {
  const container = document.getElementById(`${stepId}-metrics`);
  if (!container || !current) return;
  
  container.innerHTML = '';
  
  // Show top 3 parameters
  const params = Object.keys(current).slice(1, 4);
  
  params.forEach(param => {
    const value = current[param];
    const div = document.createElement('div');
    div.className = 'metric';
    
    // Format parameter name (remove underscores, capitalize)
    const formattedParam = param.replace(/_/g, ' ')
                               .replace(/\b\w/g, l => l.toUpperCase());
    
    // Format value (limit decimal places for numbers)
    const formattedValue = isNaN(parseFloat(value)) 
      ? value 
      : parseFloat(value).toFixed(1);
    
    div.innerHTML = `
      <div class="metric-value">${formattedValue}</div>
      <div class="metric-label">${formattedParam}</div>
    `;
    container.appendChild(div);
  });
}

// Render alerts with improved styling
function renderAlerts(alerts) {
  const alertsList = document.getElementById('alert-list');
  if (!alertsList) return;
  
  alertsList.innerHTML = '';
  
  if (!alerts) {
    alertsList.innerHTML = '<div style="color: #666; text-align: center; padding: 1rem;">No active alerts</div>';
    return;
  }
  
  Object.entries(alerts).forEach(([alertId, alert]) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-item alert-${alert.severity || 'info'}`;
    
    const timeStr = alert.timestamp ? 
      new Date(alert.timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '';
    
    alertDiv.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.25rem;">
        ${alert.title || 'Alert'}
        ${timeStr ? `<span style="float: right; font-size: 0.75rem; opacity: 0.7;">${timeStr}</span>` : ''}
      </div>
      <div style="font-size: 0.8rem; opacity: 0.8;">
        ${alert.message || 'No message available'}
      </div>
    `;
    
    alertsList.appendChild(alertDiv);
  });
}

// Update time display
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    timeElement.textContent = `Time: ${timeString}`;
  }
}

// Export for testing/debugging
window.dashboardApp = {
  updateDashboard,
  updateChart,
  charts,
  renderAlerts
}; 


