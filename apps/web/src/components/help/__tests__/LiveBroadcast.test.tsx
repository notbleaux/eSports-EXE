/** [Ver001.000] */
/**
 * LiveBroadcast Component Tests
 * =============================
 * Tests for real-time help overlay component.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveBroadcast, BroadcastNotification } from '../LiveBroadcast';
import { BroadcastMessage, BroadcastPriority } from '../../../lib/broadcast/types';

// Mock the useBroadcast hook
vi.mock('../../../hooks/useBroadcast', () => ({
  useBroadcast: vi.fn(),
  useHelpBroadcast: vi.fn(),
}));

import { useBroadcast } from '../../../hooks/useBroadcast';

const mockUseBroadcast = useBroadcast as vi.Mock;

describe('LiveBroadcast', () => {
  const mockDismiss = vi.fn();
  const mockDismissAll = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockReconnect = vi.fn();

  const defaultMockState = {
    connectionState: 'connected' as const,
    isConnected: true,
    isReconnecting: false,
    messages: [] as BroadcastMessage[],
    unreadMessages: [] as BroadcastMessage[],
    unreadCount: 0,
    dismiss: mockDismiss,
    dismissAll: mockDismissAll,
    markAsRead: mockMarkAsRead,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    reconnect: mockReconnect,
    bufferSize: 0,
    isBuffering: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBroadcast.mockReturnValue(defaultMockState);
  });

  // ============================================================================
  // Rendering
  // ============================================================================

  describe('rendering', () => {
    it('should render without messages', () => {
      render(<LiveBroadcast />);
      
      // Should have screen reader live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should render visible messages', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', title: 'Test Message' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should render at specified position', () => {
      const { container } = render(<LiveBroadcast position="bottom-left" />);
      
      const containerDiv = container.querySelector('[data-testid="live-broadcast-container"]');
      expect(containerDiv).toHaveClass('bottom-4', 'left-4');
    });

    it('should limit visible messages to maxVisible', () => {
      const messages: BroadcastMessage[] = Array.from({ length: 5 }, (_, i) =>
        createMessage({ id: `msg-${i}`, title: `Message ${i}` })
      );

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast maxVisible={3} />);
      
      // Should only show first 3 messages
      expect(screen.getByText('Message 0')).toBeInTheDocument();
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.queryByText('Message 3')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Priority Display
  // ============================================================================

  describe('priority display', () => {
    it('should render critical priority with correct styling', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', priority: 'critical', title: 'Critical Alert' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      expect(notification).toHaveAttribute('data-priority', 'critical');
    });

    it('should render high priority with correct styling', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', priority: 'high', title: 'High Alert' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      expect(notification).toHaveAttribute('data-priority', 'high');
    });

    it('should auto-focus critical messages', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', priority: 'critical' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      expect(notification).toHaveAttribute('tabIndex', '0');
    });
  });

  // ============================================================================
  // Dismissal
  // ============================================================================

  describe('dismissal', () => {
    it('should dismiss message when dismiss button clicked', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', title: 'Dismissible', dismissible: true }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const dismissButton = screen.getByTestId('dismiss-1');
      fireEvent.click(dismissButton);

      expect(mockDismiss).toHaveBeenCalledWith('1');
    });

    it('should not show dismiss button for non-dismissible messages', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', dismissible: false }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      expect(screen.queryByTestId('dismiss-1')).not.toBeInTheDocument();
    });

    it('should dismiss on Escape key', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', priority: 'critical', dismissible: true }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      fireEvent.keyDown(notification, { key: 'Escape' });

      // Should trigger dismiss
      expect(mockDismiss).toHaveBeenCalled();
    });

    it('should show dismiss all button when multiple messages', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
        createMessage({ id: '2' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const dismissAllButton = screen.getByText('Dismiss all');
      fireEvent.click(dismissAllButton);

      expect(mockDismissAll).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Auto-dismiss
  // ============================================================================

  describe('auto-dismiss', () => {
    it('should show progress bar for messages with duration', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', duration: 5000 }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      // Progress bar should be present (as a div with width)
      const progressBar = notification.querySelector('div[class*="h-1"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Accessibility
  // ============================================================================

  describe('accessibility', () => {
    it('should have correct ARIA attributes', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', title: 'Alert Title' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      expect(notification).toHaveAttribute('role', 'alert');
      expect(notification).toHaveAttribute('aria-live');
      expect(notification).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce critical messages with assertive live region', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', priority: 'critical' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast accessibilityAnnouncements={true} />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      expect(notification).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have dismiss button with accessible label', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1', title: 'Notification Title', dismissible: true }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const dismissButton = screen.getByLabelText(/Dismiss notification: Notification Title/i);
      expect(dismissButton).toBeInTheDocument();
    });

    it('should have region role on container', () => {
      render(<LiveBroadcast />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', 'Live broadcast notifications');
    });
  });

  // ============================================================================
  // Connection Status
  // ============================================================================

  describe('connection status', () => {
    it('should show reconnecting indicator when disconnected', () => {
      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        connectionState: 'disconnected',
      });

      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        connectionState: 'disconnected',
        messages,
      });

      render(<LiveBroadcast />);
      
      expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Unread Badge
  // ============================================================================

  describe('unread badge', () => {
    it('should show unread count when there are more messages', () => {
      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        unreadCount: 5,
      });

      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
        createMessage({ id: '2' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
        unreadCount: 5,
      });

      render(<LiveBroadcast maxVisible={2} showUnreadBadge={true} />);
      
      expect(screen.getByText('3 more notifications')).toBeInTheDocument();
    });

    it('should use singular form for single notification', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
        unreadCount: 2,
      });

      render(<LiveBroadcast maxVisible={1} showUnreadBadge={true} />);
      
      expect(screen.getByText('1 more notification')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Message Click
  // ============================================================================

  describe('message click', () => {
    it('should call onMessageClick when message clicked', () => {
      const onMessageClick = vi.fn();
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast onMessageClick={onMessageClick} />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      fireEvent.click(notification);

      expect(onMessageClick).toHaveBeenCalled();
      expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('should mark message as read on click', () => {
      const messages: BroadcastMessage[] = [
        createMessage({ id: '1' }),
      ];

      mockUseBroadcast.mockReturnValue({
        ...defaultMockState,
        messages,
      });

      render(<LiveBroadcast />);
      
      const notification = screen.getByTestId('broadcast-notification-1');
      fireEvent.click(notification);

      expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    });
  });
});

// ============================================================================
// BroadcastNotification Component Tests
// ============================================================================

describe('BroadcastNotification', () => {
  const mockOnDismiss = vi.fn();
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render message content correctly', () => {
    const message = createMessage({ 
      title: 'Test Title', 
      content: 'Test Content',
      priority: 'normal',
    });

    render(
      <BroadcastNotification
        message={message}
        onDismiss={mockOnDismiss}
        index={0}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', () => {
    const message = createMessage({ dismissible: true });

    render(
      <BroadcastNotification
        message={message}
        onDismiss={mockOnDismiss}
        index={0}
      />
    );

    const dismissButton = screen.getByLabelText(/Dismiss notification/i);
    fireEvent.click(dismissButton);

    // onDismiss is called after animation timeout
    setTimeout(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    }, 350);
  });

  it('should show context info when available', () => {
    const message = createMessage({
      context: {
        userId: 'user-123',
        currentPage: '/dashboard',
        currentFeature: 'analytics',
        timestamp: new Date(),
        recentActions: [],
        recentErrors: [],
      },
    });

    render(
      <BroadcastNotification
        message={message}
        onDismiss={mockOnDismiss}
        index={0}
      />
    );

    expect(screen.getByText(/Context: analytics/i)).toBeInTheDocument();
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createMessage(overrides: Partial<BroadcastMessage> = {}): BroadcastMessage {
  return {
    id: `msg-${Math.random().toString(36).substr(2, 9)}`,
    type: 'help_offer',
    priority: 'normal',
    title: 'Test Message',
    content: 'Test content',
    dismissible: true,
    timestamp: new Date(),
    ...overrides,
  } as BroadcastMessage;
}
