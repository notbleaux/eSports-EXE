/** [Ver001.000] */
/**
 * Breadcrumb Component
 * ====================
 * Navigation aid showing the user's current location.
 */

import React from 'react';

export interface BreadcrumbProps {
  separator?: React.ReactNode;
  spacing?: string;
  children: React.ReactNode;
  className?: string;
}

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator = '/', spacing = 'gap-2', children, className = '' }, ref) => {
    const validChildren = React.Children.toArray(children).filter(
      child => React.isValidElement(child) && (child.type === BreadcrumbItem || child.type === BreadcrumbLink)
    );

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={`${className}`}
      >
        <ol className={`flex items-center flex-wrap ${spacing}`}>
          {validChildren.map((child, index) => (
            <li key={index} className="flex items-center">
              {child}
              {index < validChildren.length - 1 && (
                <span
                  className="mx-2 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = 'Breadcrumb';

export interface BreadcrumbItemProps {
  isCurrentPage?: boolean;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export const BreadcrumbItem = React.forwardRef<HTMLSpanElement | HTMLAnchorElement, BreadcrumbItemProps>(
  ({ isCurrentPage = false, href, children, className = '' }, ref) => {
    const baseStyles = 'text-sm font-medium transition-colors duration-200';
    
    if (isCurrentPage) {
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          aria-current="page"
          className={`${baseStyles} text-gray-900 dark:text-gray-100 ${className}`}
        >
          {children}
        </span>
      );
    }

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={`${baseStyles} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${className}`}
      >
        {children}
      </a>
    );
  }
);

BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ href, children, className = '' }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={`text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200 ${className}`}
      >
        {children}
      </a>
    );
  }
);

BreadcrumbLink.displayName = 'BreadcrumbLink';

export default Breadcrumb;
