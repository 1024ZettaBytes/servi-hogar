import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { useUserBlocked } from 'src/contexts/UserBlockedContext';
import { useRouter } from 'next/router';

export function useCheckAdminOverdue() {
  const { data: session, update: updateSession } = useSession();
  const { showBlockedModal } = useUserBlocked();
  const router = useRouter();

  useEffect(() => {
    const checkOverdue = async () => {
      // Only run for ADMINs who are not superusers
      const isSuperUser = (session?.user as any)?.isSuperUser;
      const role = (session?.user as any)?.role;
      const isBlocked = (session?.user as any)?.isBlocked;
      
      if (role === 'ADMIN' && !isSuperUser && !isBlocked) {
        try {
          const res = await axios.post('/api/pickups/investigations/check-overdue');
          if (res.data.blocked) {
            // Force session update so NextAuth knows user is blocked
            await updateSession();
            showBlockedModal();
          }
        } catch (error) {
          console.error('Error checking overdue investigations:', error);
        }
      }
    };

    if (session?.user) {
      checkOverdue();
    }
  }, [session?.user, updateSession, showBlockedModal, router.pathname]);
}
