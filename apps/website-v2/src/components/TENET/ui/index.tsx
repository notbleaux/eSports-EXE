/** [Ver002.000] */
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
  Checkbox,
  Radio,
  Switch,
  Select,
  Textarea,
  Slider,
  DatePicker,
  FileUpload,
  ColorPicker,
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
  type CheckboxProps,
  type RadioProps,
  type SwitchProps,
  type SelectProps,
  type TextareaProps,
  type SliderProps,
} from './primitives';

// Composite (15)
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  Accordion,
  AccordionItem,
  Tabs,
  TabList,
  TabPanel,
  Tab,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Pagination,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  Tooltip,
  Popover,
  PopoverContent,
  Drawer,
  type CardProps,
  type ModalProps,
  type AccordionProps,
  type AccordionItemProps,
  type TabsProps,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type BreadcrumbProps,
  type BreadcrumbItemProps,
  type BreadcrumbLinkProps,
  type PaginationProps,
  type DropdownProps,
  type DropdownItemProps,
  type DropdownMenuProps,
  type TooltipProps,
  type PopoverProps,
  type PopoverContentProps,
  type DrawerProps,
} from './composite';

// Layout (10)
export {
  Box,
  Stack,
  HStack,
  VStack,
  Container,
  Grid,
  GridItem,
  Flex,
  Spacer,
  Divider,
  AspectRatio,
  Center,
  SimpleGrid,
  type BoxProps,
  type StackProps,
  type ContainerProps,
  type GridProps,
  type GridItemProps,
  type FlexProps,
  type SpacerProps,
  type DividerProps,
  type AspectRatioProps,
  type CenterProps,
  type SimpleGridProps,
} from './layout';

// Feedback (10)
export {
  Toast,
  Alert,
  Progress,
  CircularProgress,
  Rating,
  Skeleton as FeedbackSkeleton,
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
