export async function  validateServerSideSession(getSession, req, resolvedUrl) {
  const session = await getSession({ req });
  if (!session || !session.user || !session.user.name|| !session.user.role) {
    return {
      redirect: {
        destination: "/auth?returnUrl=" + resolvedUrl,
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
