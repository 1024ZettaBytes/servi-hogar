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
import { getFetcher, useGetMantainances, useGetPendingMantainances, useGetPendingSaleRepairs, useGetSaleRepairs } from "pages/api/useRequest";

function Mantenimientos({ session }) {
  const { user } = session;
  const paths = ["Inicio", "Mantenimientos"];
  const { pendingMantData, pendingMantError } = useGetPendingMantainances(getFetcher);
  const { mantData, mantError } = useGetMantainances(getFetcher);
  const { pendingSaleRepairsList, pendingSaleRepairsError } = useGetPendingSaleRepairs(getFetcher);
  const { saleRepairsData, saleRepairsError } = useGetSaleRepairs(getFetcher);

  // Combine rent maintenance and sale repairs for pending list
  // Sale repairs have priority (appear first)
  const combinedPendingList = [
    ...(pendingSaleRepairsList || []).map(item => ({ ...item, type: 'SALE' })),
    ...(pendingMantData || []).map(item => ({ ...item, type: 'RENT' }))
  ];

  // Combine rent maintenance and sale repairs for completed list
  // Sale repairs have priority (appear first)
  const combinedCompletedList = [
    ...(saleRepairsData || []).map(item => ({ ...item, type: 'SALE' })),
    ...(mantData || []).map(item => ({ ...item, type: 'RENT' }))
  ];

  const hasPendingError = pendingMantError || pendingSaleRepairsError;
  const pendingErrorMessage = pendingMantError?.message || pendingSaleRepairsError?.message;
  const isLoadingPending = !pendingMantData || !pendingSaleRepairsList;

  const hasCompletedError = mantError || saleRepairsError;
  const completedErrorMessage = mantError?.message || saleRepairsError?.message;
  const isLoadingCompleted = !mantData || !saleRepairsData;
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
            {hasPendingError ? (
              <Alert severity="error">{pendingErrorMessage}</Alert>
            ) : isLoadingPending ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaMantPendientes
                  listData={combinedPendingList}
                  userRole={user?.role}
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
            {hasCompletedError ? (
              <Alert severity="error">{completedErrorMessage}</Alert>
            ) : isLoadingCompleted ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaMant listData={combinedCompletedList} />
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
