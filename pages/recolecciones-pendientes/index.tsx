import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaRecoleccionesPendientes from "./TablaRecoleccionesPendientes";
import { useGetPendingPickups, getFetcher } from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function Rentas({ session }) {
  const paths = ["Inicio", "Recolecciones pendientes"];
  const { pendingPickupsList, pendingPickupsError } = useGetPendingPickups(getFetcher);
  const generalError = pendingPickupsError;
  const completeData = pendingPickupsList;
  const { user } = session;

  return (
    <>
      <Head>
        <title>Recolecciones pendientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Recolecciones pendientes"} sutitle={""} />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {generalError ? (
              <Alert severity="error">{pendingPickupsError?.message}</Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRecoleccionesPendientes
                  userRole={user?.role}
                  pickupList={pendingPickupsList}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

Rentas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Rentas;
