import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaCambiosPendientes from "./TablaCambiosPendientes";
import { useGetPendingChanges, getFetcher } from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import Banner from "pages/Banner";

function Rentas({ session }) {
  const paths = ["Inicio", "Cambios pendientes"];
  const { pendingChangesList, pendingChangesError } = useGetPendingChanges(getFetcher);
  const generalError = pendingChangesError;
  const completeData = pendingChangesList;
  const { user } = session;

  return (
    <>
      <Head>
        <title>Cambios pendientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Cambios pendientes"} sutitle={""} />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Banner/>
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
              <Alert severity="error">{pendingChangesError?.message}</Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaCambiosPendientes
                  userRole={user?.role}
                  changesList={pendingChangesList}
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
