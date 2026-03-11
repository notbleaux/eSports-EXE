[Ver001.000]
/**
 * HUB 2/4: Advanced Analytics JavaScript
 * SATOR Square Visualization & Analytics Platform
 * Purple Theme - #6B46C1 Primary, #FFD700 Accent
 */

// ============================================
// SAMPLE DATA - For demonstration purposes
// ============================================
const SAMPLE_PLAYERS = [
  { id: 1, name: 'TenZ', team: 'SEN', role: 'duelist', acs: 245, kd: 1.15, adr: 162, kast: 74, rating: 1.12, age: 23 },
  { id: 2, name: 'aspas', team: 'LEV', role: 'duelist', acs: 258, kd: 1.22, adr: 171, kast: 71, rating: 1.18, age: 21 },
  { id: 3, name: 'yay', team: 'DIG', role: 'duelist', acs: 238, kd: 1.18, adr: 155, kast: 73, rating: 1.15, age: 25 },
  { id: 4, name: 'Derke', team: 'FNC', role: 'duelist', acs: 251, kd: 1.20, adr: 168, kast: 72, rating: 1.16, age: 22 },
  { id: 5, name: 'Chronicle', team: 'FNC', role: 'controller', acs: 198, kd: 1.08, adr: 132, kast: 76, rating: 1.05, age: 21 },
  { id: 6, name: 'nAts', team: 'TL', role: 'controller', acs: 205, kd: 1.12, adr: 138, kast: 78, rating: 1.08, age: 22 },
  { id: 7, name: 'Less', team: 'LOUD', role: 'sentinel', acs: 192, kd: 1.05, adr: 128, kast: 75, rating: 1.02, age: 20 },
  { id: 8, name: 'Suygetsu', team: 'NAVI', role: 'sentinel', acs: 188, kd: 1.02, adr: 125, kast: 74, rating: 0.98, age: 23 },
  { id: 9, name: 'Boaster', team: 'FNC', role: 'initiator', acs: 175, kd: 0.95, adr: 118, kast: 81, rating: 0.94, age: 29 },
  { id: 10, name: 'MaKo', team: 'DRX', role: 'controller', acs: 201, kd: 1.09, adr: 135, kast: 77, rating: 1.06, age: 22 },
  { id: 11, name: 'Alfajer', team: 'FNC', role: 'flex', acs: 215, kd: 1.14, adr: 145, kast: 75, rating: 1.10, age: 19 },
  { id: 12, name: 'Something', team: 'PRX', role: 'duelist', acs: 248, kd: 1.19, adr: 165, kast: 70, rating: 1.14, age: 21 }
];

const TIME_SERIES_DATA = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
  datasets: [
    { label: 'TenZ', data: [1.08, 1.12, 1.15, 1.10, 1.14, 1.12], color: '#8B5CF6' },
    { label: 'aspas', data: [1.15, 1.18, 1.14, 1.22, 1.20, 1.18], color: '#FFD700' },
    { label: 'Derke', data: [1.12, 1.14, 1.16, 1.13, 1.18, 1.16], color: '#00D4FF' },
    { label: 'yay', data: [1.18, 1.15, 1.12, 1.16, 1.14, 1.15], color: '#FF4655' }
  ]
};

const INVESTMENT_DATA = [
  { player: 'TenZ', grade: 'A', rar: 1.18, recommendation: 'hold', risk: 'low' },
  { player: 'aspas', grade: 'A+', rar: 1.24, recommendation: 'buy', risk: 'low' },
  { player: 'yay', grade: 'A-', rar: 1.16, recommendation: 'hold', risk: 'medium' },
  { player: 'Derke', grade: 'A', rar: 1.19, recommendation: 'buy', risk: 'low' },
  { player: 'Chronicle', grade: 'B+', rar: 1.08, recommendation: 'hold', risk: 'low' },
  { player: 'nAts', grade: 'A-', rar: 1.12, recommendation: 'buy', risk: 'low' },
  { player: 'Less', grade: 'B', rar: 1.04, recommendation: 'hold', risk: 'low' },
  { player: 'Alfajer', grade: 'A-', rar: 1.14, recommendation: 'buy', risk: 'medium' },
  { player: 'Something', grade: 'A', rar: 1.17, recommendation: 'hold', risk: 'medium' }
];

