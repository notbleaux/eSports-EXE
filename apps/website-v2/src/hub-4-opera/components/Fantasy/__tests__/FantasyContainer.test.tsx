import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FantasyContainer } from '../FantasyContainer'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

// Mock UI components
vi.mock('@/components/ui/GlassCard', () => ({
  GlassCard: ({ children, ...props }) => (
    <div role="button" tabIndex={0} {...props}>
      {children}
    </div>
  )
}))

vi.mock('@/components/ui/GlowButton', () => ({
  GlowButton: ({ children, ...props }) => (
    <button type="button" role="button" {...props}>
      {children}
    </button>
  )
}))

// Mock child components
vi.mock('../FantasyLeagues', () => ({
  FantasyLeagues: () => <div data-testid="fantasy-leagues">Fantasy Leagues</div>
}))

vi.mock('../FantasyDraft', () => ({
  FantasyDraft: ({ leagueId }) => <div data-testid="fantasy-draft">Draft Room - {leagueId}</div>
}))

vi.mock('../FantasyTeamManage', () => ({
  FantasyTeamManage: ({ teamId }) => <div data-testid="fantasy-team">Team Manager - {teamId}</div>
}))

describe('FantasyContainer', () => {
  it('renders the fantasy overview by default', () => {
    render(<FantasyContainer />)

    expect(screen.getByText('Fantasy')).toBeInTheDocument()
    expect(screen.getByText('eSports')).toBeInTheDocument()
    expect(screen.getByText(/Draft your dream team/)).toBeInTheDocument()
  })

  it('displays quick action cards', () => {
    render(<FantasyContainer />)

    expect(screen.getByText('Browse Leagues')).toBeInTheDocument()
    expect(screen.getByText('My Teams')).toBeInTheDocument()
    expect(screen.getByText('Enter Draft')).toBeInTheDocument()
  })

  it('navigates to leagues view when clicking Browse Leagues', async () => {
    const user = userEvent.setup()
    render(<FantasyContainer />)

    await user.click(screen.getByText('Browse Leagues'))

    expect(screen.getByTestId('fantasy-leagues')).toBeInTheDocument()
    expect(screen.getByText('← Back to Fantasy')).toBeInTheDocument()
  })

  it('shows scoring rules for Valorant and CS2', () => {
    render(<FantasyContainer />)

    expect(screen.getByText('Valorant Scoring')).toBeInTheDocument()
    expect(screen.getByText('CS2 Scoring')).toBeInTheDocument()

    const killElements = screen.getAllByText('Kill')
    expect(killElements.length).toBeGreaterThanOrEqual(2)

    const plusOneElements = screen.getAllByText('+1.0')
    expect(plusOneElements.length).toBeGreaterThanOrEqual(2)
  })

  it('displays how it works section with 4 steps', () => {
    render(<FantasyContainer />)

    expect(screen.getByText('How Fantasy Works')).toBeInTheDocument()
    expect(screen.getByText('Join or Create')).toBeInTheDocument()
    expect(screen.getByText('Draft Players')).toBeInTheDocument()
    expect(screen.getByText('Set Lineup')).toBeInTheDocument()
    expect(screen.getByText('Win Tokens')).toBeInTheDocument()
  })

  it('navigates back to overview from leagues view', async () => {
    const user = userEvent.setup()
    render(<FantasyContainer />)

    // Navigate to leagues
    await user.click(screen.getByText('Browse Leagues'))
    expect(screen.getByTestId('fantasy-leagues')).toBeInTheDocument()

    // Navigate back
    await user.click(screen.getByText('← Back to Fantasy'))
    expect(screen.getByText(/Draft your dream team/)).toBeInTheDocument()
  })

  it('shows my teams view with team card', async () => {
    const user = userEvent.setup()
    render(<FantasyContainer />)

    await user.click(screen.getByText('My Teams'))

    expect(screen.getByText('My Fantasy Teams')).toBeInTheDocument()
    expect(screen.getByText('Super Senstrels')).toBeInTheDocument()
    expect(screen.getByText('VCT Champions Fantasy')).toBeInTheDocument()
  })

  it('navigates to team management from teams view', async () => {
    const user = userEvent.setup()
    render(<FantasyContainer />)

    // Go to my teams
    await user.click(screen.getByText('My Teams'))

    // Click on team card
    await user.click(screen.getByText('Super Senstrels'))

    expect(screen.getByTestId('fantasy-team')).toBeInTheDocument()
  })
})
