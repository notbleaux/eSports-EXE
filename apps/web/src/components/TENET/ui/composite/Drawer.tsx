/** [Ver001.000] */
/**
 * Drawer Component
 * ================
 * Slide-out panel for navigation or content.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      isOpen,
      onClose,
      placement = 'right',
      size = 'md',
      children,
      header,
      footer,
      className = '',
    },
    ref
  ) => {
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      if (isOpen) {
        window.addEventListener('keydown', handleEscape);
      }

      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, onClose]);

    const sizeStyles = {
      xs: placement === 'left' || placement === 'right' ? 'w-64' : 'h-32',
      sm: placement === 'left' || placement === 'right' ? 'w-80' : 'h-48',
      md: placement === 'left' || placement === 'right' ? 'w-96' : 'h-64',
      lg: placement === 'left' || placement === 'right' ? 'w-[32rem]' : 'h-80',
      xl: placement === 'left' || placement === 'right' ? 'w-[40rem]' : 'h-96',
      full: placement === 'left' || placement === 'right' ? 'w-full' : 'h-full',
    };

    const placementStyles = {
      left: 'left-0 top-0 h-full',
      right: 'right-0 top-0 h-full',
      top: 'top-0 left-0 w-full',
      bottom: 'bottom-0 left-0 w-full',
    };

    const transformStyles = {
      left: isOpen ? 'translate-x-0' : '-translate-x-full',
      right: isOpen ? 'translate-x-0' : 'translate-x-full',
      top: isOpen ? 'translate-y-0' : '-translate-y-full',
      bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
    };

    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-[1400]">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={ref}
          className={`
            absolute
            ${placementStyles[placement]}
            ${sizeStyles[size]}
            ${transformStyles[placement]}
            bg-white dark:bg-gray-900
            shadow-2xl
            transition-transform duration-300 ease-out
            flex flex-col
            ${className}
          `}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">{header}</div>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
              aria-label="Close drawer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {footer}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }
);

Drawer.displayName = 'Drawer';

export default Drawer;
