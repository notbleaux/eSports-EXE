/**
 * SATOR Square - 5x5 Latin Palindrome Grid Logic
 */

class SatorSquare {
  constructor() {
    // The SATOR Square - 5x5 Latin palindrome
    // Reads same forwards, backwards, horizontally, and vertically
    this.grid = [
      ['S', 'A', 'T', 'O', 'R'],
      ['A', 'R', 'E', 'P', 'O'],
      ['T', 'E', 'N', 'E', 'T'],
      ['O', 'P', 'E', 'R', 'A'],
      ['R', 'O', 'T', 'A', 'S']
    ];
    
    // Word meanings for tooltips
    this.wordMeanings = {
      'SATOR': 'The Sower, Creator, Father',
      'AREPO': 'Movement, Plough (mysterious word)',
      'TENET': 'He Holds, Maintains, Commands',
      'OPERA': 'Works, Cares, Efforts',
      'ROTAS': 'Wheels, Cycles, Revolutions'
    };
    
    // Individual letter meanings
    this.letterMeanings = {
      'S': 'Spiritus - Spirit',
      'A': 'Alpha - Beginning',
      'T': 'Tempus - Time',
      'O': 'Omega - End',
      'R': 'Rota - Wheel',
      'E': 'Eternus - Eternal',
      'P': 'Pater - Father',
      'N': 'Nexus - Connection'
    };
    
    this.selectedCells = [];
    this.currentWord = '';
    this.audioContext = null;
    this.init();
  }

  init() {
    this.renderGrid();
    this.setupEventListeners();
    this.initAudio();
  }

