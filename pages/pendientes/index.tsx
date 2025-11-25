import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaAccionesSinAsignar from "./TablaAccionesSinAsignar";
import TablaAccionesVencidas from "./TablaAccionesVencidas";
import TablaRentasActuales from "../rentas/TablaRentasActuales";
import TablaVentas from "../../src/components/TablaVentas";
import RegisterPaymentModal from "@/components/RegisterPaymentModal";
import ResumenPendientes from "./ResumenPendientes";
import DailyTotalCard from "@/components/DailyTotalCard";
import { useSnackbar } from "notistack";
import {
  useGetPendingActions,
  useGetDailyPaymentsTotal,
  getFetcher,
  refreshData,
} from "../api/useRequest";
import { ROUTES } from "../../lib/consts/API_URL_CONST";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function Pendientes({ session }) {
  const { user } = session;
  const userRole = user?.role;
  const paths = ["Inicio", "Pendientes"];
  const { enqueueSnackbar } = useSnackbar();
  const { pendingActions, pendingActionsError, mutatePendingActions } = useGetPendingActions(getFetcher);
  const { dailyTotal, dailyTotalError } = useGetDailyPaymentsTotal(getFetcher);
  
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const handlePaymentClick = (sale) => {
    setSelectedSale(sale);
    setPaymentModalIsOpen(true);
  };

  const handlePaymentClose = (saved, successMessage = null) => {
    setPaymentModalIsOpen(false);
    setSelectedSale(null);
    if (saved && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 2000,
      });
      mutatePendingActions(); // Refresh pending actions including overdue sales
        refreshData(ROUTES.DAILY_PAYMENTS_TOTAL_API);
    }
  };

  return (
    <>
      <Head>
        <title>Pendientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Acciones Pendientes"}
          sutitle={"Gestión de acciones sin asignar y vencidas"}
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
              <DailyTotalCard
                dailyTotal={dailyTotal}
                isLoading={!dailyTotal && !dailyTotalError}
                error={dailyTotalError}
                userRole={userRole}
              />
            </Grid>

          {/* Summary Section */}
          <Grid item xs={12}>
            {pendingActionsError ? (
              <Alert severity="error">
                {pendingActionsError?.message}
              </Alert>
            ) : !pendingActions ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={200}
                animation="wave"
              />
            ) : (
              <ResumenPendientes
                unassigned={pendingActions.unassigned}
                overdue={pendingActions.overdue}
                overdueRents={pendingActions.overdueRents || []}
                overdueSales={pendingActions.overdueSales || []}
              />
            )}
          </Grid>

          {/* Unassigned Actions Table */}
          <Grid item xs={12}>
            {pendingActionsError ? null : !pendingActions ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaAccionesSinAsignar
                  actionsList={pendingActions.unassigned}
                  userRole={userRole}
                />
              </Card>
            )}
          </Grid>

          {/* Overdue Actions Table */}
          <Grid item xs={12}>
            {pendingActionsError ? null : !pendingActions ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaAccionesVencidas
                  actionsList={pendingActions.overdue}
                  userRole={userRole}
                />
              </Card>
            )}
          </Grid>

          {/* Overdue Rents Table */}
          <Grid item xs={12}>
            {pendingActionsError ? null : !pendingActions ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <TablaRentasActuales
                userRole={userRole}
                rentList={pendingActions.overdueRents || []}
              />
            )}
          </Grid>

          {/* Overdue Sales Table */}
          <Grid item xs={12}>
            {pendingActionsError ? null : !pendingActions ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <TablaVentas
                userRole={userRole}
                salesList={pendingActions.overdueSales || []}
                onUpdate={mutatePendingActions}
                onPaymentClick={handlePaymentClick}
              />
            )}
          </Grid>
        </Grid>
      </Container>
      
      {paymentModalIsOpen && selectedSale ? (
        <RegisterPaymentModal
          open={paymentModalIsOpen}
          sale={selectedSale}
          handleOnClose={handlePaymentClose}
        />
      ) : null}
      
      <Footer />
    </>
  );
}

Pendientes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Pendientes;
