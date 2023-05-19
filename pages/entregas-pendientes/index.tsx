import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaEntregasPendientes from "./TablaEntregasPendientes";
import {
  useGetPendingDeliveries,
  getFetcher,
} from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import Banner from "pages/Banner";

function EntregasPendientes({ session }) {
  const paths = ["Inicio", "Entregas pendientes"];
  const { pendingDeliveriesList, pendingDeliveriesError } = useGetPendingDeliveries(getFetcher);
  const generalError = pendingDeliveriesError;
  const completeData = pendingDeliveriesList;
  const { user } = session;
  
  return (
    <>
      <Head>
        <title>Entregas pendientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Entregas pendientes"}
          sutitle={""}
        />
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
              <Alert severity="error">
                {pendingDeliveriesError?.message}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaEntregasPendientes
                  userRole={user?.role}
                  deliveriesList={pendingDeliveriesList}
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

EntregasPendientes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default EntregasPendientes;