  /**
   * Render the 5x5 SATOR grid
   */
  renderGrid() {
    const gridContainer = document.getElementById('sator-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    this.grid.forEach((row, rowIndex) => {
      row.forEach((letter, colIndex) => {
        const cell = document.createElement('div');
        cell.className = 'sator-cell';
        cell.setAttribute('data-row', rowIndex);
        cell.setAttribute('data-col', colIndex);
        cell.setAttribute('data-letter', letter);
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Letter ${letter}`);
        
        // Create letter span
        const letterSpan = document.createElement('span');
        letterSpan.className = 'sator-cell__letter';
        letterSpan.textContent = letter;
        cell.appendChild(letterSpan);
        
        // Create meaning tooltip
        const meaning = this.letterMeanings[letter] || letter;
        const meaningSpan = document.createElement('span');
        meaningSpan.className = 'sator-cell__meaning';
        meaningSpan.textContent = meaning;
        cell.appendChild(meaningSpan);
        
        gridContainer.appendChild(cell);
      });
    });
  }

  /**
   * Setup event listeners for cell interactions
   */
  setupEventListeners() {
    const grid = document.getElementById('sator-grid');
    if (!grid) return;
    
    // Click/tap handlers
    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.sator-cell');
      if (cell) {
        this.handleCellClick(cell);
      }
    });
    
    // Keyboard navigation
    grid.addEventListener('keydown', (e) => {
      const cell = e.target.closest('.sator-cell');
      if (!cell) return;
      
      const row = parseInt(cell.getAttribute('data-row'));
      const col = parseInt(cell.getAttribute('data-col'));
      
      let nextCell = null;
      
      switch(e.key) {
        case 'ArrowUp':
          nextCell = this.getCell(row - 1, col);
          break;
        case 'ArrowDown':
          nextCell = this.getCell(row + 1, col);
          break;
        case 'ArrowLeft':
          nextCell = this.getCell(row, col - 1);
          break;
        case 'ArrowRight':
          nextCell = this.getCell(row, col + 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.handleCellClick(cell);
          return;
      }
      
      if (nextCell) {
        e.preventDefault();
        nextCell.focus();
      }
    });
    
    // Word detection button
    const detectBtn = document.getElementById('detect-words');
    if (detectBtn) {
      detectBtn.addEventListener('click', () => this.highlightAllWords());
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-grid');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetGrid());
    }
  }

  /**
   * Get cell by row and column
   */
  getCell(row, col) {
    if (row < 0 || row > 4 || col < 0 || col > 4) return null;
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  }

  /**
   * Handle cell click/tap
   */
  handleCellClick(cell) {
    const letter = cell.getAttribute('data-letter');
    const row = parseInt(cell.getAttribute('data-row'));
    const col = parseInt(cell.getAttribute('data-col'));
    
    // Play sound
    this.playNote(letter, row, col);
    
    // Toggle selection
    if (this.selectedCells.includes(cell)) {
      this.selectedCells = this.selectedCells.filter(c => c !== cell);
      cell.classList.remove('sator-cell--active');
    } else {
      this.selectedCells.push(cell);
      cell.classList.add('sator-cell--active');
    }
    
    // Update current word
    this.updateCurrentWord();
    
    // Check if a complete word is formed
    this.checkWordFormation(row, col);
  }

  /**
   * Update displayed current word
   */
  updateCurrentWord() {
    const wordDisplay = document.getElementById('current-word');
    if (!wordDisplay) return;
    
    const word = this.selectedCells
      .map(cell => cell.getAttribute('data-letter'))
      .join('');
    
    wordDisplay.textContent = word || '...';
    
    // Check if it's a valid SATOR word
    const upperWord = word.toUpperCase();
    if (this.wordMeanings[upperWord]) {
      wordDisplay.style.color = 'var(--sator-gold)';
      this.showWordMeaning(upperWord);
    } else {
      wordDisplay.style.color = 'var(--sator-parchment)';
    }
  }

  /**
   * Show word meaning
   */
  showWordMeaning(word) {
    const meaningDisplay = document.getElementById('word-meaning');
    if (meaningDisplay && this.wordMeanings[word]) {
      meaningDisplay.textContent = this.wordMeanings[word];
      
      // Animate in
      gsap.fromTo(meaningDisplay, 
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3 }
      );
    }
  }

  /**
   * Check if a word is formed at the given position
   */
  checkWordFormation(row, col) {
    // Check horizontal words
    for (let c = 0; c <= 4; c++) {
      const word = this.getWordAt(row, c, 0, 1);
      if (this.wordMeanings[word]) {
        this.animateWord(row, c, 0, 1, word);
      }
    }
    
    // Check vertical words
    for (let r = 0; r <= 4; r++) {
      const word = this.getWordAt(r, col, 1, 0);
      if (this.wordMeanings[word]) {
        this.animateWord(r, col, 1, 0, word);
      }
    }
  }

  /**
   * Get word starting at position with direction
   */
  getWordAt(startRow, startCol, dRow, dCol) {
    let word = '';
    for (let i = 0; i < 5; i++) {
      const r = startRow + (i * dRow);
      const c = startCol + (i * dCol);
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        word += this.grid[r][c];
      }
    }
    return word;
  }

  /**
   * Animate a discovered word
   */
  animateWord(startRow, startCol, dRow, dCol, word) {
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const cell = this.getCell(startRow + (i * dRow), startCol + (i * dCol));
      if (cell) cells.push(cell);
    }
    
    // GSAP animation
    gsap.to(cells, {
      backgroundColor: 'rgba(212, 175, 55, 0.4)',
      borderColor: 'var(--sator-gold)',
      boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)',
      duration: 0.5,
      stagger: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Save discovered word to state
        this.saveDiscoveredWord(word);
      }
    });
  }

  /**
   * Highlight all words in the grid
   */
  highlightAllWords() {
    const words = [
      { row: 0, col: 0, dRow: 0, dCol: 1, word: 'SATOR' },
      { row: 1, col: 0, dRow: 0, dCol: 1, word: 'AREPO' },
      { row: 2, col: 0, dRow: 0, dCol: 1, word: 'TENET' },
      { row: 3, col: 0, dRow: 0, dCol: 1, word: 'OPERA' },
      { row: 4, col: 0, dRow: 0, dCol: 1, word: 'ROTAS' }
    ];
    
    words.forEach((w, i) => {
      setTimeout(() => {
        this.animateWord(w.row, w.col, w.dRow, w.dCol, w.word);
      }, i * 400);
    });
  }

  /**
   * Reset the grid
   */
  resetGrid() {
    this.selectedCells.forEach(cell => {
      cell.classList.remove('sator-cell--active');
    });
    this.selectedCells = [];
    this.updateCurrentWord();
    
    const meaningDisplay = document.getElementById('word-meaning');
    if (meaningDisplay) {
      meaningDisplay.textContent = 'Select letters to discover meanings';
    }
  }

  /**
   * Save discovered word to state
   */
  saveDiscoveredWord(word) {
    if (window.StateManager) {
      const discovered = StateManager.get('hub1.discoveredWords', []);
      if (!discovered.includes(word)) {
        discovered.push(word);
        StateManager.set('hub1.discoveredWords', discovered);
        StateManager.set('hub1.satorProgress', discovered.length * 20);
      }
    }
  }

  /**
   * Initialize audio context for sound effects
   */
  initAudio() {
    // Create audio context on first user interaction
    document.addEventListener('click', () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    }, { once: true });
  }

  /**
   * Play a note based on letter and position
   */
  playNote(letter, row, col) {
    if (!this.audioContext) return;
    
    // Calculate frequency based on position (pentatonic scale)
    const baseFreq = 261.63; // Middle C
    const scale = [0, 2, 4, 7, 9]; // Pentatonic intervals
    const noteIndex = (row + col) % 5;
    const frequency = baseFreq * Math.pow(2, scale[noteIndex] / 12);
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }
}

// Initialize when DOM is ready
let satorSquare;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    satorSquare = new SatorSquare();
    window.SatorSquare = satorSquare;
  });
} else {
  satorSquare = new SatorSquare();
  window.SatorSquare = satorSquare;
}
