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
import { useSnackbar } from "notistack";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import useSWR from "swr";
import { ROUTES } from "../../lib/consts/API_URL_CONST";

const fetcher = (url) => fetch(url).then((res) => res.json());

function Ventas({ session }) {
  const paths = ["Inicio", "Ventas"];
  const { enqueueSnackbar } = useSnackbar();
  const { data: salesData, error: salesError, mutate } = useSWR(
    ROUTES.ALL_SALES_API,
    fetcher
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const salesList = salesData?.data || null;
  const completeData = !!salesList;

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleClose = (saved, successMessage = null) => {
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
      mutate(); // Refresh the data
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
      mutate(); // Refresh the data
    }
  };

  const button = {
    text: "Registrar venta",
    onClick: handleClickOpen,
    startIcon: <AddTwoTone />,
    variant: "contained"
  };

  return (
    <>
      <Head>
        <title>Ventas de Equipos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Ventas de Equipos"}
          sutitle={""}
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
              <Card>
                <TablaVentas
                  userRole={session.user.role}
                  salesList={salesList}
                  onUpdate={mutate}
                  onPaymentClick={handlePaymentClick}
                />
              </Card>
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
