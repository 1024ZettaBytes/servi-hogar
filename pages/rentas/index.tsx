import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaRentasActuales from "./TablaRentasActuales";
import {
  useGetRents,
  getFetcher,
} from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function Rentas() {
  const paths = ["Inicio", "Rentas"];
  const { rentsData, rentsError } = useGetRents(getFetcher);
  
  return (
    <>
      <Head>
        <title>Rentas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Rentas"}
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
            {rentsError ? (
              <Alert severity="error">
                {rentsError?.message}
              </Alert>
            ) : !rentsData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaRentasActuales
                  rentList={rentsData.current}
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