// SATOR Square Layer Definitions
const SATOR_LAYERS = {
  S: { name: 'SimRating', description: 'Core performance rating combining 37 metrics', color: '#8B5CF6' },
  A: { name: 'Age Curve', description: 'Performance trajectory based on player age', color: '#FFD700' },
  T: { name: 'Temporal', description: 'Time-based performance analysis and trends', color: '#00D4FF' },
  O: { name: 'Overfitting', description: 'Statistical validation and confidence metrics', color: '#FF4655' },
  R: { name: 'Role-Based', description: 'Position-adjusted performance metrics', color: '#00FF88' }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatNumber(num, decimals = 2) {
  return Number(num).toFixed(decimals);
}

function getRoleColor(role) {
  const colors = {
    duelist: '#FF4655',
    controller: '#8B5CF6',
    sentinel: '#00D4FF',
    initiator: '#FFD700',
    flex: '#00FF88'
  };
  return colors[role] || '#ffffff';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// SATOR SQUARE VISUALIZATION
// ============================================
class SatorSquare {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeLayer = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.attachEventListeners();
  }

  render() {
    // Create 5x5 SATOR Square grid
    const pattern = [
      ['S', 'A', 'T', 'O', 'R'],
      ['A', 'R', 'E', 'P', 'O'],
      ['T', 'E', 'N', 'E', 'T'],
      ['O', 'P', 'E', 'R', 'A'],
      ['R', 'O', 'T', 'A', 'S']
    ];

    this.container.innerHTML = '';
    this.container.className = 'sator-square__container';

    pattern.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        const facet = document.createElement('div');
        facet.className = 'sator-square__facet';
        facet.dataset.letter = letter;
        facet.dataset.row = rowIndex;
        facet.dataset.col = colIndex;
        facet.dataset.layer = letter.toLowerCase();

        // Check if this position corresponds to a layer
        const layer = SATOR_LAYERS[letter];
        if (layer) {
          facet.dataset.layerName = layer.name;
        }

        facet.innerHTML = `
          <span class="sator-square__letter">${letter}</span>
          ${layer ? `<span class="sator-square__label">${layer.name.substring(0, 3)}</span>` : ''}
        `;

        this.container.appendChild(facet);
      });
    });
  }

  attachEventListeners() {
    const facets = this.container.querySelectorAll('.sator-square__facet');
    facets.forEach(facet => {
      facet.addEventListener('click', () => this.handleFacetClick(facet));
      facet.addEventListener('mouseenter', () => this.handleFacetHover(facet));
    });
  }

  handleFacetClick(facet) {
    const letter = facet.dataset.letter;
    const layer = SATOR_LAYERS[letter];
    
    // Toggle active state
    this.container.querySelectorAll('.sator-square__facet').forEach(f => {
      f.classList.remove('sator-square__facet--active');
    });
    
    if (layer && this.activeLayer !== letter) {
      facet.classList.add('sator-square__facet--active');
      this.activeLayer = letter;
      this.openLayerDetail(layer, letter);
    } else {
      this.activeLayer = null;
      this.closeLayerDetail();
    }
  }

  handleFacetHover(facet) {
    // Optional: Add hover effects or tooltip logic
  }

  openLayerDetail(layer, letter) {
    const panel = document.getElementById('layerDetailPanel');
    if (!panel) return;

    const title = panel.querySelector('.layer-detail-panel__title');
    const content = panel.querySelector('.layer-detail-panel__content');
    
    title.textContent = `${letter} - ${layer.name}`;
    title.style.color = layer.color;
    
    content.innerHTML = this.generateLayerContent(layer, letter);
    
    panel.classList.add('layer-detail-panel--open');
    
    // Initialize mini-chart if applicable
    if (letter === 'T') {
      this.initTemporalChart();
    }
  }

  closeLayerDetail() {
    const panel = document.getElementById('layerDetailPanel');
    if (panel) {
      panel.classList.remove('layer-detail-panel--open');
    }
  }

  generateLayerContent(layer, letter) {
    const contents = {
      S: this.generateSimRatingContent(),
      A: this.generateAgeCurveContent(),
      T: this.generateTemporalContent(),
      O: this.generateOverfittingContent(),
      R: this.generateRoleBasedContent()
    };
    
    return contents[letter] || `<p>${layer.description}</p>`;
  }

  generateSimRatingContent() {
    const topPlayers = SAMPLE_PLAYERS.slice(0, 5);
    return `
      <div class="mb-4">
        <p class="text-white/70 mb-4">SimRating combines 37 performance metrics into a single comprehensive score.</p>
      </div>
      <div class="space-y-3">
        ${topPlayers.map((p, i) => `
          <div class="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">${i + 1}</span>
              <span class="font-medium text-white">${p.name}</span>
              <span class="text-xs text-white/50">${p.team}</span>
            </div>
            <span class="font-bold text-[#FFD700]">${p.rating.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <h4 class="text-sm font-semibold text-purple-400 mb-2">How SimRating Works</h4>
        <p class="text-sm text-white/60">Combines ACS, K/D, ADR, KAST, clutch success, and 32 other metrics weighted by role and competition level.</p>
      </div>
    `;
  }

  generateAgeCurveContent() {
    return `
      <div class="mb-4">
        <p class="text-white/70 mb-4">Age-adjusted performance curves showing expected trajectory based on player development patterns.</p>
      </div>
      <canvas id="ageCurveChart" width="400" height="200"></canvas>
      <div class="mt-4 space-y-3">
        <div class="p-3 bg-[#1a1a2e] rounded-lg">
          <div class="text-xs text-white/50 uppercase mb-1">Peak Age Range</div>
          <div class="text-lg font-bold text-[#FFD700]">21-24 years</div>
        </div>
        <div class="p-3 bg-[#1a1a2e] rounded-lg">
          <div class="text-xs text-white/50 uppercase mb-1">Young Gun</div>
          <div class="text-lg font-bold text-white">Alfajer <span class="text-sm text-white/50">(19)</span></div>
        </div>
      </div>
    `;
  }

  generateTemporalContent() {
    return `
      <div class="mb-4">
        <p class="text-white/70 mb-4">Time-series analysis tracking player performance trends over the current season.</p>
      </div>
      <canvas id="temporalMiniChart" width="400" height="200"></canvas>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="p-3 bg-[#1a1a2e] rounded-lg text-center">
          <div class="text-xs text-white/50 uppercase mb-1">Trending Up</div>
          <div class="text-lg font-bold text-green-400">aspas</div>
        </div>
        <div class="p-3 bg-[#1a1a2e] rounded-lg text-center">
          <div class="text-xs text-white/50 uppercase mb-1">Consistent</div>
          <div class="text-lg font-bold text-blue-400">TenZ</div>
        </div>
      </div>
    `;
  }

  generateOverfittingContent() {
    return `
      <div class="mb-4">
        <p class="text-white/70 mb-4">Statistical validation metrics ensuring predictions are robust against overfitting.</p>
      </div>
      <div class="space-y-3">
        <div class="p-3 bg-[#1a1a2e] rounded-lg">
          <div class="flex justify-between mb-1">
            <span class="text-sm text-white/70">Cross-Validation Score</span>
            <span class="text-sm font-bold text-green-400">0.87</span>
          </div>
          <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-green-400 rounded-full" style="width: 87%"></div>
          </div>
        </div>
        <div class="p-3 bg-[#1a1a2e] rounded-lg">
          <div class="flex justify-between mb-1">
            <span class="text-sm text-white/70">Confidence Interval</span>
            <span class="text-sm font-bold text-blue-400">±0.04</span>
          </div>
          <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-blue-400 rounded-full" style="width: 92%"></div>
          </div>
        </div>
        <div class="p-3 bg-[#1a1a2e] rounded-lg">
          <div class="flex justify-between mb-1">
            <span class="text-sm text-white/70">Sample Size</span>
            <span class="text-sm font-bold text-purple-400">12,847</span>
          </div>
          <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-purple-400 rounded-full" style="width: 100%"></div>
          </div>
        </div>
      </div>
    `;
  }

  generateRoleBasedContent() {
    return `
      <div class="mb-4">
        <p class="text-white/70 mb-4">Performance metrics normalized and weighted by player role.</p>
      </div>
      <div class="space-y-3">
        ${['Duelist', 'Controller', 'Sentinel', 'Initiator'].map(role => `
          <div class="p-3 bg-[#1a1a2e] rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="role-badge role-badge--${role.toLowerCase()}">${role}</span>
              <span class="text-xs text-white/50">${SAMPLE_PLAYERS.filter(p => p.role === role.toLowerCase()).length} players</span>
            </div>
            <div class="text-sm text-white/70">Top: ${SAMPLE_PLAYERS.filter(p => p.role === role.toLowerCase()).sort((a, b) => b.rating - a.rating)[0]?.name || 'N/A'}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  initTemporalChart() {
    const canvas = document.getElementById('temporalMiniChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: TIME_SERIES_DATA.labels,
        datasets: TIME_SERIES_DATA.datasets.slice(0, 3).map(d => ({
          label: d.label,
          data: d.data,
          borderColor: d.color,
          backgroundColor: d.color + '20',
          tension: 0.4,
          fill: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } }
          }
        },
        scales: {
          x: {
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            min: 1.0,
            max: 1.3
          }
        }
      }
    });
  }
}

// ============================================
// PERFORMANCE MATRIX (SCATTER PLOT)
// ============================================
class PerformanceMatrix {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas?.getContext('2d');
    this.options = {
      xKey: 'acs',
      yKey: 'kd',
      xLabel: 'ACS',
      yLabel: 'K/D Ratio',
      ...options
    };
    this.players = [...SAMPLE_PLAYERS];
    this.hoveredPoint = null;
    this.init();
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    
    this.resize();
    window.addEventListener('resize', debounce(() => this.resize(), 100));
    
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    this.render();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height || 400;
    this.render();
  }

  getScales() {
    const padding = 50;
    const width = this.canvas.width - padding * 2;
    const height = this.canvas.height - padding * 2;
    
    const xValues = this.players.map(p => p[this.options.xKey]);
    const yValues = this.players.map(p => p[this.options.yKey]);
    
    const xMin = Math.min(...xValues) * 0.95;
    const xMax = Math.max(...xValues) * 1.05;
    const yMin = Math.min(...yValues) * 0.95;
    const yMax = Math.max(...yValues) * 1.05;
    
    return {
      padding,
      width,
      height,
      xMin,
      xMax,
      yMin,
      yMax,
      xScale: (val) => padding + ((val - xMin) / (xMax - xMin)) * width,
      yScale: (val) => this.canvas.height - padding - ((val - yMin) / (yMax - yMin)) * height
    };
  }

  render() {
    if (!this.ctx) return;
    
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    
    const scales = this.getScales();
    
    // Draw grid
    this.drawGrid(scales);
    
    // Draw axes
    this.drawAxes(scales);
    
    // Draw points
    this.drawPoints(scales);
  }

  drawGrid(scales) {
    const { padding, width, height, xMin, xMax, yMin, yMax } = scales;
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width / 5) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, this.canvas.height - padding);
      this.ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height / 5) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(this.canvas.width - padding, y);
      this.ctx.stroke();
    }
  }

  drawAxes(scales) {
    const { padding, width, height, xMin, xMax, yMin, yMax } = scales;
    
    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';
    
    // X axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, this.canvas.height - padding);
    this.ctx.lineTo(this.canvas.width - padding, this.canvas.height - padding);
    this.ctx.stroke();
    
    // X labels
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width / 5) * i;
      const val = xMin + ((xMax - xMin) / 5) * i;
      this.ctx.fillText(Math.round(val), x, this.canvas.height - padding + 20);
    }
    
    // X axis label
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = 'bold 12px Inter';
    this.ctx.fillText(this.options.xLabel, this.canvas.width / 2, this.canvas.height - 10);
    
    // Y axis
    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, this.canvas.height - padding);
    this.ctx.stroke();
    
    // Y labels
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.ctx.font = '12px Inter';
    for (let i = 0; i <= 5; i++) {
      const y = this.canvas.height - padding - (height / 5) * i;
      const val = yMin + ((yMax - yMin) / 5) * i;
      this.ctx.fillText(val.toFixed(2), padding - 10, y + 4);
    }
    
    // Y axis label
    this.ctx.save();
    this.ctx.translate(15, this.canvas.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.font = 'bold 12px Inter';
    this.ctx.fillText(this.options.yLabel, 0, 0);
    this.ctx.restore();
  }

  drawPoints(scales) {
    this.players.forEach(player => {
      const x = scales.xScale(player[this.options.xKey]);
      const y = scales.yScale(player[this.options.yKey]);
      const isHovered = this.hoveredPoint === player;
      
      // Draw point
      this.ctx.beginPath();
      this.ctx.arc(x, y, isHovered ? 10 : 6, 0, Math.PI * 2);
      this.ctx.fillStyle = getRoleColor(player.role);
      this.ctx.fill();
      
      // Draw border
      this.ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(0,0,0,0.5)';
      this.ctx.lineWidth = isHovered ? 3 : 2;
      this.ctx.stroke();
      
      // Draw label if hovered
      if (isHovered) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(player.name, x + 15, y - 5);
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.font = '10px Inter';
        this.ctx.fillText(`${player.team} | ${player.role}`, x + 15, y + 10);
      }
    });
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scales = this.getScales();
    let found = null;
    
    this.players.forEach(player => {
      const x = scales.xScale(player[this.options.xKey]);
      const y = scales.yScale(player[this.options.yKey]);
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      
      if (dist < 15) {
        found = player;
      }
    });
    
    if (found !== this.hoveredPoint) {
      this.hoveredPoint = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
      this.render();
    }
  }

  handleMouseLeave() {
    this.hoveredPoint = null;
    this.render();
  }

  handleClick(e) {
    if (this.hoveredPoint) {
      console.log('Clicked player:', this.hoveredPoint);
      // Could open player detail modal
    }
  }

  filterByRole(role) {
    if (role === 'all') {
      this.players = [...SAMPLE_PLAYERS];
    } else {
      this.players = SAMPLE_PLAYERS.filter(p => p.role === role);
    }
    this.render();
  }
}

// ============================================
// CHART INITIALIZATIONS
// ============================================
function initTemporalChart() {
  const canvas = document.getElementById('temporalChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: TIME_SERIES_DATA.labels,
      datasets: TIME_SERIES_DATA.datasets.map(d => ({
        label: d.label,
        data: d.data,
        borderColor: d.color,
        backgroundColor: d.color + '20',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(255,255,255,0.7)',
            font: { family: 'Inter', size: 12 },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#14141f',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255,255,255,0.8)',
          borderColor: '#2a2a3a',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          min: 1.0,
          max: 1.3
        }
      }
    }
  });
}

function initRoleChart() {
  const canvas = document.getElementById('roleChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  
  const roleStats = {};
  SAMPLE_PLAYERS.forEach(p => {
    if (!roleStats[p.role]) {
      roleStats[p.role] = { count: 0, totalRating: 0 };
    }
    roleStats[p.role].count++;
    roleStats[p.role].totalRating += p.rating;
  });

  const labels = Object.keys(roleStats).map(r => r.charAt(0).toUpperCase() + r.slice(1));
  const data = Object.values(roleStats).map(r => r.totalRating / r.count);
  const colors = ['#FF4655', '#8B5CF6', '#00D4FF', '#FFD700', '#00FF88'];

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Average Rating',
        data,
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#14141f',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255,255,255,0.8)',
          borderColor: '#2a2a3a',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter' } },
          grid: { display: false }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter' } },
          grid: { color: 'rgba(255,255,255,0.05)' },
          min: 0.9,
          max: 1.2
        }
      }
    }
  });
}

// ============================================
// CUSTOM BUILDER FUNCTIONALITY
// ============================================
class CustomBuilder {
  constructor() {
    this.selectedMetrics = [];
    this.visualizationType = 'table';
    this.filters = {};
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadPresets();
  }

  attachEventListeners() {
    // Metric checkboxes
    document.querySelectorAll('.builder-metric__checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => this.toggleMetric(e));
    });

    // Visualization type selector
    document.querySelectorAll('input[name="vizType"]').forEach(radio => {
      radio.addEventListener('change', (e) => this.setVisualizationType(e.target.value));
    });

    // Preset buttons
    document.querySelectorAll('.builder-preset').forEach(preset => {
      preset.addEventListener('click', () => this.loadPreset(preset.dataset.preset));
    });

    // Save view button
    const saveBtn = document.getElementById('saveViewBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveView());
    }

    // Drag and drop
    this.initDragAndDrop();
  }

  initDragAndDrop() {
    const preview = document.querySelector('.builder-preview');
    if (!preview) return;

    preview.addEventListener('dragover', (e) => {
      e.preventDefault();
      preview.classList.add('builder-preview--drag-over');
    });

    preview.addEventListener('dragleave', () => {
      preview.classList.remove('builder-preview--drag-over');
    });

    preview.addEventListener('drop', (e) => {
      e.preventDefault();
      preview.classList.remove('builder-preview--drag-over');
      const metric = e.dataTransfer.getData('text/plain');
      if (metric && !this.selectedMetrics.includes(metric)) {
        this.selectedMetrics.push(metric);
        this.updatePreview();
      }
    });

    // Make metrics draggable
    document.querySelectorAll('.builder-metric').forEach(metric => {
      metric.draggable = true;
      metric.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', metric.dataset.metric);
      });
    });
  }

  toggleMetric(e) {
    const checkbox = e.currentTarget;
    const metric = checkbox.dataset.metric;
    
    checkbox.classList.toggle('builder-metric__checkbox--checked');
    
    if (this.selectedMetrics.includes(metric)) {
      this.selectedMetrics = this.selectedMetrics.filter(m => m !== metric);
    } else {
      this.selectedMetrics.push(metric);
    }
    
    this.updatePreview();
  }

  setVisualizationType(type) {
    this.visualizationType = type;
    this.updatePreview();
  }

  updatePreview() {
    const preview = document.querySelector('.builder-preview');
    if (!preview) return;

    if (this.selectedMetrics.length === 0) {
      preview.innerHTML = `
        <div class="builder-preview__placeholder">
          <svg class="builder-preview__placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
          </svg>
          <p>Select metrics to build your custom view</p>
          <p class="text-sm mt-2">Drag metrics here or click to add</p>
        </div>
      `;
      return;
    }

    // Generate preview based on visualization type
    if (this.visualizationType === 'table') {
      this.renderTablePreview(preview);
    } else if (this.visualizationType === 'chart') {
      this.renderChartPreview(preview);
    } else {
      this.renderGridPreview(preview);
    }
  }

  renderTablePreview(container) {
    const rows = SAMPLE_PLAYERS.slice(0, 5).map(p => `
      <tr class="border-b border-white/10">
        <td class="py-2 px-3 text-left text-sm text-white">${p.name}</td>
        ${this.selectedMetrics.map(m => `
          <td class="py-2 px-3 text-center text-sm text-white/70">${p[m] || '-'}</td>
        `).join('')}
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="w-full h-full overflow-auto p-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/20">
              <th class="py-2 px-3 text-left text-sm font-semibold text-white">Player</th>
              ${this.selectedMetrics.map(m => `
                <th class="py-2 px-3 text-center text-sm font-semibold text-white/70 uppercase">${m}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  renderChartPreview(container) {
    container.innerHTML = `
      <div class="w-full h-full p-4 flex flex-col items-center justify-center">
        <p class="text-white/70 mb-4">Chart Preview: ${this.selectedMetrics.join(', ')}</p>
        <div class="w-full h-48 bg-white/5 rounded-lg flex items-end justify-around p-4 gap-2">
          ${SAMPLE_PLAYERS.slice(0, 6).map(p => `
            <div class="flex-1 bg-purple-500/50 rounded-t" style="height: ${Math.random() * 80 + 20}%"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderGridPreview(container) {
    container.innerHTML = `
      <div class="w-full h-full p-4 grid grid-cols-3 gap-4">
        ${SAMPLE_PLAYERS.slice(0, 9).map(p => `
          <div class="bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center">
            <span class="text-sm font-medium text-white">${p.name}</span>
            <span class="text-xs text-white/50">${this.selectedMetrics.map(m => `${m}: ${p[m] || '-'}`).join(', ')}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  loadPresets() {
    // Presets are defined in HTML, this method can extend them
  }

  loadPreset(presetName) {
    const presets = {
      offensive: ['acs', 'kd', 'adr'],
      defensive: ['kast', 'fk', 'fd'],
      efficiency: ['rating', 'acs', 'kast'],
      clutch: ['clutchWon', 'clutchAttempts', '1vX'],
      entry: ['fk', 'entrySuccess', 'openingDuels']
    };

    const metrics = presets[presetName] || [];
    this.selectedMetrics = [...metrics];

    // Update UI checkboxes
    document.querySelectorAll('.builder-metric__checkbox').forEach(checkbox => {
      const metric = checkbox.dataset.metric;
      checkbox.classList.toggle('builder-metric__checkbox--checked', metrics.includes(metric));
    });

    this.updatePreview();
  }

  saveView() {
    // Stub - requires authentication
    alert('Sign in to save custom views.\n\nThis feature requires authentication and is available to SATOR members.');
  }
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================
class FilterManager {
  constructor() {
    this.filters = {
      role: 'all',
      region: 'all',
      timeRange: 'all'
    };
    this.init();
  }

  init() {
    document.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => this.handleFilterChange(e));
    });
  }

  handleFilterChange(e) {
    const { name, value } = e.target;
    this.filters[name] = value;
    this.applyFilters();
  }

  applyFilters() {
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('filtersChanged', { detail: this.filters }));
  }

  getFilters() {
    return { ...this.filters };
  }
}

// ============================================
// NAVIGATION & UI
// ============================================
function initNavigation() {
  // Mobile menu toggle
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      mobileMenu.classList.toggle('hidden', isExpanded);
    });
  }

  // Close layer detail panel
  const closeBtn = document.querySelector('.layer-detail-panel__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('layerDetailPanel')?.classList.remove('layer-detail-panel--open');
    });
  }
}

// ============================================
// MEMBERSHIP FEATURES (STUBS)
// ============================================
function initMembershipFeatures() {
  // Export button
  document.querySelectorAll('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Export feature requires authentication.\n\nSign in to export reports as PDF or CSV.');
    });
  });

  // Compare multiple players (limit to 2 for non-members)
  let selectedPlayers = [];
  document.querySelectorAll('[data-player-select]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const playerId = e.currentTarget.dataset.playerId;
      
      if (selectedPlayers.includes(playerId)) {
        selectedPlayers = selectedPlayers.filter(id => id !== playerId);
      } else if (selectedPlayers.length < 2) {
        selectedPlayers.push(playerId);
      } else {
        alert('Free users can compare up to 2 players.\n\nUpgrade to SATOR Premium for unlimited comparisons.');
        return;
      }
      
      // Update UI
      document.querySelectorAll('[data-player-select]').forEach(b => {
        const id = b.dataset.playerId;
        b.classList.toggle('ring-2', selectedPlayers.includes(id));
        b.classList.toggle('ring-purple-500', selectedPlayers.includes(id));
      });
    });
  });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize SATOR Square if on the sator-square page
  const satorContainer = document.getElementById('satorSquare');
  if (satorContainer) {
    window.satorSquare = new SatorSquare('satorSquare');
  }

  // Initialize Performance Matrix if on performance page
  const matrixCanvas = document.getElementById('performanceMatrix');
  if (matrixCanvas) {
    window.performanceMatrix = new PerformanceMatrix('performanceMatrix');
    
    // Role filter
    document.getElementById('roleFilter')?.addEventListener('change', (e) => {
      window.performanceMatrix.filterByRole(e.target.value);
    });
  }

  // Initialize charts if Chart.js is available
  if (typeof Chart !== 'undefined') {
    // Check which charts exist on current page
    if (document.getElementById('temporalChart')) {
      initTemporalChart();
    }
    if (document.getElementById('roleChart')) {
      initRoleChart();
    }
  }

  // Initialize Custom Builder if on builder page
  if (document.querySelector('.builder-container')) {
    window.customBuilder = new CustomBuilder();
  }

  // Initialize filter manager
  window.filterManager = new FilterManager();

  // Initialize navigation
  initNavigation();

  // Initialize membership features
  initMembershipFeatures();

  console.log('🎯 SATOR Analytics initialized');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SatorSquare, PerformanceMatrix, CustomBuilder, FilterManager };
}
