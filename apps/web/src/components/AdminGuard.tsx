// [Ver001.000] Route guard — redirects non-admin users to home.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/api/hooks';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;
  // Check role — user object may have role field or permissions
  const isAdmin = (user as any).role === 'admin' ||
    ((user as any).permissions ?? []).includes('admin');
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
