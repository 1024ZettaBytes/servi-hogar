import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaRentasActuales from "./TablaRentasActuales";
import TablaRentasPasadas from "./TablaRentasPasadas";

import { useGetRents, getFetcher } from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function Rentas() {
  const paths = ["Inicio", "Colocadas"];
  const { rentsData, rentsError } = useGetRents("current", getFetcher);
  const { pastRentsData, pastRentsError } = useGetRents("past", getFetcher);
  return (
    <>
      <Head>
        <title>Colocadas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Colocadas"} sutitle={""} />
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
            {rentsError ? (
              <Alert severity="error">{rentsError?.message}</Alert>
            ) : !rentsData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRentasActuales rentList={rentsData} />
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
            {pastRentsError ? (
              <Alert severity="error">{pastRentsError?.message}</Alert>
            ) : !pastRentsData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRentasPasadas rentList={pastRentsData} />
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
