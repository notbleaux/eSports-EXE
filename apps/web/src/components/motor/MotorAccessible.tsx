/**
 * [Ver001.000]
 * Motor Accessible Components
 * Large click targets, adjustable timing, visual feedback, error prevention
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useRef, 
  useEffect,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// Utility
// ============================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Types
// ============================================

export interface MotorConfig {
  /** Minimum touch target size in pixels */
  minTouchTargetSize: number;
  /** Enable large click targets */
  largeTargets: boolean;
  /** Timing multiplier for all animations */
  timingMultiplier: number;
  /** Enable visual feedback */
  visualFeedback: boolean;
  /** Enable haptic feedback */
  hapticFeedback: boolean;
  /** Enable error prevention */
  errorPrevention: boolean;
  /** Confirmation delay for destructive actions (ms) */
  confirmationDelay: number;
  /** Enable sticky hover */
  stickyHover: boolean;
  /** Enable gesture alternatives */
  gestureAlternatives: boolean;
}

export interface MotorContextValue {
  config: MotorConfig;
  updateConfig: (config: Partial<MotorConfig>) => void;
  isMotorImpaired: boolean;
  setMotorImpaired: (value: boolean) => void;
}

// ============================================
// Context
// ============================================

const defaultConfig: MotorConfig = {
  minTouchTargetSize: 48,
  largeTargets: true,
  timingMultiplier: 1.5,
  visualFeedback: true,
  hapticFeedback: true,
  errorPrevention: true,
  confirmationDelay: 2000,
  stickyHover: true,
  gestureAlternatives: true,
};

const MotorContext = createContext<MotorContextValue>({
  config: defaultConfig,
  updateConfig: () => {},
  isMotorImpaired: false,
  setMotorImpaired: () => {},
});

export const useMotor = () => useContext(MotorContext);

// ============================================
// Provider
// ============================================

export interface MotorProviderProps {
  children: ReactNode;
  initialConfig?: Partial<MotorConfig>;
}

export function MotorProvider({ children, initialConfig }: MotorProviderProps) {
  const [config, setConfig] = useState<MotorConfig>({ ...defaultConfig, ...initialConfig });
  const [isMotorImpaired, setMotorImpaired] = useState(false);

  const updateConfig = useCallback((newConfig: Partial<MotorConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <MotorContext.Provider value={{ config, updateConfig, isMotorImpaired, setMotorImpaired }}>
      {children}
    </MotorContext.Provider>
  );
}

// ============================================
// Large Click Target Button
// ============================================

export interface MotorButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size variant */
  size?: 'default' | 'large' | 'xl';
  /** Enable double confirmation for destructive actions */
  requireConfirmation?: boolean;
  /** Confirmation message */
  confirmationMessage?: string;
  /** Visual feedback style */
  feedbackStyle?: 'pulse' | 'scale' | 'glow';
  /** Extended touch target area */
  extendedTouchTarget?: boolean;
}

