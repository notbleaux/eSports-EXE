/**
 * HawkMascotContainer Component
 * 
 * A comprehensive container component for the Hawk mascot that includes
 * text, badges, loading states, and layout options.
 * 
 * @example
 * <HawkMascotContainer 
 *   size="lg" 
 *   title="Victory!" 
 *   subtitle="Team Hawk wins"
 *   variant="victory"
 * />
 */

import React from 'react';
import { HawkMascot, HawkMascotProps, HawkSize, HawkVariant } from './HawkMascot';
import '../../styles/mascot/hawk.css';

export type ContainerLayout = 'vertical' | 'horizontal' | 'centered';
export type BadgeStyle = 'default' | 'gold' | 'outline' | 'outline-gold';

export interface HawkMascotContainerProps {
  /** Size of the mascot */
  size?: HawkSize;
  /** Container layout direction */
  layout?: ContainerLayout;
  /** Main title text */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Badge text */
  badge?: string;
  /** Badge style variant */
  badgeStyle?: BadgeStyle;
  /** Visual variant */
  variant?: HawkVariant;
  /** Enable hover effects */
  hoverable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Background pattern */
  background?: 'none' | 'pattern' | 'gradient' | 'radial';
  /** Additional CSS classes */
  className?: string;
  /** Container inline styles */
  style?: React.CSSProperties;
  /** Click handler for the mascot */
  onMascotClick?: () => void;
  /** Click handler for the container */
  onClick?: () => void;
  /** Children to render below the content */
  children?: React.ReactNode;
  /** Custom content to render instead of default */
  customContent?: React.ReactNode;
}

/**
 * HawkMascotContainer Component
 * 
 * A full-featured container for displaying the Hawk mascot with
 * accompanying text, badges, and various layout options.
 */
