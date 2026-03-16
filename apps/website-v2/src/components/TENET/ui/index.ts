/** [Ver001.000] */
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
  Spinner,
  Skeleton,
  type ButtonProps,
  type InputProps,
} from './primitives';

// Composite (15)
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  type CardProps,
  type ModalProps,
} from './composite/Card';
export { default as Modal } from './composite/Modal';

// Layout (10)
export { Box, type BoxProps } from './layout/Box';
export { Stack, HStack, VStack, type StackProps } from './layout/Stack';

// Feedback (5)
export { Toast, type ToastProps } from './feedback/Toast';

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
