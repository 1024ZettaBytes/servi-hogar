import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";


import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaMant from "./TablaMant";
import TablaMantPendientes from "./TablaMantPendientes";
import { getFetcher, useGetMantainances, useGetPendingMantainances } from "pages/api/useRequest";

function Mantenimientos() {
  const paths = ["Inicio", "Mantenimientos"];
  const { pendingMantData, pendingMantError } = useGetPendingMantainances(getFetcher);
  const { mantData, mantError } = useGetMantainances(getFetcher);
  return (
    <>
      <Head>
        <title>Mantenimientos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Mantenimientos"} sutitle={""} />
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
            {pendingMantError ? (
              <Alert severity="error">{pendingMantError?.message}</Alert>
            ) : !pendingMantData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaMantPendientes
                  listData={pendingMantData}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Container maxWidth="lg" sx={{ marginTop: 5 }}>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {mantError ? (
              <Alert severity="error">{mantError?.message}</Alert>
            ) : !mantData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaMant listData={mantData} />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

Mantenimientos.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Mantenimientos;
