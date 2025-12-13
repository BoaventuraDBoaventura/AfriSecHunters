import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return <>{children}</>;
}