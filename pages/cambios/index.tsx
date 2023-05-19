import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaCambios from "./TablaCambios";
import { useGetChanges, getFetcher } from "../api/useRequest";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import Banner from "pages/Banner";

function Rentas({ session }) {
  const paths = ["Inicio", "Cambios"];
  const { changesList, changesError } = useGetChanges(getFetcher);
  const generalError = changesError;
  const completeData = changesList;
  const { user } = session;

  return (
    <>
      <Head>
        <title>Cambios</title>
      </Head>
      <PageTitleWrapper>
      <Banner/>
        <PageHeader title={"Cambios"} sutitle={""} />
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
              <Alert severity="error">{changesError?.message}</Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaCambios
                  userRole={user?.role}
                  changesList={changesList}
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
