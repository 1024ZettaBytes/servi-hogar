import { useRouter } from "next/router";
import { getSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import LoginForm from "./login";

function AuthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;
    
    getSession().then((session) => {
      if (!isMounted) return;
      
      if (session) {
        if (session.user.wasRemoved) {
          signOut();
        } else {
          const returnUrl = router.query?.returnUrl || "/";
          router.replace(returnUrl);
        }
      } else {
        setIsLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return null;
  }

  return <LoginForm />;
}

export default AuthPage;
