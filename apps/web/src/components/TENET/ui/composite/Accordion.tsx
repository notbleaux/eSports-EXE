/** [Ver001.000] */
/**
 * Accordion Component
 * ===================
 * Collapsible content panels for organizing information.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AccordionContextValue {
  expandedItems: Set<number>;
  toggleItem: (index: number) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
};

export interface AccordionProps {
  allowMultiple?: boolean;
  defaultIndex?: number | number[];
  children: React.ReactNode;
  className?: string;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ allowMultiple = false, defaultIndex, children, className = '' }, ref) => {
    const getInitialExpanded = useCallback(() => {
      if (defaultIndex === undefined) return new Set<number>();
      if (typeof defaultIndex === 'number') return new Set([defaultIndex]);
      return new Set(defaultIndex);
    }, [defaultIndex]);

    const [expandedItems, setExpandedItems] = useState<Set<number>>(getInitialExpanded);

    const toggleItem = useCallback((index: number) => {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          if (!allowMultiple) {
            newSet.clear();
          }
          newSet.add(index);
        }
        return newSet;
      });
    }, [allowMultiple]);

    return (
      <AccordionContext.Provider value={{ expandedItems, toggleItem, allowMultiple }}>
        <div ref={ref} className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isDisabled?: boolean;
  index?: number;
}

interface AccordionItemInternalProps extends AccordionItemProps {
  _index: number;
}

const AccordionItemInternal = React.forwardRef<HTMLDivElement, AccordionItemInternalProps>(
  ({ title, children, isDisabled = false, _index }, ref) => {
    const { expandedItems, toggleItem } = useAccordion();
    const isExpanded = expandedItems.has(_index);

    const handleClick = () => {
      if (!isDisabled) {
        toggleItem(_index);
      }
    };

    return (
      <div ref={ref} className="py-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          className={`
            flex w-full items-center justify-between py-2 text-left
            text-sm font-medium text-gray-900 dark:text-gray-100
            ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:text-primary-600 dark:hover:text-primary-400'}
            transition-colors duration-200
          `}
          aria-expanded={isExpanded}
        >
          <span>{title}</span>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400 pb-2">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

AccordionItemInternal.displayName = 'AccordionItemInternal';

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  (props, ref) => {
    const [index, setIndex] = useState<number | null>(null);
    const accordionRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (accordionRef.current) {
        const parent = accordionRef.current.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const itemIndex = siblings.indexOf(accordionRef.current);
          setIndex(itemIndex);
        }
      }
    }, []);

    const setRefs = React.useCallback(
      (element: HTMLDivElement | null) => {
        accordionRef.current = element;
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    if (index === null) {
      return <div ref={setRefs} />;
    }

    return <AccordionItemInternal ref={setRefs} {...props} _index={index} />;
  }
);

AccordionItem.displayName = 'AccordionItem';

export default Accordion;
