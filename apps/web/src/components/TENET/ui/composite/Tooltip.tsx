/** [Ver001.000] */
/**
 * Tooltip Component
 * =================
 * Informational popup on hover or focus.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  label: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  hasArrow?: boolean;
  openDelay?: number;
  closeDelay?: number;
  className?: string;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      label,
      children,
      placement = 'top',
      hasArrow = true,
      openDelay = 200,
      closeDelay = 0,
      className = '',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updatePosition = useCallback(() => {
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'top':
            top = triggerRect.top - tooltipRect.height - 8;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'bottom':
            top = triggerRect.bottom + 8;
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            break;
          case 'left':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.left - tooltipRect.width - 8;
            break;
          case 'right':
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            left = triggerRect.right + 8;
            break;
        }

        // Boundary check
        const padding = 8;
        top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
        left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

        setPosition({ top, left });
      }
    }, [placement]);

    const show = useCallback(() => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      openTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        requestAnimationFrame(updatePosition);
      }, openDelay);
    }, [openDelay, updatePosition]);

    const hide = useCallback(() => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, closeDelay);
    }, [closeDelay]);

    useEffect(() => {
      return () => {
        if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, []);

    useEffect(() => {
      if (isVisible) {
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isVisible, updatePosition]);

    const arrowStyles = {
      top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
      bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
      left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent',
      right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
    };

    const triggerElement = React.cloneElement(children, {
      ref: (el: HTMLElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLElement | null>).current = el;
        const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
        if (typeof childRef === 'function') {
          childRef(el);
        } else if (childRef) {
          (childRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      },
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
      'aria-describedby': isVisible ? 'tooltip' : undefined,
    });

    return (
      <>
        {triggerElement}
        {isVisible &&
          createPortal(
            <div
              ref={(el) => {
                (tooltipRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                if (typeof ref === 'function') {
                  ref(el);
                } else if (ref) {
                  (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
              }}
              id="tooltip"
              role="tooltip"
              className={`
                fixed z-[1800] px-2 py-1
                text-xs font-medium text-white
                bg-gray-900 dark:bg-gray-700
                rounded shadow-sm
                pointer-events-none
                ${className}
              `}
              style={{ top: position.top, left: position.left }}
            >
              {label}
              {hasArrow && (
                <span
                  className={`absolute w-0 h-0 border-4 ${arrowStyles[placement]}`}
                  aria-hidden="true"
                />
              )}
            </div>,
            document.body
          )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
