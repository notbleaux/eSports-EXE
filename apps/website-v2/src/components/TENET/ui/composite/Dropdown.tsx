/** [Ver001.000] */
/**
 * Dropdown Component
 * ==================
 * Menu that appears on trigger interaction.
 */

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DropdownContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a Dropdown');
  }
  return context;
};

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  className?: string;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      children,
      placement = 'bottom',
      isOpen: controlledIsOpen,
      onOpen,
      onClose,
      className = '',
    },
    ref
  ) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
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

    const toggle = useCallback(() => {
      if (isOpen) {
        close();
      } else {
        open();
      }
    }, [isOpen, open, close]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
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
    }, [isOpen, close]);

    return (
      <DropdownContext.Provider
        value={{ isOpen, open, close, toggle, triggerRef: triggerRef as React.RefObject<HTMLElement>, placement }}
      >
        <div ref={ref} className={`relative inline-block ${className}`}>
          <div ref={triggerRef} onClick={toggle}>
            {trigger}
          </div>
          {isOpen && children}
        </div>
      </DropdownContext.Provider>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export interface DropdownItemProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isDisabled?: boolean;
  className?: string;
}

export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ onClick, icon, children, isDisabled = false, className = '' }, ref) => {
    const { close } = useDropdown();

    const handleClick = () => {
      if (!isDisabled) {
        onClick?.();
        close();
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          flex w-full items-center px-4 py-2 text-sm
          text-gray-700 dark:text-gray-300
          ${isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
          }
          transition-colors duration-150
          ${className}
        `}
      >
        {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ children, className = '' }, ref) => {
    const { triggerRef, placement } = useDropdown();
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (triggerRef.current && menuRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
          case 'bottom':
            top = triggerRect.bottom + 4;
            left = triggerRect.left;
            break;
          case 'top':
            top = triggerRect.top - menuRect.height - 4;
            left = triggerRect.left;
            break;
          case 'left':
            top = triggerRect.top;
            left = triggerRect.left - menuRect.width - 4;
            break;
          case 'right':
            top = triggerRect.top;
            left = triggerRect.right + 4;
            break;
        }

        // Boundary check
        if (left + menuRect.width > window.innerWidth) {
          left = window.innerWidth - menuRect.width - 8;
        }
        if (top + menuRect.height > window.innerHeight) {
          top = triggerRect.top - menuRect.height - 4;
        }

        setPosition({ top, left });
      }
    }, [triggerRef, placement]);

    return createPortal(
      <div
        ref={(el) => {
          (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}
        className={`
          fixed z-[1000] min-w-[12rem] py-1
          bg-white dark:bg-gray-900
          rounded-lg shadow-lg ring-1 ring-black ring-opacity-5
          border border-gray-200 dark:border-gray-700
          ${className}
        `}
        style={{ top: position.top, left: position.left }}
        role="menu"
      >
        {children}
      </div>,
      document.body
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

export default Dropdown;
