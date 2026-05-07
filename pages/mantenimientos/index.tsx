import Head from "next/head";
import { useState } from "react";
import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert, Tabs, Tab } from "@mui/material";
import Footer from "@/components/Footer";


import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaMant from "./TablaMant";
import TablaMantPendientes from "./TablaMantPendientes";
import TablaAcondicionamiento from "./TablaAcondicionamiento";
import { getFetcher, useGetMantainances, useGetPendingMantainances, useGetPendingSaleRepairs, useGetSaleRepairs, useGetWarehouseConditioning, useGetAllWarehousesOverview, useGetCollectedMachines } from "pages/api/useRequest";

function Mantenimientos({ session }) {
  const { user } = session;
  const paths = ["Inicio", "Mantenimientos"];
  const [currentTab, setCurrentTab] = useState("pendientes");

  const { pendingMantData, pendingMantError } = useGetPendingMantainances(getFetcher);
  const { mantData, mantError } = useGetMantainances(getFetcher);
  const { pendingSaleRepairsList, pendingSaleRepairsError } = useGetPendingSaleRepairs(getFetcher);
  const { saleRepairsData, saleRepairsError } = useGetSaleRepairs(getFetcher);
  const { conditioningList, conditioningError, isLoadingConditioning } = useGetWarehouseConditioning(getFetcher);
  const { warehousesList } = useGetAllWarehousesOverview(getFetcher);

  const isTec = user?.role === 'TEC';
  const { collectedMachines } = useGetCollectedMachines(isTec ? getFetcher : null);
  const hasOverdueCollected = isTec && Array.isArray(collectedMachines) && collectedMachines.some(
    (m) => m.collectionDate && (Date.now() - new Date(m.collectionDate).getTime()) > 24 * 60 * 60 * 1000
  );

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

  const tabs = [
    { value: "pendientes", label: `Pendientes (${combinedPendingList.length})` },
    { value: "pasados", label: `Pasados (${combinedCompletedList.length})` },
    { value: "acondicionamiento", label: `Acondicionamiento (${(conditioningList || []).length})` },
  ];

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
            <Tabs
              onChange={(_e, val) => setCurrentTab(val)}
              value={currentTab}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              centered
            >
              {tabs.map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Grid>

          {hasOverdueCollected && (
            <Grid item xs={12}>
              <Alert severity="warning">
                Hay máquinas recolectadas sin bajar desde hace más de 1 día. Debes bajarlas para poder realizar mantenimientos (Ve a la sección de 'Recolectadas' del menú).
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            {currentTab === "pendientes" && (
              <>
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
                      isBlocked={hasOverdueCollected}
                    />
                  </Card>
                )}
              </>
            )}

            {currentTab === "pasados" && (
              <>
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
              </>
            )}

            {currentTab === "acondicionamiento" && (
              <>
                {conditioningError ? (
                  <Alert severity="error">Error al cargar datos de acondicionamiento</Alert>
                ) : isLoadingConditioning ? (
                  <Skeleton
                    variant="rectangular"
                    width={"100%"}
                    height={500}
                    animation="wave"
                  />
                ) : (
                  <TablaAcondicionamiento
                    listData={conditioningList || []}
                    userRole={user?.role}
                    warehousesList={warehousesList || []}
                  />
                )}
              </>
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
