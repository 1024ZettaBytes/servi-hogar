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
import TablaPagos from "./TablaPagos";
import {
  useGetPayments,
  getFetcher,
} from "../api/useRequest";
import { useSnackbar } from "notistack";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddPaymentModal from "@/components/AddPaymentModal";

function Equipos({ session }) {
  const paths = ["Inicio", "Pagos"];
  const { enqueueSnackbar } = useSnackbar();
  const { paymentsList, paymentsError } = useGetPayments(getFetcher);

  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const generalError = paymentsError;
  const completeData = paymentsList;
  const { user } = session;

  const handleClickOpen = () => {
    setAddModalIsOpen(true);
  };

  const handleClose = (addedPayment, successMessage = null) => {
    setAddModalIsOpen(false);
    if (addedPayment && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    }
  };
  const button = { text: "Nuevo pago", onClick: handleClickOpen };
  return (
    <>
      <Head>
        <title>Pagos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Lista de pagos"}
          sutitle={""}
          button={!generalError && completeData ? button : null}
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
            {generalError ? (
              <Alert severity="error">
                {paymentsError?.message}
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
                <TablaPagos
                  paymentsList={paymentsList}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {addModalIsOpen && completeData ? (
        <AddPaymentModal
          open={addModalIsOpen}
          handleOnClose={handleClose}
        />
      ) : null}
      <Footer />
    </>
  );
}

Equipos.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Equipos;