export const HawkMascotContainer: React.FC<HawkMascotContainerProps> = ({
  size = 'md',
  layout = 'vertical',
  title,
  subtitle,
  badge,
  badgeStyle = 'default',
  variant = 'default',
  hoverable = true,
  loading = false,
  background = 'none',
  className = '',
  style,
  onMascotClick,
  onClick,
  children,
  customContent,
}) => {
  // Determine animation based on variant
  const getAnimation = (): HawkMascotProps['animate'] => {
    if (loading) return 'pulse';
    if (variant === 'victory') return 'bounce';
    if (variant === 'team') return 'float';
    return 'none';
  };

  // Build container classes
  const containerClasses = [
    'hawk-container',
    layout === 'centered' && 'hawk-container--centered',
    layout !== 'centered' && `hawk-container--${layout}`,
    (title || subtitle || badge) && 'hawk-container--with-text',
    background !== 'none' && `hawk-bg-${background}`,
    className,
  ].filter(Boolean).join(' ');

  // Build badge classes
  const badgeClasses = [
    'hawk-badge',
    badgeStyle !== 'default' && `hawk-badge--${badgeStyle}`,
  ].filter(Boolean).join(' ');

  // Text size based on mascot size
  const getTextSize = (): string => {
    switch (size) {
      case 'xs': return 'xs';
      case 'sm': return 'sm';
      case 'md': return 'md';
      case 'lg': return 'lg';
      case 'xl': return 'xl';
      default: return 'md';
    }
  };

  const textSize = getTextSize();

  // Loading state content
  if (loading) {
    return (
      <div className={`${containerClasses} hawk-loader-container`} style={style}>
        <div className="hawk-loader">
          <div className="hawk-loader__ring" />
          <div className="hawk-loader__ring hawk-loader__ring--secondary" />
          <div className="hawk-loader__icon" />
        </div>
        {title && (
          <span className={`hawk-text hawk-text--${textSize}`}>
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={containerClasses} 
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Mascot */}
      <HawkMascot
        size={size}
        variant={variant}
        animate={getAnimation()}
        hoverable={hoverable}
        onClick={onMascotClick}
      />

      {/* Content */}
      {customContent ? (
        customContent
      ) : (
        <div className="hawk-container__content">
          {/* Badge */}
          {badge && (
            <span className={badgeClasses}>{badge}</span>
          )}
          
          {/* Title */}
          {title && (
            <h3 className={`hawk-text hawk-text--${textSize} hawk-text--gradient`}>
              {title}
            </h3>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className={`hawk-text hawk-text--${textSize === 'xs' ? 'xs' : 'sm'} hawk-text--gold`}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Additional children */}
      {children}
    </div>
  );
};

export default HawkMascotContainer;

/**
 * Pre-configured layout variants
 */

interface PresetProps extends Omit<HawkMascotContainerProps, 'layout'> {}

export const VerticalHawkContainer: React.FC<PresetProps> = (props) => (
  <HawkMascotContainer {...props} layout="vertical" />
);

export const HorizontalHawkContainer: React.FC<PresetProps> = (props) => (
  <HawkMascotContainer {...props} layout="horizontal" />
);

export const CenteredHawkContainer: React.FC<PresetProps> = (props) => (
  <HawkMascotContainer {...props} layout="centered" />
);

/**
 * Pre-configured use case variants
 */

export const HawkVictoryBanner: React.FC<Omit<PresetProps, 'variant' | 'size'>> = (props) => (
  <HawkMascotContainer 
    {...props} 
    size="lg" 
    variant="victory" 
    badge="🏆 VICTORY"
    badgeStyle="gold"
    background="gradient"
  />
);

export const HawkTeamBadge: React.FC<Omit<PresetProps, 'variant' | 'size'>> = (props) => (
  <HawkMascotContainer 
    {...props} 
    size="sm" 
    variant="team" 
    layout="horizontal"
    badge="TEAM"
  />
);

export const HawkLoadingState: React.FC<Omit<PresetProps, 'loading'>> = (props) => (
  <HawkMascotContainer 
    {...props} 
    loading={true}
    title="Loading..."
    size="md"
  />
);

export const HawkEmptyState: React.FC<PresetProps> = (props) => (
  <HawkMascotContainer 
    {...props} 
    size="lg"
    variant="default"
    background="pattern"
    title={props.title || "Nothing here yet"}
    subtitle={props.subtitle || "The hawk is hunting for content"}
  />
);

export const HawkErrorState: React.FC<PresetProps> = (props) => (
  <HawkMascotContainer 
    {...props} 
    size="lg"
    variant="intense"
    background="radial"
    title={props.title || "Something went wrong"}
    subtitle={props.subtitle || "The hawk spotted an error"}
    badge="⚠ ERROR"
    badgeStyle="outline"
  />
);

/**
 * Hawk Score Display Component
 * Displays the mascot with a score or stat value
 */
export interface HawkScoreDisplayProps {
  score: number | string;
  label?: string;
  size?: HawkSize;
  highlight?: boolean;
  className?: string;
}

export const HawkScoreDisplay: React.FC<HawkScoreDisplayProps> = ({
  score,
  label,
  size = 'md',
  highlight = false,
  className = '',
}) => {
  return (
    <HawkMascotContainer
      size={size}
      layout="vertical"
      variant={highlight ? 'victory' : 'gold'}
      className={className}
      customContent={
        <div className="hawk-score-display">
          <span className="hawk-score-display__value">{score}</span>
          {label && <span className="hawk-score-display__label">{label}</span>}
        </div>
      }
    />
  );
};

/**
 * Hawk Notification Component
 * Displays the mascot with a notification dot/count
 */
export interface HawkNotificationProps {
  count?: number;
  size?: HawkSize;
  onClick?: () => void;
  className?: string;
}

export const HawkNotification: React.FC<HawkNotificationProps> = ({
  count,
  size = 'sm',
  onClick,
  className = '',
}) => {
  return (
    <div className={`hawk-notification ${className}`} onClick={onClick}>
      <HawkMascot size={size} variant="intense" hoverable animate="pulse" />
      {count !== undefined && count > 0 && (
        <span className="hawk-notification__badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};