export function MotorButton({
  children,
  className,
  size = 'default',
  requireConfirmation = false,
  confirmationMessage = 'Hold to confirm',
  feedbackStyle = 'scale',
  extendedTouchTarget = false,
  onClick,
  disabled,
  ...props
}: MotorButtonProps) {
  const { config } = useMotor();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmProgress, setConfirmProgress] = useState(0);
  const confirmTimer = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Clear confirmation on unmount
  useEffect(() => {
    return () => {
      if (confirmTimer.current) {
        clearInterval(confirmTimer.current);
      }
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (requireConfirmation && config.errorPrevention) {
        if (!isConfirming) {
          setIsConfirming(true);
          setConfirmProgress(0);

          // Start confirmation progress
          const startTime = Date.now();
          confirmTimer.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / config.confirmationDelay, 1);
            setConfirmProgress(progress);

            if (progress >= 1) {
              if (confirmTimer.current) {
                clearInterval(confirmTimer.current);
              }
              setIsConfirming(false);
              setConfirmProgress(0);
              onClick?.(e);
            }
          }, 16);

          // Haptic feedback
          if (config.hapticFeedback && navigator.vibrate) {
            navigator.vibrate(50);
          }

          return;
        }
      } else {
        onClick?.(e);
      }
    },
    [disabled, requireConfirmation, config.errorPrevention, config.confirmationDelay, config.hapticFeedback, isConfirming, onClick]
  );

  const handleMouseLeave = useCallback(() => {
    if (isConfirming && confirmTimer.current) {
      clearInterval(confirmTimer.current);
      setIsConfirming(false);
      setConfirmProgress(0);
    }
  }, [isConfirming]);

  const sizeClasses = {
    default: cn(
      'px-4 py-2 min-w-[48px] min-h-[48px]',
      config.largeTargets && 'px-6 py-3 min-w-[64px] min-h-[64px]'
    ),
    large: 'px-6 py-4 min-w-[64px] min-h-[64px]',
    xl: 'px-8 py-6 min-w-[80px] min-h-[80px] text-lg',
  };

  const feedbackClasses = {
    pulse: 'active:animate-pulse',
    scale: 'active:scale-95 transition-transform',
    glow: 'active:ring-4 active:ring-primary/50 transition-shadow',
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'rounded-lg font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        
        // Size
        sizeClasses[size],
        
        // Feedback
        config.visualFeedback && feedbackClasses[feedbackStyle],
        
        // Extended touch target
        extendedTouchTarget && 'after:absolute after:inset-[-12px]',
        
        className
      )}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      onTouchCancel={handleMouseLeave}
      disabled={disabled}
      data-motor-button
      data-confirming={isConfirming}
      {...props}
    >
      {/* Confirmation progress overlay */}
      {isConfirming && (
        <span
          className="absolute inset-0 bg-primary/20 rounded-lg transition-all"
          style={{ 
            clipPath: `inset(0 ${100 - confirmProgress * 100}% 0 0)`,
            transitionDuration: `${config.timingMultiplier * 100}ms`,
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {isConfirming ? confirmationMessage : children}
      </span>

      {/* Visual feedback ripple */}
      {config.visualFeedback && (
        <span className="absolute inset-0 rounded-lg bg-current opacity-0 transition-opacity hover:opacity-5" />
      )}
    </button>
  );
}

// ============================================
// Accessible Slider
// ============================================

export interface MotorSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  size?: 'default' | 'large';
  className?: string;
}

export function MotorSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  size = 'default',
  className,
}: MotorSliderProps) {
  const { config } = useMotor();
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const newValue = Math.round((percentage * (max - min) + min) / step) * step;
      onChange(Math.max(min, Math.min(max, newValue)));
    },
    [min, max, step, onChange]
  );

  const percentage = ((value - min) / (max - min)) * 100;

  const sizeClasses = {
    default: cn('h-4', config.largeTargets && 'h-6'),
    large: 'h-6',
  };

  return (
    <div className={cn('w-full', className)} role="group" aria-label={label}>
      {(label || showValue) && (
        <div className="flex justify-between mb-2">
          {label && <label className="text-sm font-medium">{label}</label>}
          {showValue && (
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {value}
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className={cn(
          'relative w-full bg-muted rounded-full cursor-pointer',
          'touch-none select-none',
          sizeClasses[size]
        )}
        onClick={handleTrackClick}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          const steps: Record<string, number> = {
            ArrowLeft: -step,
            ArrowRight: step,
            ArrowDown: -step,
            ArrowUp: step,
            Home: min - value,
            End: max - value,
          };
          
          if (steps[e.key] !== undefined) {
            e.preventDefault();
            const newValue = Math.max(min, Math.min(max, value + steps[e.key]));
            onChange(newValue);
          }
        }}
      >
        {/* Fill */}
        <div
          className={cn(
            'absolute left-0 top-0 h-full bg-primary rounded-full',
            'transition-all'
          )}
          style={{ 
            width: `${percentage}%`,
            transitionDuration: `${config.timingMultiplier * 150}ms`,
          }}
        />

        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
            'bg-background border-2 border-primary rounded-full',
            'shadow-md transition-transform',
            config.largeTargets ? 'w-8 h-8' : 'w-6 h-6',
            'hover:scale-110 active:scale-95',
            isDragging && 'scale-110'
          )}
          style={{ 
            left: `${percentage}%`,
            transitionDuration: `${config.timingMultiplier * 150}ms`,
          }}
        />
      </div>

      {/* Touch target extension */}
      {config.largeTargets && (
        <div
          className="absolute inset-x-0 -inset-y-2 cursor-pointer"
          onClick={handleTrackClick}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ============================================
// Accessible Checkbox/Switch
// ============================================

export interface MotorSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'default' | 'large';
  disabled?: boolean;
}

export function MotorSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  size = 'default',
  disabled,
}: MotorSwitchProps) {
  const { config } = useMotor();
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    default: cn(
      'w-12 h-7',
      config.largeTargets && 'w-16 h-9'
    ),
    large: 'w-16 h-9',
  };

  const thumbSize = {
    default: cn(
      'w-5 h-5',
      config.largeTargets && 'w-7 h-7'
    ),
    large: 'w-7 h-7',
  };

  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Switch */}
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'border-2 border-transparent',
          checked ? 'bg-primary' : 'bg-muted',
          sizeClasses[size],
          isPressed && 'scale-95'
        )}
        style={{ transitionDuration: `${config.timingMultiplier * 200}ms` }}
        onClick={() => !disabled && onCheckedChange(!checked)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onCheckedChange(!checked);
          }
        }}
      >
        {/* Thumb */}
        <span
          className={cn(
            'bg-background rounded-full shadow-sm transition-transform',
            'pointer-events-none',
            thumbSize[size]
          )}
          style={{
            transform: checked
              ? `translateX(${config.largeTargets ? '28px' : '20px'})`
              : 'translateX(2px)',
            transitionDuration: `${config.timingMultiplier * 200}ms`,
          }}
        />
      </div>

      {/* Label */}
      {(label || description) && (
        <div className="flex flex-col gap-1">
          {label && (
            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}

// ============================================
// Error Prevention Dialog
// ============================================

export interface MotorConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function MotorConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}: MotorConfirmDialogProps) {
  const { config } = useMotor();
  const [countdown, setCountdown] = useState(3);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && config.errorPrevention) {
      setCanConfirm(false);
      setCountdown(3);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanConfirm(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCanConfirm(true);
    }
  }, [isOpen, config.errorPrevention]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div className="w-full max-w-md p-6 bg-background rounded-xl shadow-xl">
        <h2 id="dialog-title" className="text-xl font-semibold mb-2">
          {title}
        </h2>
        <p id="dialog-description" className="text-muted-foreground mb-6">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <MotorButton
            onClick={onClose}
            variant="outline"
            className="bg-secondary"
          >
            {cancelLabel}
          </MotorButton>
          
          <MotorButton
            onClick={onConfirm}
            className={cn(
              isDestructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
              !canConfirm && 'opacity-50'
            )}
            disabled={!canConfirm}
          >
            {canConfirm ? confirmLabel : `${confirmLabel} (${countdown})`}
          </MotorButton>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Motor Settings Panel
// ============================================

export function MotorSettingsPanel() {
  const { config, updateConfig, isMotorImpaired, setMotorImpaired } = useMotor();

  return (
    <div className="p-6 space-y-6 bg-card rounded-xl border">
      <div>
        <h2 className="text-xl font-semibold mb-4">Motor Accessibility Settings</h2>
        <p className="text-muted-foreground text-sm">
          Customize interaction settings for improved motor control accessibility.
        </p>
      </div>

      {/* Enable motor accessibility */}
      <MotorSwitch
        checked={isMotorImpaired}
        onCheckedChange={setMotorImpaired}
        label="Enable Motor Accessibility Features"
        description="Increases touch targets and adjusts timing"
      />

      <hr className="border-border" />

      {/* Large targets */}
      <MotorSwitch
        checked={config.largeTargets}
        onCheckedChange={(checked) => updateConfig({ largeTargets: checked })}
        label="Large Touch Targets"
        description="Minimum 48x48 pixel touch targets"
      />

      {/* Visual feedback */}
      <MotorSwitch
        checked={config.visualFeedback}
        onCheckedChange={(checked) => updateConfig({ visualFeedback: checked })}
        label="Enhanced Visual Feedback"
        description="Additional visual cues for interactions"
      />

      {/* Haptic feedback */}
      <MotorSwitch
        checked={config.hapticFeedback}
        onCheckedChange={(checked) => updateConfig({ hapticFeedback: checked })}
        label="Haptic Feedback"
        description="Vibration feedback on supported devices"
      />

      {/* Error prevention */}
      <MotorSwitch
        checked={config.errorPrevention}
        onCheckedChange={(checked) => updateConfig({ errorPrevention: checked })}
        label="Error Prevention"
        description="Require confirmation for destructive actions"
      />

      {/* Timing multiplier */}
      <div>
        <MotorSlider
          label="Animation Speed"
          value={config.timingMultiplier}
          onChange={(value) => updateConfig({ timingMultiplier: value })}
          min={0.5}
          max={3}
          step={0.1}
          showValue
        />
        <p className="text-xs text-muted-foreground mt-1">
          Adjust animation timing (0.5x - 3x)
        </p>
      </div>

      {/* Confirmation delay */}
      {config.errorPrevention && (
        <div>
          <MotorSlider
            label="Confirmation Delay"
            value={config.confirmationDelay / 1000}
            onChange={(value) => updateConfig({ confirmationDelay: value * 1000 })}
            min={0.5}
            max={5}
            step={0.5}
            showValue
          />
          <p className="text-xs text-muted-foreground mt-1">
            Hold time for confirmation (seconds)
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Motor Accessible Container
// ============================================

export interface MotorAccessibleProps {
  children: ReactNode;
  className?: string;
}

export function MotorAccessible({ children, className }: MotorAccessibleProps) {
  const { config, isMotorImpaired } = useMotor();

  const styles: CSSProperties = {
    '--motor-timing-multiplier': config.timingMultiplier,
    '--motor-min-touch-size': `${config.minTouchTargetSize}px`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        'motor-accessible',
        isMotorImpaired && 'motor-impaired-mode',
        className
      )}
      style={styles}
      data-motor-mode={isMotorImpaired ? 'enabled' : 'disabled'}
    >
      {children}
    </div>
  );
}

export default MotorAccessible;
