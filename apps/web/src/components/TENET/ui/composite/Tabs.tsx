/** [Ver001.000] */
/**
 * Tabs Component
 * ==============
 * Tabbed interface for organizing content into sections.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabsContextValue {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  variant: 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
  size: 'sm' | 'md' | 'lg';
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

export interface TabsProps {
  defaultIndex?: number;
  index?: number;
  onChange?: (index: number) => void;
  variant?: 'line' | 'enclosed' | 'soft-rounded' | 'solid-rounded';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      defaultIndex = 0,
      index: controlledIndex,
      onChange,
      variant = 'line',
      size = 'md',
      children,
      className = '',
    },
    ref
  ) => {
    const isControlled = controlledIndex !== undefined;
    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const selectedIndex = isControlled ? controlledIndex : internalIndex;

    const setSelectedIndex = useCallback(
      (newIndex: number) => {
        if (!isControlled) {
          setInternalIndex(newIndex);
        }
        onChange?.(newIndex);
      },
      [isControlled, onChange]
    );

    return (
      <TabsContext.Provider value={{ selectedIndex, setSelectedIndex, variant, size }}>
        <div ref={ref} className={`w-full ${className}`}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = 'Tabs';

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(
  ({ children, className = '' }, ref) => {
    const { variant } = useTabs();

    const variantStyles = {
      line: 'border-b border-gray-200 dark:border-gray-700',
      enclosed: 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
      'soft-rounded': 'gap-1',
      'solid-rounded': 'gap-1',
    };

    return (
      <div
        ref={ref}
        className={`flex ${variantStyles[variant]} ${className}`}
        role="tablist"
      >
        {children}
      </div>
    );
  }
);

TabList.displayName = 'TabList';

export interface TabProps {
  children: React.ReactNode;
  isDisabled?: boolean;
  className?: string;
}

interface TabInternalProps extends TabProps {
  _index: number;
}

const TabInternal = React.forwardRef<HTMLButtonElement, TabInternalProps>(
  ({ children, isDisabled = false, _index, className = '' }, ref) => {
    const { selectedIndex, setSelectedIndex, variant, size } = useTabs();
    const isSelected = selectedIndex === _index;

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const variantStyles = {
      line: `
        border-b-2 font-medium
        ${isSelected
          ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }
      `,
      enclosed: `
        rounded-md font-medium
        ${isSelected
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
          : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
        }
      `,
      'soft-rounded': `
        rounded-lg font-medium
        ${isSelected
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }
      `,
      'solid-rounded': `
        rounded-lg font-medium
        ${isSelected
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
        }
      `,
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        disabled={isDisabled}
        onClick={() => setSelectedIndex(_index)}
        className={`
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
);

TabInternal.displayName = 'TabInternal';

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(
  (props, ref) => {
    const [index, setIndex] = useState<number | null>(null);
    const tabRef = React.useRef<HTMLButtonElement | null>(null);

    React.useEffect(() => {
      if (tabRef.current) {
        const parent = tabRef.current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            child => child.getAttribute('role') === 'tab'
          );
          const tabIndex = siblings.indexOf(tabRef.current);
          setIndex(tabIndex);
        }
      }
    }, []);

    const setRefs = React.useCallback(
      (element: HTMLButtonElement | null) => {
        tabRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    if (index === null) {
      return <button type="button" ref={setRefs} className="hidden" />;
    }

    return <TabInternal ref={setRefs} {...props} _index={index} />;
  }
);

Tab.displayName = 'Tab';

export interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

interface TabPanelInternalProps extends TabPanelProps {
  _index: number;
}

const TabPanelInternal = React.forwardRef<HTMLDivElement, TabPanelInternalProps>(
  ({ children, _index, className = '' }, ref) => {
    const { selectedIndex } = useTabs();
    const isSelected = selectedIndex === _index;

    if (!isSelected) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={`mt-4 ${className}`}
      >
        {children}
      </div>
    );
  }
);

TabPanelInternal.displayName = 'TabPanelInternal';

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  (props, ref) => {
    const [index, setIndex] = useState<number | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (panelRef.current) {
        const parent = panelRef.current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            child => child.getAttribute('role') === 'tabpanel'
          );
          const panelIndex = siblings.indexOf(panelRef.current);
          setIndex(panelIndex);
        }
      }
    }, []);

    const setRefs = React.useCallback(
      (element: HTMLDivElement | null) => {
        panelRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    if (index === null) {
      return <div ref={setRefs} className="hidden" />;
    }

    return <TabPanelInternal ref={setRefs} {...props} _index={index} />;
  }
);

TabPanel.displayName = 'TabPanel';

export default Tabs;
