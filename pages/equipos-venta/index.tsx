import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
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
import AddSalesMachineModal from "@/components/AddSalesMachineModal";
import AddSaleModal from "@/components/AddSaleModal";
import { useSnackbar } from "notistack";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import { getAllSalesMachines } from "../../lib/client/salesMachinesFetch";
import TablaSalesMachines from "./TablaSalesMachines";

function EquiposVenta({ session }) {
  const paths = ["Inicio", "Equipos de Venta"];
  const { enqueueSnackbar } = useSnackbar();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [saleModalIsOpen, setSaleModalIsOpen] = useState(false);
  const [selectedMachineForSale, setSelectedMachineForSale] = useState(null);
  const [salesMachines, setSalesMachines] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = session;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const result = await getAllSalesMachines(true);
    if (!result.error) {
      setSalesMachines(result.salesMachinesList);
      setError(null);
    } else {
      setError(result.msg);
    }
    setLoading(false);
  };

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleClose = (added, successMessage = null) => {
    setModalIsOpen(false);
    if (added && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
      fetchData(); // Refresh the list
    }
  };

  const handleSellClick = (machine) => {
    setSelectedMachineForSale(machine);
    setSaleModalIsOpen(true);
  };

  const handleSaleModalClose = (saved, successMessage = null) => {
    setSaleModalIsOpen(false);
    setSelectedMachineForSale(null); 
    if (saved && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
      fetchData(); 
    }
  };

  const button = { 
    text: "Agregar equipo de venta", 
    onClick: handleClickOpen, 
    startIcon: <AddTwoTone/>, 
    variant:"contained" 
  };

  return (
    <>
      <Head>
        <title>Equipos de Venta</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Equipos de Venta"}
          sutitle={"Administra los equipos disponibles para venta"}
          button={!error && !loading ? button : null}
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
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : loading ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaSalesMachines
                  userRole={user?.role}
                  salesMachinesList={salesMachines}
                  onUpdate={fetchData}
                  onSellClick={handleSellClick}
                />
              </Card>
            )}
          </Grid>
          {modalIsOpen && (
            <AddSalesMachineModal open={modalIsOpen} handleOnClose={handleClose} />
          )}
          {saleModalIsOpen && (
            <AddSaleModal 
              open={saleModalIsOpen} 
              handleOnClose={handleSaleModalClose}
              preSelectedMachine={selectedMachineForSale} 
            />
          )}
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

EquiposVenta.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default EquiposVenta;
