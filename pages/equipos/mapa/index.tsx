import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession, getMapsAPIKey } from "../../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Typography, Skeleton } from "@mui/material";
import Footer from "@/components/Footer";
import {
  useGetAllMachinesLocations,
  getFetcher,
} from "../../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import MachinesMap from "@/components/MachinesMap";

function MapasEquiposRentados({mapsApiKey}) {
  const paths = ["Inicio", "Equipos", "Mapa"];
  const { machinesLocationData, machinesLocationError } = useGetAllMachinesLocations(getFetcher);
  return (
    <>
      <Head>
        <title>Mapa de Equipos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Mapa de Equipos Rentados"}
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
            {machinesLocationError ? (
              <Typography
                variant="h5"
                component="h5"
                color="error"
                textAlign="center"
              >
                {machinesLocationError?.message}
              </Typography>
            ) : !machinesLocationData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
              <MachinesMap rentsList={machinesLocationData} mapsApiKey={mapsApiKey}/>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

MapasEquiposRentados.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  props.props.mapsApiKey = getMapsAPIKey();
  return props;
}
export default MapasEquiposRentados;
