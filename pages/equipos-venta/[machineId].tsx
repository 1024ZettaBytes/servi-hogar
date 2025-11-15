import { useState, ChangeEvent } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Container, Tabs, Tab, Grid, Alert, Box } from "@mui/material";
import Footer from "@/components/Footer";
import { styled } from "@mui/material/styles";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "lib/auth";
import { useRouter } from "next/router";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import PageHeader from "@/components/PageHeader";
import {
  getFetcher,
  useGetSalesMachineById
} from "pages/api/useRequest";
import SalesMachineInfoTab from "@/content/sales-machines/InfoTab";

const TabsWrapper = styled(Tabs)(
  () => `
    .MuiTabs-scrollableX {
      overflow-x: auto !important;
    }
`
);

function SalesMachineDetail({ session }) {
  const userRole = session.user.role;
  const router = useRouter();
  const { machineId } = router.query;
  const { saleMachine, saleMachineByIdError } = useGetSalesMachineById(
    getFetcher,
    machineId
  );
  
  const [currentTab, setCurrentTab] = useState<string>("info");
  
  const paths = ["Inicio", "Equipos Venta", "# " + saleMachine?.machineNum];

  const tabs = [
    { value: "info", label: "Información general" },
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };

  const isLoadingSalesMachine = !saleMachineByIdError && !saleMachine;
  const foundSalesMachine = !isLoadingSalesMachine && saleMachine?._id;

  return (
    <>
      <Head>
        <title>Detalle Equipo de Venta</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Detalle Equipo de Venta"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!saleMachineByIdError && saleMachine}
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          {isLoadingSalesMachine || foundSalesMachine ? (
            <>
              <Grid item xs={12}>
                <TabsWrapper
                  onChange={handleTabsChange}
                  value={currentTab}
                  variant="scrollable"
                  scrollButtons="auto"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  {tabs.map((tab) => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} />
                  ))}
                </TabsWrapper>
              </Grid>
              <Grid item xs={12}>
                {currentTab === "info" && (
                  <SalesMachineInfoTab
                    role={userRole}
                    salesMachine={saleMachine}
                  />
                )}
              </Grid>
            </>
          ) : (
            <Grid item>
              <Alert severity="error">
                No se encontró el equipo de venta, por favor verifique e intente de
                nuevo.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

SalesMachineDetail.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default SalesMachineDetail;