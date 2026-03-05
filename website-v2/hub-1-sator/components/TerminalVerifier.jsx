import React, { useState, useEffect, useCallback, useRef } from 'react';
import './TerminalVerifier.css';

/**
 * TerminalVerifier - ASCII Terminal Aesthetic
 * Based on Educated Guess terminal design
 * 
 * Features:
 * - SHA-256 integrity check display
 * - Typewriter text animation
 * - Command history with scrollback
 * - Blinking cursor
 * - Amber phosphor glow effect
 */

const MOCK_COMMANDS = [
  { cmd: 'verify --dataset teams', status: 'running' },
  { cmd: 'hash --algo sha256', status: 'complete' },
  { cmd: 'check --integrity all', status: 'complete' },
  { cmd: 'sync --remote origin', status: 'complete' }
];

const generateHash = () => {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const TerminalVerifier = ({ 
  dataset,
  verificationStatus,
  onVerify
}) => {
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [activeCommand, setActiveCommand] = useState(0);
  const terminalRef = useRef(null);
  const scrollRef = useRef(null);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentLine]);

  // Typewriter effect for commands
  const typeText = useCallback(async (text, delay = 30) => {
    setIsTyping(true);
    setCurrentLine('');
    
    for (let i = 0; i < text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setCurrentLine(text.substring(0, i + 1));
    }
    
    setIsTyping(false);
    return text;
  }, []);

  // Simulate verification sequence
  const runVerification = useCallback(async () => {
    setLines([]);
    setActiveCommand(0);
    
    // Initial boot message
    setLines(prev => [...prev, 
      { type: 'system', text: 'SATOR INTEGRITY VERIFIER v2.1.0' },
      { type: 'system', text: 'Initializing verification sequence...' },
      { type: 'divider' },
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (let i = 0; i < MOCK_COMMANDS.length; i++) {
      const command = MOCK_COMMANDS[i];
      setActiveCommand(i);
      
      // Type command
      await typeText(`$ ${command.cmd}`);
      setLines(prev => [...prev, { type: 'command', text: `$ ${command.cmd}` }]);
      setCurrentLine('');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate result based on command
      if (command.cmd.includes('verify')) {
        const hash = generateHash();
        setLines(prev => [...prev,
          { type: 'output', text: `Dataset: ${dataset || 'all'}` },
          { type: 'output', text: `Status: SCANNING...` },
          { type: 'progress', percent: 100 }
        ]);
        
        // Simulate progress
        for (let p = 0; p <= 100; p += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setLines(prev => {
            const newLines = [...prev];
            const progressLine = newLines.find(l => l.type === 'progress' && !l.complete);
            if (progressLine) {
              progressLine.percent = p;
              if (p === 100) progressLine.complete = true;
            }
            return newLines;
          });
        }
        
        setLines(prev => [...prev,
          { type: 'output', text: `SHA-256: ${hash}` },
          { type: 'output', text: `Result: VERIFIED ✓` },
          { type: 'empty' }
        ]);
      } else if (command.cmd.includes('hash')) {
        setLines(prev => [...prev,
          { type: 'output', text: 'Algorithm: SHA-256' },
          { type: 'output', text: 'Block size: 512 bits' },
          { type: 'output', text: 'Digest size: 256 bits' },
          { type: 'output', text: 'Rounds: 64' },
          { type: 'empty' }
        ]);
      } else if (command.cmd.includes('check')) {
        setLines(prev => [...prev,
          { type: 'output', text: 'Teams: 48 entries [OK]' },
          { type: 'output', text: 'Matches: 1,247 entries [OK]' },
          { type: 'output', text: 'Players: 3,842 entries [OK]' },
          { type: 'output', text: 'Tournaments: 156 entries [OK]' },
          { type: 'output', text: 'History: 8,921 entries [OK]' },
          { type: 'output', text: 'All datasets verified successfully.' },
          { type: 'empty' }
        ]);
      } else if (command.cmd.includes('sync')) {
        setLines(prev => [...prev,
          { type: 'output', text: 'Remote: sator://hub.njz.network' },
          { type: 'output', text: 'Sync status: UP TO DATE' },
          { type: 'output', text: 'Last sync: 2 minutes ago' },
          { type: 'output', text: 'Changes: 0 pending' },
          { type: 'empty' }
        ]);
      }
    }
    
    setLines(prev => [...prev,
      { type: 'divider' },
      { type: 'system', text: 'Verification complete. All systems nominal.' }
    ]);
    
    onVerify?.(true);
  }, [dataset, onVerify, typeText]);

  // Auto-run on mount
  useEffect(() => {
    const timer = setTimeout(runVerification, 1000);
    return () => clearTimeout(timer);
  }, [runVerification]);

  const renderLine = (line, index) => {
    switch (line.type) {
      case 'command':
        return (
          <div key={index} className="terminal-line command">
            <span className="prompt">$</span>
            <span className="command-text">{line.text.substring(2)}</span>
          </div>
        );
      case 'output':
        return (
          <div key={index} className="terminal-line output">
            <span className="output-text">{line.text}</span>
          </div>
        );
      case 'system':
        return (
          <div key={index} className="terminal-line system">
            <span className="system-text">{line.text}</span>
          </div>
        );
      case 'divider':
        return <div key={index} className="terminal-divider" />;
      case 'empty':
        return <div key={index} className="terminal-line empty" />;
      case 'progress':
        return (
          <div key={index} className="terminal-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${line.percent}%` }}
              />
            </div>
            <span className="progress-text">{line.percent}%</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="terminal-verifier" ref={terminalRef}>
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="title-icon">◈</span>
          <span className="title-text">SATOR_VERIFIER</span>
        </div>
        <div className="terminal-controls">
          <div className="control-dot red" />
          <div className="control-dot yellow" />
          <div className="control-dot green" />
        </div>
      </div>
      
      <div className="terminal-toolbar">
        <div className="toolbar-section">
          <span className="toolbar-label">DATASET:</span>
          <span className="toolbar-value">{dataset || 'ALL'}</span>
        </div>
        <div className="toolbar-section">
          <span className="toolbar-label">STATUS:</span>
          <span className={`toolbar-value status-${verificationStatus || 'pending'}`}>
            {(verificationStatus || 'PENDING').toUpperCase()}
          </span>
        </div>
        
        <button 
          className="toolbar-action"
          onClick={runVerification}
          disabled={isTyping}
        >
          {isTyping ? 'RUNNING...' : 'REVERIFY'}
        </button>
      </div>
      
      <div className="terminal-body" ref={scrollRef}>
        {lines.map((line, index) => renderLine(line, index))}
        
        {isTyping && (
          <div className="terminal-line typing">
            <span className="prompt">$</span>
            <span className="command-text">{currentLine.substring(2)}</span>
            <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>█</span>
          </div>
        )}
        
        {!isTyping && (
          <div className="terminal-line input">
            <span className="prompt">$</span>
            <span className="cursor visible">█</span>
          </div>
        )}
      </div>
      
      <div className="terminal-footer">
        <div className="footer-glyph">∿</div>
        <div className="footer-info">
          <span className="info-line">SHA-256 INTEGRITY CHECK</span>
          <span className="info-line">SECURE CONNECTION // ENCRYPTED</span>
        </div>
        <div className="footer-hash">
          {generateHash().substring(0, 16)}...
        </div>
      </div>
    </div>
  );
};

export default TerminalVerifier;
