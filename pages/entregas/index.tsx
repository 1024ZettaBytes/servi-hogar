import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaEntregas from "./TablaEntregas";
import {
  useGetDeliveries,
  getFetcher,
} from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function EntregasPendientes({ session }) {
  const paths = ["Inicio", "Entregas"];
  const { deliveriesList, deliveriesError } = useGetDeliveries(getFetcher);
  const generalError = deliveriesError;
  const completeData = deliveriesList;
  const { user } = session;
  
  return (
    <>
      <Head>
        <title>Entregas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Entregas"}
          sutitle={""}
        />
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
              <Alert severity="error">
                {deliveriesError?.message}
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
                <TablaEntregas
                  userRole={user?.role}
                  deliveriesList={deliveriesList}
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
