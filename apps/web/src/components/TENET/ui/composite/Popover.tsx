/** [Ver001.000] */
/**
 * Popover Component
 * =================
 * Rich content popup triggered by user interaction.
 */

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoverContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  placement: 'top' | 'bottom' | 'left' | 'right';
  closeOnBlur: boolean;
}

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover');
  }
  return context;
};

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  closeOnBlur?: boolean;
  className?: string;
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      children,
      placement = 'bottom',
      isOpen: controlledIsOpen,
      onOpen,
      onClose,
      closeOnBlur = true,
      className = '',
    },
    ref
  ) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const open = useCallback(() => {
      if (!isControlled) setInternalIsOpen(true);
      onOpen?.();
    }, [isControlled, onOpen]);

    const close = useCallback(() => {
      if (!isControlled) setInternalIsOpen(false);
      onClose?.();
    }, [isControlled, onClose]);

    useEffect(() => {
      if (!closeOnBlur) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          popoverRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !popoverRef.current.contains(event.target as Node)
        ) {
          close();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, closeOnBlur, close]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };

      if (isOpen) {
        window.addEventListener('keydown', handleEscape);
      }

      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, close]);

    return (
      <PopoverContext.Provider
        value={{
          isOpen,
          open,
          close,
          triggerRef: triggerRef as React.RefObject<HTMLElement>,
          placement,
          closeOnBlur,
        }}
      >
        <div ref={ref} className={`relative inline-block ${className}`}>
          <div ref={triggerRef} onClick={open}>
            {trigger}
          </div>
          {isOpen && children}
        </div>
      </PopoverContext.Provider>
    );
  }
);

Popover.displayName = 'Popover';

export interface PopoverContentProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, header, footer, className = '' }, ref) => {
    const { triggerRef, placement, close } = usePopover();
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (triggerRef.current && contentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'bottom':
            top = triggerRect.bottom + 8;
            left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case 'top':
            top = triggerRect.top - contentRect.height - 8;
            left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
            break;
          case 'left':
            top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
            left = triggerRect.left - contentRect.width - 8;
            break;
          case 'right':
            top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
            left = triggerRect.right + 8;
            break;
        }

        // Boundary check
        const padding = 8;
        top = Math.max(padding, Math.min(top, window.innerHeight - contentRect.height - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - contentRect.width - padding));

        setPosition({ top, left });
      }
    }, [triggerRef, placement]);

    const arrowStyles = {
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-white dark:border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-white dark:border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
      left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-white dark:border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
      right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-white dark:border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
    };

    return createPortal(
      <div
        ref={(el) => {
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}
        className={`
          fixed z-[1500] w-64
          bg-white dark:bg-gray-800
          rounded-lg shadow-xl
          border border-gray-200 dark:border-gray-700
          ${className}
        `}
        style={{ top: position.top, left: position.left }}
        role="dialog"
      >
        {/* Arrow */}
        <div
          className={`absolute w-0 h-0 border-4 ${arrowStyles[placement]}`}
          aria-hidden="true"
        />

        {header && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {header}
          </div>
        )}

        <button
          type="button"
          onClick={close}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4">{children}</div>

        {footer && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>,
      document.body
    );
  }
);

PopoverContent.displayName = 'PopoverContent';

export default Popover;
