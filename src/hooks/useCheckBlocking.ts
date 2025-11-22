import { useSession } from 'next-auth/react';
import { useUserBlocked } from 'src/contexts/UserBlockedContext';

/**
 * Hook to check if an action resulted in user blocking and trigger the modal
 * Should be called after any AUX action that might result in blocking
 */
export function useCheckBlocking() {
  const { update: updateSession } = useSession();
  const { showBlockedModal } = useUserBlocked();

  const checkBlocking = async (wasBlocked: boolean) => {
    if (wasBlocked) {
      // Refetch session to get updated user data
      await updateSession();
      // Show the blocked modal
      showBlockedModal();
    }
  };

  return { checkBlocking };
}
