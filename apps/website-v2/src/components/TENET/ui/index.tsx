/** [Ver001.001] */
/**
 * TENET UI Library
 * ================
 * 50-component design system for cross-hub UI consistency.
 */

// Primitives (15)
export {
  Button,
  Input,
  Badge,
  Avatar,
  AvatarBadge,
  AvatarGroup,
  Spinner,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  type ButtonProps,
  type InputProps,
  type BadgeProps,
  type AvatarProps,
  type AvatarBadgeProps,
  type AvatarGroupProps,
  type SpinnerProps,
  type SkeletonProps,
  type SkeletonCircleProps,
  type SkeletonTextProps,
} from './primitives';

// Composite (15)
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  type CardProps,
} from './composite/Card';
export { Modal, type ModalProps } from './composite/Modal';
export { Accordion, AccordionItem, type AccordionProps, type AccordionItemProps } from './composite/Accordion';
export { Tabs, TabList, TabPanel, Tab, type TabsProps, type TabListProps, type TabPanelProps, type TabProps } from './composite/Tabs';
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, type BreadcrumbProps, type BreadcrumbItemProps, type BreadcrumbLinkProps } from './composite/Breadcrumb';
export { Pagination, type PaginationProps } from './composite/Pagination';
export { Dropdown, DropdownItem, DropdownMenu, type DropdownProps, type DropdownItemProps, type DropdownMenuProps } from './composite/Dropdown';
export { Tooltip, type TooltipProps } from './composite/Tooltip';
export { Popover, PopoverContent, type PopoverProps, type PopoverContentProps } from './composite/Popover';
export { Drawer, type DrawerProps } from './composite/Drawer';

// Layout (10)
export { Box, type BoxProps } from './layout/Box';
export { Stack, HStack, VStack, type StackProps } from './layout/Stack';

// Feedback (10)
export {
  Toast,
  Alert,
  Progress,
  CircularProgress,
  Spinner as FeedbackSpinner,
  Rating,
  type ToastProps,
  type AlertProps,
  type ProgressProps,
  type CircularProgressProps,
  type RatingProps,
} from './feedback';

// Data Display (5) - Placeholder implementations
export const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="min-w-full divide-y divide-gray-200">{children}</table>
);

export const TableHead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr>{children}</tr>
);

export const TableCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{children}</td>
);
