import Head from "next/head";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid} from "@mui/material";
import Footer from "@/components/Footer";
import TablaEntregas from "./TablaEntregas";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function EntregasPendientes({ session }) {
  const paths = ["Inicio", "Entregas"];
  
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

              <Card>
                <TablaEntregas
                  userRole={user?.role}
                />
              </Card>
            
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
