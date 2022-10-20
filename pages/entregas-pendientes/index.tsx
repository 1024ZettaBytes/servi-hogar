import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import TablaEntregasPendientes from "./TablaEntregasPendientes";
import {
  useGetPendingDeliveries,
  getFetcher,
} from "../api/useRequest";
import { useSnackbar } from "notistack";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";

function Rentas({ session }) {
  const paths = ["Inicio", "Entregas pendientes"];
  const { enqueueSnackbar } = useSnackbar();
  const { deliveriesList, deliveriesError } = useGetPendingDeliveries(getFetcher);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const generalError = deliveriesError;
  const completeData = deliveriesList;
  const { user } = session;

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleClose = (addedCustomer, successMessage = null) => {
    setModalIsOpen(false);
    if (addedCustomer && successMessage) {
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
  return (
    <>
      <Head>
        <title>Rentas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Entregas pendientes"}
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
            {generalError ? (
              <Alert severity="error">
                {deliveriesList?.message}
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
                <TablaEntregasPendientes
                  userRole={user?.role}
                  deliveriesList={deliveriesList}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {modalIsOpen && completeData ? (
        <AddCustomerModal
          open={modalIsOpen}
          handleOnClose={handleClose}
          citiesList={null}
          customerList={null}
        />
      ) : null}
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
