import { useState, ChangeEvent } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Container, Tabs, Tab, Grid, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import { styled } from "@mui/material/styles";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "lib/auth";
import { useRouter } from "next/router";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import PageHeader from "@/components/PageHeader";
import {
  getFetcher,
  useGetMachineById,
} from "pages/api/useRequest";
import MachineInfoTab from "@/content/machines/InfoTab";

const TabsWrapper = styled(Tabs)(
  () => `
    .MuiTabs-scrollableX {
      overflow-x: auto !important;
    }
`
);

function MachineDetail({ session }) {
  const userRole = session.user.role;
  const router = useRouter();
  const { machineId } = router.query;
  const { machine, machineByIdError } = useGetMachineById(
    getFetcher,
    machineId
  );
  const [currentTab, setCurrentTab] = useState<string>("info");
  const paths = ["Inicio", "Equipos", "# "+ machine?.machineNum];

  const tabs = [
    { value: "info", label: "Información general" },
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };
  const isLoadingMachine= !machineByIdError && !machine;
  const foundMachine = !isLoadingMachine && machine?._id;
  return (
    <>
      <Head>
        <title>Detalle Equipo</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Detalle Equipo"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!machineByIdError && machine}
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
          {isLoadingMachine || foundMachine ? (
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
                  <MachineInfoTab
                    role={userRole}
                    machine={machine}
                  />
                )}
              </Grid>
            </>
          ) : (
            <Grid item>
              <Alert severity="error">
                No se encontró el equipo, por favor verifique e intente de
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

MachineDetail.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default MachineDetail;
