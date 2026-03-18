import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OperaHub from '../index'

// Mock dependencies
vi.mock('../hooks/useOperaData', () => ({
  useOperaData: vi.fn(() => ({
    tournaments: [],
    schedules: [],
    patches: [],
    standings: [],
    loading: { tournaments: false, schedules: false, patches: false, standings: false },
    error: null,
    refreshTournaments: vi.fn(),
    refreshPatches: vi.fn(),
    refreshStandings: vi.fn(),
    theme: 'dark'
  }))
}))

vi.mock('@/shared/components/HubWrapper', () => ({
  HubWrapper: ({ children }) => <div>{children}</div>,
  HubStatCard: ({ label, value }) => (
    <div>
      {label}: {value}
    </div>
  )
}))

vi.mock('@/shared/store/njzStore', () => ({
  useNJZStore: vi.fn(() => ({
    addNotification: vi.fn()
  })),
  useHubState: vi.fn(() => ({
    setState: vi.fn()
  }))
}))

vi.mock('./components/TournamentBrowser', () => ({
  TournamentBrowser: () => <div data-testid="tournament-browser">Tournaments</div>
}))

vi.mock('./components/ScheduleViewer', () => ({
  ScheduleViewer: () => <div data-testid="schedule-viewer">Schedules</div>
}))

vi.mock('./components/CircuitStandings', () => ({
  CircuitStandings: () => <div data-testid="circuit-standings">Standings</div>
}))

vi.mock('./components/PatchNotesReader', () => ({
  PatchNotesReader: () => <div data-testid="patch-notes">Patches</div>
}))

vi.mock('./components/Fantasy', () => ({
  FantasyContainer: () => <div data-testid="fantasy-container">Fantasy</div>
}))

describe('OperaHub', () => {
  it('renders overview tab by default', () => {
    render(<OperaHub />)

    expect(screen.getByText(/OPERA eSports Hub/i)).toBeInTheDocument()
    expect(screen.getByText('Active Tournaments')).toBeInTheDocument()
    expect(screen.getByTestId('tournament-browser')).toBeInTheDocument()
  })

  it('renders tabs correctly', () => {
    render(<OperaHub />)

    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Standings')).toBeInTheDocument()
    expect(screen.getByText('Patches')).toBeInTheDocument()
    expect(screen.getByText('Fantasy')).toBeInTheDocument()
  })

  it('renders fantasy tab content', () => {
    render(<OperaHub />)

    expect(screen.getByTestId('fantasy-container')).toBeInTheDocument()
  })
})
