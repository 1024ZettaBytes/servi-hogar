import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  CardHeader,
  Divider,
  Typography,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip
} from '@mui/material';
import Footer from '@/components/Footer';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  capitalizeFirstLetter,
  getLastWeekDay,
  getFirstWeekDay,
  printElement,
  sleep,
  formatTZDate,
  convertDateToLocal,
  convertDateToTZ
} from 'lib/client/utils';
import WeekPicker from '@/components/WeekPicker';
import { getFetcher, useGetReport } from 'pages/api/useRequest';


function TechniciansReport({ session }) {
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    convertDateToLocal(new Date())
  );
  const [start, setStart] = useState<Date>(
    getFirstWeekDay(convertDateToLocal(new Date()))
  );
  const [end, setEnd] = useState<Date>(
    getLastWeekDay(convertDateToLocal(new Date()))
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  
  const { reportData, reportError } = useGetReport(
        getFetcher,
        'technicians',
        convertDateToTZ(start),
        convertDateToTZ(end)
  );
  
  const generalError = reportError;
  const completeData = reportData;
  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `TECNICOS_${formatTZDate(
      start,
      'DD-MMMM-YYYY'
    )}_al_${formatTZDate(end, 'DD-MMMM-YYYY')}.pdf`;
    await printElement(document, fileName);
    setIsPrinting(false);
  };
  
  const handleOnSelectDate = (newValue) => {
    if (newValue && newValue.toString() !== 'Invalid Date') {
      setSelectedDate(newValue);
      setStart(getFirstWeekDay(newValue));
      setEnd(getLastWeekDay(newValue));
    }
  };
  
  const button = {
    text: 'Descargar PDF',
    onClick: handleClickOpen,
    startIcon: <CloudDownloadIcon />,
    isLoading: isPrinting,
    variant: 'outlined',
    color: 'info'
  };
  
  const getHeader = () => {
    const startMonthDay = start.getDate();
    const endMonthDay = end.getDate();
    const startMonth = capitalizeFirstLetter(formatTZDate(start, 'MMMM'));
    const endMonth = capitalizeFirstLetter(formatTZDate(end, 'MMMM'));
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    return `${startMonthDay}/${startMonth}/${startYear} - ${endMonthDay}/${endMonth}/${endYear}`;
  };

  return (
    <>
      <Head>
        <title>Reportes | Técnicos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Reporte de Técnicos'}
          subtitle={'Equipos con cambios en la semana seleccionada'}
          button={!generalError && completeData ? button : null}
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Card sx={{ px: 1, mb: 1 }}>
          <CardContent>
            <Grid container>
              <Grid
                item
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                lg={12}
                mr={1}
              >
                <Typography fontWeight={'bold'} fontSize={16}>
                  Seleccione la semana:{' '}
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <WeekPicker
                  selectedValue={selectedDate}
                  start={start}
                  end={end}
                  handleOnChange={handleOnSelectDate}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Grid container>
          <Grid item lg={12}>
            <Card id="reportTable">
              {generalError ? (
                <Alert severity="error">{reportError?.message}</Alert>
              ) : !completeData ? (
                <Skeleton
                  variant="rectangular"
                  width={'100%'}
                  height={500}
                  animation="wave"
                />
              ) : (
                <div>
                  <CardHeader
                    sx={{
                      display: 'flex',
                      textAlign: 'center',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap'
                    }}
                    title={'REPORTE DE TÉCNICOS'}
                    subheader={getHeader()}
                  />
                  <Divider />
                  
                  {completeData.technicians && completeData.technicians.length > 0 ? (
                    <Box p={2}>
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ backgroundColor: '#e3f2fd', p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Técnicos
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {completeData.totalTechnicians}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ backgroundColor: '#fff3e0', p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Equipos
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {completeData.totalMachines}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ backgroundColor: '#e8f5e9', p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Mantenimientos Completados
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {completeData.totalMaintenances}
                            </Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ backgroundColor: '#f3e5f5', p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Total a Pagar
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                              ${completeData.technicians.reduce((sum, t) => sum + (t.totalPayment || 0), 0).toFixed(2)}
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                      
                      {completeData.technicians.map((techReport) => (
                        <Accordion key={techReport.technician._id} defaultExpanded>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ backgroundColor: '#f5f5f5' }}
                          >
                            <Box display="flex" alignItems="center" gap={2} width="100%">
                              <Typography variant="h6" fontWeight="bold">
                                {techReport.technician.name}
                              </Typography>
                              <Chip 
                                label={`Rango: ${techReport.technician.range}`} 
                                color="primary" 
                                size="small" 
                              />
                              <Chip 
                                label={`${techReport.totalMachines} cambios`} 
                                color="warning" 
                                size="small" 
                              />
                              <Chip 
                                label={`${techReport.totalMaintenances} mantenimientos`} 
                                color="success" 
                                size="small" 
                              />
                              <Chip 
                                label={`Pago: $${techReport.totalPayment.toFixed(2)}`} 
                                color="info" 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {/* Changes section */}
                            {techReport.machines && techReport.machines.length > 0 && (
                              <Box mb={3}>
                                <Typography variant="h6" fontWeight="bold" mb={1} color="warning.main">
                                  Equipos con Cambios ({techReport.totalMachines})
                                </Typography>
                                <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      # Equipo
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Fecha Cambio
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Último Mantenimiento
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Inicio Última Renta
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Estado
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      ¿Reparado?
                                    </TableCell>
                                    <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Problema
                                    </TableCell>
                                    <TableCell align="left" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                                      Solución
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {techReport.machines.map((machine) => (
                                    <TableRow key={machine._id} hover>
                                      <TableCell align="center">
                                        <Typography fontWeight="bold">
                                          {machine.machineNum}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        {formatTZDate(machine.latestChange.date, 'DD MMM YYYY')}
                                      </TableCell>
                                      <TableCell align="center">
                                        {machine.latestMaintenanceDate 
                                          ? formatTZDate(machine.latestMaintenanceDate, 'DD/MM/YYYY')
                                          : 'N/A'
                                        }
                                      </TableCell>
                                      <TableCell align="center">
                                        {machine.latestMovementDate 
                                          ? formatTZDate(machine.latestMovementDate, 'DD/MM/YYYY')
                                          : 'N/A'
                                        }
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          label={machine.latestChange.status} 
                                          color={machine.latestChange.status === 'FINALIZADO' ? 'success' : 'warning'}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip 
                                          label={machine.latestChange.wasFixed ? 'SÍ' : 'NO'} 
                                          color={machine.latestChange.wasFixed ? 'success' : 'error'}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell align="left">
                                        <Typography variant="body2">
                                          {machine.latestChange.problemDesc}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="left">
                                        <Typography variant="body2">
                                          {machine.latestChange.solutionDesc}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                              </Box>
                            )}
                            
                            {/* Maintenance section */}
                            {techReport.completedMaintenances && techReport.completedMaintenances.length > 0 && (
                              <Box>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                  <Typography variant="h6" fontWeight="bold" color="success.main">
                                    Mantenimientos Completados ({techReport.totalMaintenances})
                                  </Typography>
                                  <Chip 
                                    label={`${techReport.payableMaintenances} pagables`}
                                    color="info"
                                    size="small"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    (Tarifa: ${techReport.technician.tecPay} × {techReport.payableMaintenances} = ${techReport.totalPayment.toFixed(2)})
                                  </Typography>
                                </Box>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#4caf50' }}>
                                          # Equipo
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#4caf50' }}>
                                          Fecha Completado
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#4caf50' }}>
                                          Estado Pago
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {techReport.completedMaintenances.map((machine, index) => (
                                        <TableRow key={index} hover>
                                          <TableCell align="center">
                                            <Typography fontWeight="bold">
                                              {machine.machineNum}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="center">
                                            {formatTZDate(machine.finishedAt, 'DD/MM/YYYY HH:mm')}
                                          </TableCell>
                                          <TableCell align="center">
                                            {machine.excludedFromPayment ? (
                                              <Chip 
                                                label="No Pagable" 
                                                color="error" 
                                                size="small"
                                                title="Este equipo también tuvo un cambio y no se incluye en el pago"
                                              />
                                            ) : (
                                              <Chip 
                                                label="Pagable" 
                                                color="success" 
                                                size="small"
                                              />
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      ))}
                      
                      {/* Remove the old separate maintenance section */}
                      {/* Maintenance completed section has been integrated into each technician accordion */}
                    </Box>
                  ) : (
                    <Box p={3}>
                      <Alert severity="info">
                        No se encontraron equipos que cumplan los criterios para la semana seleccionada.
                      </Alert>
                    </Box>
                  )}
                </div>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

TechniciansReport.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}

export default TechniciansReport;
