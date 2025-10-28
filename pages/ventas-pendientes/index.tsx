import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Container,
  Grid,
  Skeleton,
  Alert,
  Card,
} from "@mui/material";
import Footer from "@/components/Footer";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaPendingSales from "@/components/TablaPendingSales";
import TablaCompletedSalesByOperator from "@/components/TablaCompletedSalesByOperator";
import AssignOperatorModal from "@/components/AssignOperatorModal";
import CompleteSaleDeliveryModal from "@/components/CompleteSaleDeliveryModal";
import { useSnackbar } from "notistack";
import useSWR from "swr";
import { ROUTES } from "../../lib/consts/API_URL_CONST";

const fetcher = (url) => fetch(url).then((res) => res.json());

function PendingSales({ session }) {
  const paths = ["Inicio", "Ventas", "Entregas Pendientes"];
  const { enqueueSnackbar } = useSnackbar();
  const { data: salesData, error: salesError, mutate } = useSWR(
    ROUTES.ALL_PENDING_SALES_API,
    fetcher
  );
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const isOperator = session.user.role === 'OPE';
  const pendingSalesList = isOperator ? salesData?.data?.pending : salesData?.data;
  const completedSalesList = isOperator ? salesData?.data?.completed : [];
  const completeData = isOperator ? !!(pendingSalesList && completedSalesList) : !!pendingSalesList;

  const handleAssignClick = (sale) => {
    setSelectedSale(sale);
    setAssignModalOpen(true);
  };

  const handleAssignClose = (saved, successMessage = null) => {
    setAssignModalOpen(false);
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
      mutate(); // Refresh the data
    }
  };

  const handleCompleteClick = (sale) => {
    setSelectedSale(sale);
    setCompleteModalOpen(true);
  };

  const handleCompleteClose = (saved, successMessage = null) => {
    setCompleteModalOpen(false);
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
      mutate(); // Refresh the data
    }
  };

  return (
    <>
      <Head>
        <title>Entregas de Ventas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Entregas de Ventas"}
          sutitle={"Completa las entregas de ventas programadas"}
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
            {salesError ? (
              <Alert severity="error">
                {salesError?.message || "Error al cargar las ventas pendientes"}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <>
                <Card>
                  <TablaPendingSales
                    userRole={session.user.role}
                    salesList={pendingSalesList}
                    onUpdate={mutate}
                    onAssignClick={handleAssignClick}
                    onCompleteClick={handleCompleteClick}
                  />
                </Card>
                {isOperator && completedSalesList && completedSalesList.length > 0 && (
                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <TablaCompletedSalesByOperator
                      salesList={completedSalesList}
                    />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
      {assignModalOpen && selectedSale ? (
        <AssignOperatorModal
          open={assignModalOpen}
          sale={selectedSale}
          handleOnClose={handleAssignClose}
        />
      ) : null}
      {completeModalOpen && selectedSale ? (
        <CompleteSaleDeliveryModal
          open={completeModalOpen}
          sale={selectedSale}
          handleOnClose={handleCompleteClose}
        />
      ) : null}
      <Footer />
    </>
  );
}

PendingSales.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default PendingSales;
