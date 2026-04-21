import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Card, Container, Grid, Skeleton, Alert } from '@mui/material';
import Footer from '@/components/Footer';
import AddMachineModal from '@/components/AddMachineModal';
import TablaEquipos from './TablaEquipos';
import TablaEquiposOperador from './TablaEquiposOperador';
import {
  useGetAllMachines,
  getFetcher,
  useGetMachinesStatus,
  useGetMachinesForOperator,
  useGetAllWarehousesOverview
} from '../api/useRequest';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import ResumenEquipos from './ResumenEquipos';
import AddTwoTone from '@mui/icons-material/AddTwoTone';

function Equipos({ session }) {
  const paths = ['Inicio', 'Equipos'];
  const { enqueueSnackbar } = useSnackbar();
  const { user } = session;
  const isOperator = user?.role === 'OPE';

  // Admin/AUX data
  const { machinesData, machinesError } = useGetAllMachines(
    isOperator ? null : getFetcher
  );
  const { machinesStatusList, machinesStatusError } = useGetMachinesStatus(
    isOperator ? null : getFetcher
  );

  // OPE data
  const { operatorMachinesData, operatorMachinesError } = useGetMachinesForOperator(
    isOperator ? getFetcher : null
  );
  const { warehousesList } = useGetAllWarehousesOverview(
    isOperator ? getFetcher : null
  );

  const [modalIsOpen, setModalIsOpen] = useState(false);

  // Derive data based on role
  const machinesList = !isOperator && machinesData
    ? machinesData?.machinesList
    : null;
  const machinesSummary =
    !isOperator && machinesData ? machinesData?.machinesSummary : null;

  const generalError = isOperator
    ? operatorMachinesError
    : machinesError || machinesStatusError;
  const completeData = isOperator
    ? operatorMachinesData
    : machinesList && machinesStatusList;

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };
  const getOnlyActiveTotal = (summary) => {
    if (!summary) return 0;
    const { total, PERDIDA, INVES, MANTE, ESPE, LISTO } = summary;
    const nonWarehouse = [
      MANTE.byWarehouse,
      ESPE.byWarehouse,
      LISTO.byWarehouse
    ].reduce(
      (acc, ware) =>
        acc +
        ware.reduce(
          (innerAcc, w) => {
            return innerAcc + (w.name?.includes('Chica') ? w.total : 0);
          },
          0
        ),
      0
    );
    return total - (PERDIDA.total || 0) - (INVES.total || 0) - nonWarehouse;
  };
  const handleClose = (addedCustomer, successMessage = null) => {
    setModalIsOpen(false);
    if (addedCustomer && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 1500
      });
    }
  };
  const button = !isOperator
    ? {
        text: 'Agregar equipo',
        onClick: handleClickOpen,
        startIcon: <AddTwoTone />,
        variant: 'contained'
      }
    : null;
  return (
    <>
      <Head>
        <title>Equipos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Equipos'}
          sutitle={''}
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
                {isOperator
                  ? operatorMachinesError?.message
                  : machinesError?.message || machinesStatusError?.message}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : isOperator ? (
              <TablaEquiposOperador
                listoMachines={operatorMachinesData?.listoMachines || []}
                vehiMachines={operatorMachinesData?.vehiMachines || []}
                recMachines={operatorMachinesData?.recMachines || []}
                warehousesList={warehousesList || []}
                nextMachine={operatorMachinesData?.nextMachine || null}
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
          {!generalError && !isOperator && (
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
                    lost={machinesSummary?.PERDIDA}
                    total={machinesSummary?.total}
                    stored={machinesSummary?.ALMACEN}
                    sale={machinesSummary?.SALE}
                    activeTotal={getOnlyActiveTotal(machinesSummary)}
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
