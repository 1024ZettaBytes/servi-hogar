import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  CardHeader,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import Footer from '@/components/Footer';
import {
  useGetTechnicianTools,
  getFetcher
} from '../api/useRequest';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import BuildIcon from '@mui/icons-material/Build';
import VerifiedIcon from '@mui/icons-material/Verified';
import AssignToolsModal from '@/components/AuxToolVerificationModal/AssignToolsModal';
import AuxVerifyModal from '@/components/AuxToolVerificationModal/AuxVerifyModal';
import { useSnackbar } from 'notistack';

function Herramientas({}) {
  const paths = ['Inicio', 'Herramientas'];
  const { enqueueSnackbar } = useSnackbar();
  const { toolsData, toolsError, isLoadingTools } =
    useGetTechnicianTools(getFetcher);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const tools = toolsData?.tools || [];
  const technicians = toolsData?.technicians || [];
  const assignments = toolsData?.assignments || [];
  const pendingAuxVerifications = toolsData?.pendingAuxVerifications || [];

  const getAssignmentForTech = (techId) => {
    return assignments.find(
      (a) => a.technician?._id === techId
    );
  };

  const getStatusChip = (assignment) => {
    if (!assignment) {
      return (
        <Chip
          label="SIN ASIGNAR"
          color="default"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    switch (assignment.status) {
      case 'PENDING_AUX_VERIFICATION':
        return (
          <Chip
            label="PENDIENTE VERIFICACIÓN AUX"
            color="warning"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'PENDING_TECH_CONFIRMATION':
        return (
          <Chip
            label="PENDIENTE CONFIRMACIÓN TÉC"
            color="info"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'CONFIRMED':
        return (
          <Chip
            label="CONFIRMADO"
            color="success"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      default:
        return null;
    }
  };

  const handleCloseAssign = (success, message) => {
    setAssignModalOpen(false);
    setSelectedTechnician(null);
    if (success && message) {
      enqueueSnackbar(message, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  const handleCloseVerify = (success, message) => {
    setVerifyModalOpen(false);
    setSelectedAssignment(null);
    if (success && message) {
      enqueueSnackbar(message, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 2000
      });
    }
  };

  return (
    <>
      <Head>
        <title>Herramientas</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Herramientas'} sutitle={''} />
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
          {/* Pending AUX Verifications */}
          {pendingAuxVerifications.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Verificaciones Pendientes"
                  subheader="Estas asignaciones requieren verificación con foto"
                />
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Técnico</TableCell>
                        <TableCell align="center">Reemplaza a</TableCell>
                        <TableCell align="center">Herramientas</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingAuxVerifications.map((assignment) => (
                        <TableRow key={assignment._id}>
                          <TableCell align="center">
                            <Typography fontWeight="bold">
                              {assignment.technician?.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {assignment.replacedTechnician?.name || '-'}
                          </TableCell>
                          <TableCell align="center">
                            {assignment.tools?.length || 0} herramientas
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Verificar con foto" arrow>
                              <IconButton
                                color="warning"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setVerifyModalOpen(true);
                                }}
                              >
                                <VerifiedIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          )}

          {/* Technicians Tool Assignments */}
          <Grid item xs={12}>
            {toolsError ? (
              <Alert severity="error">{toolsError?.message}</Alert>
            ) : isLoadingTools ? (
              <Skeleton
                variant="rectangular"
                width={'100%'}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <CardHeader
                  title="Técnicos y Herramientas"
                  subheader="Asignación de herramientas a técnicos"
                />
                <Divider />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Técnico</TableCell>
                        <TableCell align="center">Rango Equipos</TableCell>
                        <TableCell align="center">Estado Herramientas</TableCell>
                        <TableCell align="center">Herramientas</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {technicians.map((tech) => {
                        const assignment = getAssignmentForTech(tech._id);
                        return (
                          <TableRow key={tech._id}>
                            <TableCell align="center">
                              <Typography fontWeight="bold">
                                {tech.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {tech.startM > 0 && tech.endM > 0
                                ? `${tech.startM} - ${tech.endM}`
                                : 'Sin asignar'}
                            </TableCell>
                            <TableCell align="center">
                              {getStatusChip(assignment)}
                            </TableCell>
                            <TableCell align="center">
                              {assignment
                                ? `${assignment.tools?.length || 0} herramientas`
                                : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Asignar herramientas" arrow>
                                <IconButton
                                  color="primary"
                                  onClick={() => {
                                    setSelectedTechnician(tech);
                                    setAssignModalOpen(true);
                                  }}
                                >
                                  <BuildIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {assignModalOpen && selectedTechnician && (
        <AssignToolsModal
          open={assignModalOpen}
          technician={selectedTechnician}
          tools={tools}
          currentAssignment={getAssignmentForTech(selectedTechnician._id)}
          handleOnClose={handleCloseAssign}
        />
      )}

      {verifyModalOpen && selectedAssignment && (
        <AuxVerifyModal
          open={verifyModalOpen}
          assignment={selectedAssignment}
          handleOnClose={handleCloseVerify}
        />
      )}

      <Footer />
    </>
  );
}

Herramientas.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default Herramientas;
