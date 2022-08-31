import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Typography, Skeleton } from "@mui/material";
import Footer from "@/components/Footer";
import AddMachineModal from "@/components/AddMachineModal";
import TablaEquipos from "./TablaEquipos";
import {
  useGetAllMachines,
  getFetcher,
  useGetMachinesStatus,
} from "../api/useRequest";
import { useSnackbar } from "notistack";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import ResumenEquipos from "./ResumenEquipos";

function Equipos({ session }) {
  const paths = ["Inicio", "Equipos"];
  const { enqueueSnackbar } = useSnackbar();
  const { machinesData, machinesError } = useGetAllMachines(getFetcher);
  const { machinesStatusList, machinesStatusError } = useGetMachinesStatus(
    getFetcher
  );
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const machinesList = machinesData ? machinesData?.machinesList : null;
  const machinesSummary = machinesData ? machinesData?.machinesSummary : null;
  const generalError = machinesError || machinesStatusError;
  const completeData = machinesList && machinesStatusList;
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
  const button = { text: "Agregar equipo", onClick: handleClickOpen };
  return (
    <>
      <Head>
        <title>Equipos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Equipos"}
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
              <Typography
                variant="h5"
                component="h5"
                color="error"
                textAlign="center"
              >
                {machinesError?.message || machinesStatusError?.message}
              </Typography>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaEquipos
                  userRole={user?.role}
                  machinesList={machinesList}
                />
              </Card>
            )}
          </Grid>
          {!generalError && (
            <>
              <br />
              {completeData && machinesSummary && (
                <Grid item lg={12} xs={12}>
                  <ResumenEquipos
                    onRent={machinesSummary?.RENT}
                    inVehicles={machinesSummary?.VEHI}
                    ready={machinesSummary.LISTO}
                    waiting={machinesSummary.ESPE}
                    onMaintenance={machinesSummary.MANTE}
                    total={machinesSummary?.total}
                  />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Container>
      {modalIsOpen && completeData ? (
        <AddMachineModal
          open={modalIsOpen}
          handleOnClose={handleClose}
          machinesStatusList={machinesStatusList}
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
