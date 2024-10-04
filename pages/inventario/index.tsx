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
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import Footer from "@/components/Footer";
import { useSnackbar } from "notistack";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import InventoryTable from "./InventoryTable";
import AddProductModal from "@/components/AddProductModal";
import InventoryEntriesTable from "./InventoryEntriesTable";
import AddEntryModal from "@/components/AddEntryModal";

function Inventory() {
  const paths = ["Inicio", "Inventario"];
  const { enqueueSnackbar } = useSnackbar();
  const tabs = [
    { value: "inv", label: "Lista de Inventario" },
    { value: "ent", label: "Entradas" },
    { value: "iss", label: "Salidas" },
  ];
  const [currentTab, setCurrentTab] = useState("inv");

  const handleTabsChange = (_event, value) => {
    setCurrentTab(value);
  };

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

  const handleCloseModal = (addedRecord, successMessage = null) => {
    setModalIsOpen(false);
    if (addedRecord && successMessage) {
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
        <title>Inventario</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Inventario"}
          sutitle={""}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>

      <Container maxWidth="lg">
      <Grid container>
          <Grid item lg={12}>
            <Tabs
              onChange={handleTabsChange}
              value={currentTab}
              variant="fullWidth"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
              
              centered
            >
              {tabs.map((tab) => (
                <Tab key={tab.value} label={tab.label} value={tab.value}  />
              ))}
            </Tabs>
          </Grid>
          {currentTab === "inv" && (
            <>
              <Grid item textAlign="end" lg={12}>
                <InventoryTable showSearch />
              </Grid>
              <Grid item textAlign="end" lg={12}>
                <Button
                  startIcon={<AddIcon />}
                  size="medium"
                  variant="contained"
                  sx={{ marginTop: 1 }}
                  onClick={() => {
                    setModalType("PRODUCT");
                    setModalIsOpen(true);
                  }}
                >
                  Nuevo Producto/Pieza
                </Button>
              </Grid>
            </>
          )}
          {currentTab === "ent" && (
            <>
              <Grid item lg={12}>
                <InventoryEntriesTable />
              </Grid>
              <Grid item textAlign="end" lg={12}>
                <Button
                  startIcon={<PlaylistAddOutlinedIcon />}
                  size="medium"
                  variant="contained"
                  color="success"
                  sx={{ marginTop: 1 }}
                  onClick={() => {
                    setModalType("ENTRY");
                    setModalIsOpen(true);
                  }}
                >
                  Registrar Entrada
                </Button>
              </Grid>
            </>
          )}
          {currentTab === "iss" && (
            <Grid item lg={12}>
              {//<InventoryIssuesTable rows={issuesRows} showSearch />
              }
            </Grid>
          )}
        </Grid>
      </Container>
      {modalIsOpen && modalType === "PRODUCT" && (
        <AddProductModal open={modalIsOpen} handleOnClose={handleCloseModal} />
      )}
      {modalIsOpen && modalType === "ENTRY" && (
        <AddEntryModal open={modalIsOpen} handleOnClose={handleCloseModal} />
      )}
      <Footer />
    </>
  );
}

Inventory.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Inventory;
