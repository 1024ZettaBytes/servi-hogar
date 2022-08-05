import { useRouter } from "next/router";
import { getSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

import LoginForm from "./login";

function AuthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if (session.user.wasRemoved) {
          signOut();
        } else {
          router.replace("/");
        }
      } else {
        setIsLoading(false);
      }
    });
  }, [router]);

  if (isLoading) {
    return null;
  }

  return <LoginForm />;
}

export default AuthPage;
