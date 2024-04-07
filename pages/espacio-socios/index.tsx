import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import ResumenMisEquipos from "./ResumenMisEquipos";
import { useGetPartnerMachines, useGetPayouts, getFetcher } from "../api/useRequest";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaMisPagos from "./TablaMisPagos";

function Socios({}) {
  const paths = ["Inicio", "Socios"];
  const { machinesList, machinesListError } = useGetPartnerMachines(getFetcher);
  const { payoutsList, payoutsError } = useGetPayouts(getFetcher);

  return (
    <>
      <Head>
        <title>Socios</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Socios"} sutitle={""} />
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
          <Grid item xs={12} lg={12}>
            {machinesListError ? (
              <Alert severity="error">{machinesListError?.message}</Alert>
            ) : !machinesList ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
                <ResumenMisEquipos machinesList={machinesList} />
            )}
          </Grid>
          <Grid item xs={12}>
            {payoutsError ? (
              <Alert severity="error">{payoutsError?.message}</Alert>
            ) : !payoutsList ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaMisPagos payoutsList={payoutsList} />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

Socios.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Socios;
