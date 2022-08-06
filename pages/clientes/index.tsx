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
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import Footer from "@/components/Footer";
import AddCustomerModal from "@/components/AddCustomerModal";
import TablaClientes from "./TablaClientes";
import { useGetAllCustomers, getFetcher, useGetCustomerLevels, useGetCities } from "../api/useRequest";
import { useSnackbar } from 'notistack';
function Clientes({}) {
  const { enqueueSnackbar } = useSnackbar();
  const { customerList, customerError } = useGetAllCustomers(getFetcher);
  const { customerLevelList, customerLevelError } = useGetCustomerLevels(getFetcher);
  const { citiesList, citiesError } = useGetCities(getFetcher);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  
  const handleClickOpen = () => {
   setModalIsOpen(true);
  };

  const handleClose = (addedCustomer, successMessage=null) => {
    setModalIsOpen(false);
    if (addedCustomer && successMessage) {
      enqueueSnackbar(successMessage,{variant:"success", anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },autoHideDuration: 1500});
    }
  };
  const button = { text: "Agregar cliente", onClick: handleClickOpen, disabled:  citiesError || !citiesList};
  return (
    <>
      <Head>
        <title>Clientes</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Clientes"} sutitle={""} button={button} />
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
            {customerError || customerLevelError || citiesError ? (
              <Typography
                variant="h5"
                component="h5"
                color="error"
                textAlign="center"
              >
                {customerError?.message ||customerLevelError?.message||citiesError?.message}
              </Typography>
            ) : !customerList || !customerLevelList ? (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card>
                <TablaClientes customerList={customerList} levelsList={customerLevelList} />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
{modalIsOpen && citiesList && customerList  ?
      <AddCustomerModal
        open={modalIsOpen}
        handleOnClose={handleClose}
        citiesList={citiesList}
        customerList={customerList}
      />:null}
      <Footer />
    </>
  );
}

Clientes.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Clientes;
