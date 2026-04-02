// @ts-nocheck
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FantasyDraft } from '../FantasyDraft';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock UI components
vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, ...props }: any) => (
    <div data-testid="glass-card" {...props}>{children}</div>
  ),
}));

vi.mock('@/components/ui/GlowButton', () => ({
  GlowButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe('FantasyDraft', () => {
  const mockProps = {
    leagueId: 'league-123',
    teamId: 'team-456',
  };

  it('renders draft room with current pick indicator', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText('Current Pick')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('displays timer countdown', () => {
    render(<FantasyDraft {...mockProps} />);
    
    // Timer should show "30s" initially
    expect(screen.getByText('30s')).toBeInTheDocument();
  });

  it('shows available players in the pool', () => {
    render(<FantasyDraft {...mockProps} />);
    
    // Mock data includes these players
    expect(screen.getByText('TenZ')).toBeInTheDocument();
    expect(screen.getByText('aspas')).toBeInTheDocument();
    expect(screen.getByText('yay')).toBeInTheDocument();
  });

  it('allows filtering by role', () => {
    render(<FantasyDraft {...mockProps} />);
    
    const roleSelect = screen.getByDisplayValue('All Roles');
    expect(roleSelect).toBeInTheDocument();
    
    fireEvent.change(roleSelect, { target: { value: 'Duelist' } });
    expect(roleSelect).toHaveValue('Duelist');
  });

  it('allows searching players', () => {
    render(<FantasyDraft {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search players...');
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'TenZ' } });
    expect(searchInput).toHaveValue('TenZ');
  });

  it('displays player stats correctly', () => {
    render(<FantasyDraft {...mockProps} />);
    
    // Check for player stats columns - these appear in each player card
    const killsElements = screen.getAllByText('Kills');
    const deathsElements = screen.getAllByText('Deaths');
    const matchesElements = screen.getAllByText('Matches');
    
    expect(killsElements.length).toBeGreaterThanOrEqual(1);
    expect(deathsElements.length).toBeGreaterThanOrEqual(1);
    expect(matchesElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows draft log section', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText('Draft Log')).toBeInTheDocument();
  });

  it('displays pick order visualization', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText('Pick Order')).toBeInTheDocument();
    
    // Should show pick numbers 1-10
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('shows my roster section', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText(/My Roster \(/)).toBeInTheDocument();
  });

  it('indicates when it is my turn to pick', () => {
    render(<FantasyDraft {...mockProps} />);
    
    // Initial state - pick #1, my pick is #3
    // Should not show "YOUR TURN!" initially
    expect(screen.queryByText('YOUR TURN!')).not.toBeInTheDocument();
  });

  it('displays draft log section', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText('Draft Log')).toBeInTheDocument();
    expect(screen.getByText(/Draft hasn't started yet/)).toBeInTheDocument();
  });

  it('displays pick order section', () => {
    render(<FantasyDraft {...mockProps} />);
    
    expect(screen.getByText('Pick Order')).toBeInTheDocument();
  });
});
