import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  related_user_username: string | null;
  related_user_avatar: string | null;
}

/**
 * Notifications hook - stub implementation.
 * The notification RPCs (get_user_notifications, etc.) don't exist in the current database.
 * This returns empty data until a notifications table + RPCs are created.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<DbNotification[]> => [],
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async (): Promise<number> => 0,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (_notificationId: string) => {
      // No-op until notifications table exists
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // No-op until notifications table exists
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
