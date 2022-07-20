import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import UserProfile from '../src/components/profile/user-profile';

function ProfilePage() {

  return <UserProfile />;
}

export async function getServerSideProps({ req, resolvedUrl }) {
    
  const session = await getSession({ req });
  if (!session) {
    return {
      redirect: {
        destination: '/auth?returnUrl='+resolvedUrl,
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default ProfilePage;