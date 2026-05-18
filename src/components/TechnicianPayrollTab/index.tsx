import { useState } from 'react';
import {
  Grid,
  Skeleton,
  Alert,
  Card,
  CardHeader,
  Divider,
  Typography,
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
  Chip,
  Tooltip,
  Switch,
  IconButton,
  Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BuildIcon from '@mui/icons-material/Build';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { formatTZDate, convertDateToTZ } from 'lib/client/utils';
import { getFetcher, useGetReport } from 'pages/api/useRequest';
import { updateTechnicianBonus } from 'lib/client/techniciansFetch';
import { useSnackbar } from 'notistack';

interface TechnicianPayrollTabProps {
  weekStart: Date;
  weekEnd: Date;
  userRole: string;
  userId: string;
}

function TechnicianPayrollTab({ weekStart, weekEnd, userRole, userId }: TechnicianPayrollTabProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [updatingBonus, setUpdatingBonus] = useState<string | null>(null);
  const [expandedFailures, setExpandedFailures] = useState<Record<string, boolean>>({});

  const { reportData, reportError } = useGetReport(
    getFetcher,
    'technicians',
    null,
    convertDateToTZ(weekStart),
    convertDateToTZ(weekEnd)
  );

  const generalError = reportError;
  const completeData = reportData;

  const handleToggleBonus = async (technicianId: string, bonusType: 'punctuality' | 'repair', currentActive: boolean) => {
    if (userRole !== 'ADMIN') return;

    setUpdatingBonus(`${technicianId}-${bonusType}`);
    const weekStartStr = formatTZDate(convertDateToTZ(weekStart), 'YYYY-MM-DD');
    const result = await updateTechnicianBonus({
      technicianId,
      weekStart: weekStartStr,
      bonusType,
      active: !currentActive
    }, weekStartStr, formatTZDate(convertDateToTZ(weekEnd), 'YYYY-MM-DD'));
    setUpdatingBonus(null);

    if (!result.error) {
      enqueueSnackbar(result.msg, { variant: 'success' });
    } else {
      enqueueSnackbar(result.msg, { variant: 'error' });
    }
  };

  const handleToggleFailures = (technicianId: string) => {
    setExpandedFailures(prev => ({
      ...prev,
      [technicianId]: !prev[technicianId]
    }));
  };

  if (generalError) {
    return <Alert severity="error">{reportError?.message}</Alert>;
  }

  if (!completeData) {
    return (
      <Skeleton
        variant="rectangular"
        width={'100%'}
        height={500}
        animation="wave"
      />
    );
  }

  if (!completeData.technicians || completeData.technicians.length === 0) {
    return (
      <Alert severity="info">
        No se encontraron datos de técnicos para la semana seleccionada.
      </Alert>
    );
  }

  return (
    <>
      {/* Summary cards */}
      {userRole === 'ADMIN' && (
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
                ${(completeData.totalPayment || 0).toFixed(2)}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Per-technician accordion */}
      {completeData.technicians.map((techReport) => (
        <Accordion key={techReport.technician._id} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#f5f5f5' }}
          >
            <Box display="flex" alignItems="center" gap={2} width="100%" flexWrap="wrap">
              <Typography variant="h6" fontWeight="bold">
                {techReport.technician.name}
              </Typography>
              {techReport.technician.startM >= 0 &&
                techReport.technician.range !== '-1 - -1' && (
                  <Chip label={`Rango: ${techReport.technician.range}`} color="primary" size="small" />
                )}
              <Chip label={`${techReport.totalMachines} cambios`} color="warning" size="small" />
              <Chip label={`${techReport.totalMaintenances} mantenimientos`} color="success" size="small" />
              <Chip label={`${techReport.conditioningCount} reacondicionadas`} color="success" size="small" variant="outlined" />
              <Chip
                label={`Total: $${techReport.totalPayment.toFixed(2)}`}
                color="info"
                size="small"
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {/* Payment Summary */}
            <Box mb={3} p={2} sx={{ backgroundColor: '#fafafa', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Resumen de Pago
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
                    <Typography variant="subtitle2" color="text.secondary">Mantenimientos</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ${techReport.maintenancesPayment?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {techReport.payableMaintenances} × ${techReport.technician.tecPay}
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{ p: 2, backgroundColor: '#e0f2f1' }}>
                    <Typography variant="subtitle2" color="text.secondary">Reacondicionadas</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ${techReport.conditioningPayment?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {techReport.conditioningCount || 0} × $200
                    </Typography>
                  </Card>
                </Grid>

                {/* Punctuality bonus */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{
                    p: 2,
                    backgroundColor: techReport.bonuses?.punctuality?.active ? '#e3f2fd' : '#ffebee',
                    border: techReport.bonuses?.punctuality?.active ? '2px solid #2196f3' : '2px solid #f44336'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                          Puntualidad
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {techReport.bonuses?.punctuality?.active ? `$${techReport.bonuses.punctuality.amount}` : '$0.00'}
                        </Typography>
                      </Box>
                      {userRole === 'ADMIN' && (
                        <Tooltip title={techReport.bonuses?.punctuality?.active ? 'Quitar bono' : 'Dar bono'}>
                          <Switch
                            checked={techReport.bonuses?.punctuality?.active || false}
                            onChange={() => handleToggleBonus(techReport.technician._id, 'punctuality', techReport.bonuses?.punctuality?.active)}
                            disabled={updatingBonus === `${techReport.technician._id}-punctuality`}
                            color="primary"
                            size="small"
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Chip
                      label={techReport.bonuses?.punctuality?.active ? 'Activo' : 'Desactivado'}
                      color={techReport.bonuses?.punctuality?.active ? 'success' : 'error'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Card>
                </Grid>

                {/* Repair bonus */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{
                    p: 2,
                    backgroundColor: techReport.bonuses?.repair?.active ? '#fff3e0' : '#ffebee',
                    border: techReport.bonuses?.repair?.active ? '2px solid #ff9800' : '2px solid #f44336'
                  }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        <BuildIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        0 por reparar
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {techReport.bonuses?.repair?.active ? `$${techReport.bonuses.repair.amount}` : '$0.00'}
                      </Typography>
                    </Box>
                    <Tooltip title={
                      techReport.bonuses?.repair?.totalMaintenances === 0
                        ? 'Sin mantenimientos esta semana'
                        : `${techReport.bonuses?.repair?.completedMaintenances}/${techReport.bonuses?.repair?.totalMaintenances} completados antes del jueves`
                    }>
                      <Chip
                        label={
                          techReport.bonuses?.repair?.active
                            ? `✓ ${techReport.bonuses?.repair?.completedMaintenances}/${techReport.bonuses?.repair?.totalMaintenances}`
                            : `✗ ${techReport.bonuses?.repair?.completedMaintenances}/${techReport.bonuses?.repair?.totalMaintenances}`
                        }
                        color={techReport.bonuses?.repair?.active ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Tooltip>
                  </Card>
                </Grid>

                {/* No Failures bonus */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{
                    p: 2,
                    backgroundColor: techReport.bonuses?.noFailures?.active ? '#f1f8e9' : '#ffebee',
                    border: techReport.bonuses?.noFailures?.active ? '2px solid #8bc34a' : '2px solid #f44336'
                  }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        No Fallas
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {techReport.bonuses?.noFailures?.active ? `$${techReport.bonuses.noFailures.amount}` : '$0.00'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                      <Chip
                        label={
                          techReport.bonuses?.noFailures?.active
                            ? `✓ ${techReport.bonuses?.noFailures?.failuresCount || 0}/5 fallas`
                            : `✗ ${techReport.bonuses?.noFailures?.failuresCount || 0}/5 fallas`
                        }
                        color={techReport.bonuses?.noFailures?.active ? 'success' : 'error'}
                        size="small"
                      />
                      {techReport.bonuses?.noFailures?.failures &&
                        techReport.bonuses.noFailures.failures.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => handleToggleFailures(techReport.technician._id)}
                            sx={{ ml: 1 }}
                          >
                            {expandedFailures[techReport.technician._id] ?
                              <KeyboardArrowUpIcon fontSize="small" /> :
                              <KeyboardArrowDownIcon fontSize="small" />
                            }
                          </IconButton>
                        )}
                    </Box>

                    {techReport.bonuses?.noFailures?.failures &&
                      techReport.bonuses.noFailures.failures.length > 0 && (
                        <Collapse in={expandedFailures[techReport.technician._id]} timeout="auto" unmountOnExit>
                          <Box mt={2} sx={{ maxHeight: 150, overflowY: 'auto' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
                              Equipos reportados:
                            </Typography>
                            {techReport.bonuses.noFailures.failures.map((failure, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  fontSize: '0.7rem',
                                  p: 0.5,
                                  mb: 0.5,
                                  backgroundColor: 'rgba(0,0,0,0.05)',
                                  borderRadius: 1,
                                  borderLeft: '2px solid #f44336'
                                }}
                              >
                                <Typography variant="caption" fontWeight="bold" display="block">
                                  Equipo #{failure.machineNum}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {formatTZDate(failure.date, 'DD/MM/YY HH:mm')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                                  {failure.problem}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      )}
                  </Card>
                </Grid>

                {/* Total */}
                <Grid item xs={12} sm={6} md={2.4}>
                  <Card sx={{ p: 2, backgroundColor: '#f3e5f5', border: '2px solid #9c27b0' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Semanal</Typography>
                    <Typography variant="h4" fontWeight="bold" color="secondary">
                      ${techReport.totalPayment?.toFixed(2) || '0.00'}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Changes table */}
            {techReport.machines && techReport.machines.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" mb={1} color="warning.main">
                  Equipos con Cambios ({techReport.totalMachines})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['# Equipo', 'Fecha Cambio', 'Último Mant.', 'Última Renta', 'Estado', '¿Reparado?', 'Problema', 'Solución'].map(h => (
                          <TableCell key={h} align="center" sx={{ fontWeight: 'bold', backgroundColor: '#35AEE2' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {techReport.machines.map((machine) => (
                        <TableRow key={machine._id} hover>
                          <TableCell align="center"><Typography fontWeight="bold">{machine.machineNum}</Typography></TableCell>
                          <TableCell align="center">{formatTZDate(machine.latestChange.date, 'DD MMM YYYY')}</TableCell>
                          <TableCell align="center">{machine.latestMaintenanceDate ? formatTZDate(machine.latestMaintenanceDate, 'DD/MM/YYYY') : 'N/A'}</TableCell>
                          <TableCell align="center">{machine.latestMovementDate ? formatTZDate(machine.latestMovementDate, 'DD/MM/YYYY') : 'N/A'}</TableCell>
                          <TableCell align="center">
                            <Chip label={machine.latestChange.status} color={machine.latestChange.status === 'FINALIZADO' ? 'success' : 'warning'} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={machine.latestChange.wasFixed ? 'SÍ' : 'NO'} color={machine.latestChange.wasFixed ? 'success' : 'error'} size="small" />
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="body2">
                              {machine.latestChange.problemDesc !== 'N/A' ? machine.latestChange.problemDesc : machine.latestChange.reason}
                            </Typography>
                          </TableCell>
                          <TableCell align="left"><Typography variant="body2">{machine.latestChange.solutionDesc}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Maintenances table */}
            {techReport.completedMaintenances && techReport.completedMaintenances.length > 0 && (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    Mantenimientos Completados ({techReport.totalMaintenances})
                  </Typography>
                  <Chip label={`${techReport.payableMaintenances} pagables`} color="info" size="small" />
                  <Typography variant="body2" color="text.secondary">
                    (Tarifa: ${techReport.technician.tecPay} × {techReport.payableMaintenances} = ${techReport.totalPayment.toFixed(2)})
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['# Equipo', 'Problema', 'Fecha Completado', 'Estado Pago'].map(h => (
                          <TableCell key={h} align="center" sx={{ fontWeight: 'bold', backgroundColor: '#4caf50' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {techReport.completedMaintenances.map((machine, index) => (
                        <TableRow key={index} hover>
                          <TableCell align="center"><Typography fontWeight="bold">{machine.machineNum}</Typography></TableCell>
                          <TableCell align="center"><Typography variant="body2">{machine.previousChangeProblem}</Typography></TableCell>
                          <TableCell align="center">{formatTZDate(machine.finishedAt, 'DD/MM/YYYY HH:mm')}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={machine.excludedFromPayment ? 'No Pagable' : 'Pagable'}
                              color={machine.excludedFromPayment ? 'error' : 'success'}
                              size="small"
                            />
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
    </>
  );
}

export default TechnicianPayrollTab;
