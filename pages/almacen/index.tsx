import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Container,
  Grid,
  Tabs,
  Tab,
  Skeleton,
  Alert
} from '@mui/material';
import Footer from '@/components/Footer';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import AddTwoTone from '@mui/icons-material/AddTwoTone';
import AddWarehouseMachineModal from '@/components/AddWarehouseMachineModal';
import AssignTechnicianModal from '@/components/AssignTechnicianModal';
import LoadToVehicleModal from '@/components/LoadToVehicleModal';
import ReplaceMachineModal from '@/components/ReplaceMachineModal';
import TablaAlmacen from './TablaAlmacen';
import ResumenAlmacen from './ResumenAlmacen';
import {
  useGetWarehouseMachines,
  useGetWarehouseSummary,
  useGetUsers,
  getFetcher
} from '../api/useRequest';

function Almacen({ session }) {
  const paths = ['Inicio', 'Almacén'];
  const { enqueueSnackbar } = useSnackbar();
  const { user } = session;

  const tabs = [
    { value: 'almacenadas', label: 'Almacenadas' },
    { value: 'acondicionadas', label: 'Acondicionadas' },
    { value: 'acondicionamiento', label: 'En Acondicionamiento' },
    { value: 'desmanteladas', label: 'Desmanteladas' }
  ];

  const [currentTab, setCurrentTab] = useState('almacenadas');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [machineToAssign, setMachineToAssign] = useState(null);
  const [loadVehicleModalOpen, setLoadVehicleModalOpen] = useState(false);
  const [machineToLoad, setMachineToLoad] = useState(null);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [machineToReplace, setMachineToReplace] = useState(null);

  // Fetch data based on current tab
  const statusForTab =
    currentTab === 'almacenadas'
      ? 'ALMACENADA'
      : currentTab === 'acondicionadas'
      ? 'ACONDICIONADA'
      : currentTab === 'acondicionamiento'
      ? 'EN_ACONDICIONAMIENTO'
      : 'DESMANTELADA';

  const { warehouseMachines, warehouseMachinesError, isLoadingWarehouseMachines } =
    useGetWarehouseMachines(getFetcher, statusForTab);

  const { warehouseSummary } = useGetWarehouseSummary(getFetcher);

  const { userList } = useGetUsers(getFetcher);
  const techniciansList = (userList || []).filter(
    (u) => u.role?.id === 'TEC' && u.isActive
  );

  const handleTabsChange = (_event, value) => {
    setCurrentTab(value);
  };

  const handleClickOpen = () => {
    setModalIsOpen(true);
  };

  const handleCloseModal = (added, successMessage = null) => {
    setModalIsOpen(false);
    if (added && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
    }
  };

  const handleOpenAssign = (machine) => {
    setMachineToAssign(machine);
    setAssignModalOpen(true);
  };

  const handleCloseAssign = (assigned, msg = null) => {
    setAssignModalOpen(false);
    setMachineToAssign(null);
    if (msg) {
      enqueueSnackbar(msg, {
        variant: assigned ? 'success' : 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
    }
  };

  const handleOpenLoadVehicle = (machine) => {
    setMachineToLoad(machine);
    setLoadVehicleModalOpen(true);
  };

  const handleCloseLoadVehicle = (loaded, msg = null) => {
    setLoadVehicleModalOpen(false);
    setMachineToLoad(null);
    if (msg) {
      enqueueSnackbar(msg, {
        variant: loaded ? 'success' : 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
    }
  };

  const handleOpenReplace = (machine) => {
    setMachineToReplace(machine);
    setReplaceModalOpen(true);
  };

  const handleCloseReplace = (replaced, msg = null) => {
    setReplaceModalOpen(false);
    setMachineToReplace(null);
    if (msg) {
      enqueueSnackbar(msg, {
        variant: replaced ? 'success' : 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 1500
      });
    }
  };

  const button =
    ['ADMIN', 'AUX'].includes(user?.role) && !warehouseMachinesError
      ? {
          text: 'Registrar máquina',
          onClick: handleClickOpen,
          startIcon: <AddTwoTone />,
          variant: 'contained'
        }
      : null;

  return (
    <>
      <Head>
        <title>Almacén</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Almacén'}
          sutitle={'Gestión de máquinas en almacén'}
          button={button}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item lg={12} xs={12}>
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
                <Tab key={tab.value} label={tab.label} value={tab.value} />
              ))}
            </Tabs>
          </Grid>

          <Grid item xs={12}>
            {warehouseMachinesError ? (
              <Alert severity="error">
                Error al cargar las máquinas del almacén
              </Alert>
            ) : isLoadingWarehouseMachines ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={400}
                animation="wave"
              />
            ) : (
              <TablaAlmacen
                userRole={user?.role}
                isSuperUser={user?.isSuperUser || false}
                machinesList={warehouseMachines || []}
                onUpdate={() => {}}
                tabFilter={statusForTab}
                onAssignTech={handleOpenAssign}
                onLoadToVehicle={handleOpenLoadVehicle}
                onReplaceMachine={handleOpenReplace}
              />
            )}
          </Grid>

          {warehouseSummary && (
            <Grid item lg={12} xs={12}>
              <ResumenAlmacen summary={warehouseSummary} />
            </Grid>
          )}
        </Grid>
      </Container>

      {modalIsOpen && (
        <AddWarehouseMachineModal
          open={modalIsOpen}
          handleOnClose={handleCloseModal}
        />
      )}
      {assignModalOpen && machineToAssign && (
        <AssignTechnicianModal
          open={assignModalOpen}
          handleOnClose={handleCloseAssign}
          machine={machineToAssign}
          techniciansList={techniciansList}
        />
      )}
      {loadVehicleModalOpen && machineToLoad && (
        <LoadToVehicleModal
          open={loadVehicleModalOpen}
          handleOnClose={handleCloseLoadVehicle}
          machine={machineToLoad}
        />
      )}
      {replaceModalOpen && machineToReplace && (
        <ReplaceMachineModal
          open={replaceModalOpen}
          handleOnClose={handleCloseReplace}
          machine={machineToReplace}
        />
      )}
      <Footer />
    </>
  );
}

Almacen.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Almacen;
