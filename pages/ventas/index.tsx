import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
} from "@mui/material";
import Footer from "@/components/Footer";
import AddSaleModal from "@/components/AddSaleModal";
import RegisterPaymentModal from "@/components/RegisterPaymentModal";
import TablaVentas from "@/components/TablaVentas";
import TablaPendingSales from "@/components/TablaPendingSales";
import TablaCompletedSalesByOperator from "@/components/TablaCompletedSalesByOperator";
import AssignOperatorModal from "@/components/AssignOperatorModal";
import CompleteSaleDeliveryModal from "@/components/CompleteSaleDeliveryModal";
import FormatModal from "@/components/FormatModal";
import { useSnackbar } from "notistack";
import { getFormatForSale } from "../../lib/consts/OBJ_CONTS";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import useSWR from "swr";
import { ROUTES } from "../../lib/consts/API_URL_CONST";

const fetcher = (url) => fetch(url).then((res) => res.json());

function Ventas({ session }) {
  const paths = ["Inicio", "Ventas"];
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch completed sales
  const { data: salesData, error: salesError, mutate: mutateSales } = useSWR(
    ROUTES.ALL_SALES_API,
    fetcher
  );
  
  // Fetch pending sales (for ADMIN/AUX) or operator data (for OPE)
  const { data: pendingData, mutate: mutatePending } = useSWR(
    ROUTES.ALL_PENDING_SALES_API,
    fetcher
  );
  
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [formatIsOpen, setFormatIsOpen] = useState(false);
  const [formatText, setFormatText] = useState('');
  const [createdSale, setCreatedSale] = useState(null);
  
  const isOperator = session.user.role === 'OPE';
  const salesList = salesData?.data || null;
  const pendingSalesList = isOperator ? pendingData?.data?.pending : pendingData?.data;
  const completedSalesList = isOperator ? pendingData?.data?.completed : [];
  const completeData = !!salesList && (isOperator ? !!(pendingSalesList && completedSalesList) : !!pendingSalesList);

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleClose = (saved, successMessage = null, saleData = null) => {
    setModalIsOpen(false);
    if (saved && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 2000,
      });
      mutatePending(); // Refresh pending sales
      
      // Show format modal if sale data is provided
      if (saleData) {
        setCreatedSale(saleData);
        setFormatText(getFormatForSale(saleData));
        setFormatIsOpen(true);
      }
    }
  };

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
      mutateSales(); // Refresh completed sales
    }
  };

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
      mutatePending(); // Refresh pending sales
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
      mutatePending(); // Refresh pending sales
      mutateSales(); // Refresh completed sales
    }
  };

  const handleWhatsAppClick = (sale) => {
    setSelectedSale(sale);
    setFormatText(getFormatForSale(sale));
    setFormatIsOpen(true);
  };

  const button = !isOperator ? {
    text: "Registrar venta",
    onClick: handleClickOpen,
    startIcon: <AddTwoTone />,
    variant: "contained"
  } : null;

  const pageTitle = isOperator ? "Entregas de Ventas" : "Ventas de Equipos";
  const pageSubtitle = isOperator ? "Completa las entregas de ventas asignadas" : "";

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={pageTitle}
          sutitle={pageSubtitle}
          button={!salesError && completeData ? button : null}
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
                {salesError?.message || "Error al cargar las ventas"}
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
                {/* For Operators: Show Pending and Completed deliveries */}
                {isOperator ? (
                  <>
                    {/* Pending Sales Table */}
                    {pendingSalesList && (
                      <Grid item xs={12}>
                        <Card>
                          <TablaPendingSales
                            userRole={session.user.role}
                            salesList={pendingSalesList}
                            onUpdate={mutatePending}
                            onAssignClick={handleAssignClick}
                            onCompleteClick={handleCompleteClick}
                            onWhatsAppClick={handleWhatsAppClick}
                          />
                        </Card>
                      </Grid>
                    )}
                    
                    {/* Completed Deliveries Table */}
                    {completedSalesList && completedSalesList.length > 0 && (
                      <Grid item xs={12} sx={{ mt: 4 }}>
                        <TablaCompletedSalesByOperator
                          salesList={completedSalesList}
                        />
                      </Grid>
                    )}
                  </>
                ) : (
                  /* For ADMIN/AUX: Show Pending and Completed sales */
                  <>
                    {/* Pending Sales Table */}
                    {pendingSalesList && (
                      <Grid item xs={12}>
                        <Card>
                          <TablaPendingSales
                            userRole={session.user.role}
                            salesList={pendingSalesList}
                            onUpdate={mutatePending}
                            onAssignClick={handleAssignClick}
                            onCompleteClick={handleCompleteClick}
                            onWhatsAppClick={handleWhatsAppClick}
                          />
                        </Card>
                      </Grid>
                    )}
                    
                    {/* Completed Sales Table */}
                    <Grid item xs={12} sx={{ mt: 4 }}>
                      <Card>
                        <TablaVentas
                          userRole={session.user.role}
                          salesList={salesList}
                          onUpdate={mutateSales}
                          onPaymentClick={handlePaymentClick}
                        />
                      </Card>
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
      {modalIsOpen ? (
        <AddSaleModal
          open={modalIsOpen}
          handleOnClose={handleClose}
        />
      ) : null}
      
      {paymentModalIsOpen && selectedSale ? (
        <RegisterPaymentModal
          open={paymentModalIsOpen}
          sale={selectedSale}
          handleOnClose={handlePaymentClose}
        />
      ) : null}

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

      {formatIsOpen && (
        <FormatModal
          open={formatIsOpen}
          selectedId={createdSale?._id}
          title="Formato de Venta"
          text="ENVIADO"
          textColor="green"
          formatText={formatText}
          onAccept={() => {
            setFormatIsOpen(false);
            setFormatText('');
            setCreatedSale(null);
          }}
          onSubmitAction={async () => ({ error: false, msg: 'Marcado como enviado' })}
        />
      )}
      
      <Footer />
    </>
  );
}

Ventas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default Ventas;
