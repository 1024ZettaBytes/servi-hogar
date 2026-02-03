import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import numeral from 'numeral';
import {
  formatTZDate,
  dateFromString
} from '../../../lib/client/utils';
import PayrollConfigModal from '../PayrollConfigModal';
import PayrollWeeklyModal from '../PayrollWeeklyModal';
import {
  getFetcher,
  useGetAuxUsers,
  useGetWeeklyPayroll
} from '../../../pages/api/useRequest';

interface PayrollCardProps {
  userRole: string;
  currentUserId?: string;
  weekStartStr: string;
  collectionBonus?: number;
}

export default function PayrollCard({ userRole, currentUserId, weekStartStr, collectionBonus = 0 }: PayrollCardProps) {
  const theme = useTheme();
  const isAdmin = userRole === 'ADMIN';

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    isAdmin ? null : currentUserId || null
  );
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch aux users for admin dropdown
  const { auxUsersData, auxUsersError, isLoadingAuxUsers } = useGetAuxUsers(
    isAdmin ? getFetcher : () => null
  );

  // Set initial user for admin when users load
  useEffect(() => {
    if (isAdmin && auxUsersData && auxUsersData.length > 0 && !selectedUserId) {
      setSelectedUserId(auxUsersData[0]._id);
    }
  }, [isAdmin, auxUsersData, selectedUserId]);

  // Fetch payroll data - pass string date to avoid timezone issues
  const { payrollData, payrollError, isLoadingPayroll, swrKey } = useGetWeeklyPayroll(
    getFetcher,
    selectedUserId,
    weekStartStr
  );

  // Modal handlers
  const handleConfigModalClose = (success?: boolean, message?: string) => {
    setConfigModalOpen(false);
    if (success && message) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleWeeklyModalClose = (success?: boolean, message?: string) => {
    setWeeklyModalOpen(false);
    if (success && message) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!payrollData || !payrollData.config) {
      return {
        perceptions: 0,
        deductions: 0,
        netPay: 0
      };
    }

    const { config, weeklyData, calculated } = payrollData;

    // Perceptions
    let perceptions = config.baseSalary || 0;
    if (weeklyData?.punctualityBonusApplied !== false) {
      perceptions += config.punctualityBonusAmount || 0;
    }
    perceptions += calculated?.salesCommission || 0;
    
    // Collection bonus (passed from parent) - only if enabled for this user
    if (config.collectionBonusEnabled !== false) {
      perceptions += collectionBonus;
    }
    
    // Extra perceptions
    if (weeklyData?.extraPerceptions) {
      perceptions += weeklyData.extraPerceptions.reduce((sum, item) => sum + item.amount, 0);
    }

    // Deductions
    let deductions = 0;
    if (weeklyData?.restDays) {
      deductions += weeklyData.restDays.length * (config.restDayDeductionAmount || 0);
    }
    
    // Extra deductions
    if (weeklyData?.extraDeductions) {
      deductions += weeklyData.extraDeductions.reduce((sum, item) => sum + item.amount, 0);
    }

    return {
      perceptions,
      deductions,
      netPay: perceptions - deductions
    };
  };

  const totals = calculateTotals();

  // Loading state
  if ((isAdmin && isLoadingAuxUsers) || (!selectedUserId && isAdmin)) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (auxUsersError || payrollError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Error al cargar datos: {auxUsersError?.message || payrollError?.message}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // No config state
  const hasConfig = payrollData?.config;
  const selectedUser = isAdmin
    ? auxUsersData?.find((u) => u._id === selectedUserId)
    : payrollData?.user;

  return (
    <>
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.colors.primary.main, 0.05)} 0%, ${alpha(theme.colors.info.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.colors.primary.main, 0.2)}`
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={2}>
            <ReceiptLongIcon
              sx={{ fontSize: 40, color: theme.colors.primary.main, mr: 2 }}
            />
            <Typography variant="h4" fontWeight="bold">
              Detalle de Nómina
            </Typography>
          </Box>

          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {/* Controls */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            {/* Admin: User Selector */}
            {isAdmin && auxUsersData && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={selectedUserId || ''}
                    label="Usuario"
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {auxUsersData.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {isLoadingPayroll ? (
            <Skeleton variant="rectangular" height={250} />
          ) : !hasConfig ? (
            <Box textAlign="center" py={4}>
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay configuración de nómina para este usuario.
              </Alert>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  onClick={() => setConfigModalOpen(true)}
                >
                  Configurar Nómina
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Employee Info Header */}
              <Box
                sx={{
                  backgroundColor: alpha(theme.colors.primary.main, 0.1),
                  borderRadius: 1,
                  p: 2,
                  mb: 2
                }}
              >
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedUser?.name || payrollData?.user?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {payrollData.calculated?.vacationDaysRemaining || 0} días de vacaciones |{' '}
                      {payrollData.calculated?.seniority || 0} año(s) antigüedad |{' '}
                      Ingreso: {formatTZDate(new Date(payrollData.config.hireDate), 'DD MMM YYYY')}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle2" color="primary">
                      PERCEPCIONES
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Perceptions Table */}
              <Table size="small">
                <TableBody>
                  {/* Base Salary */}
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5 }}>
                      <Typography variant="body2">
                        {payrollData.config.baseSalaryDescription || 'SUELDO BASE'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                      <Typography variant="body2">
                        $ {numeral(payrollData.config.baseSalary).format('0,0.00')}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Punctuality Bonus */}
                  {payrollData.config.punctualityBonusAmount > 0 && (
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {payrollData.weeklyData?.punctualityBonusApplied !== false ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color="error" />
                          )}
                          <Typography variant="body2">PUNTUALIDAD Y ASISTENCIA</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography
                          variant="body2"
                          color={
                            payrollData.weeklyData?.punctualityBonusApplied !== false
                              ? 'text.primary'
                              : 'text.disabled'
                          }
                          sx={{
                            textDecoration:
                              payrollData.weeklyData?.punctualityBonusApplied === false
                                ? 'line-through'
                                : 'none'
                          }}
                        >
                          $ {numeral(payrollData.config.punctualityBonusAmount).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Sales Commission */}
                  <TableRow>
                    <TableCell sx={{ border: 'none', py: 0.5 }} colSpan={2}>
                      <Accordion
                        disableGutters
                        elevation={0}
                        sx={{
                          backgroundColor: 'transparent',
                          '&:before': { display: 'none' },
                          '& .MuiAccordionSummary-root': {
                            minHeight: 'auto',
                            p: 0
                          },
                          '& .MuiAccordionSummary-content': {
                            m: 0
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={
                            (payrollData.calculated?.salesCount || 0) > 0 ? (
                              <ExpandMoreIcon fontSize="small" />
                            ) : null
                          }
                          sx={{ cursor: (payrollData.calculated?.salesCount || 0) > 0 ? 'pointer' : 'default' }}
                        >
                          <Box display="flex" justifyContent="space-between" width="100%" pr={1}>
                            <Typography variant="body2">
                              VENTAS ({payrollData.calculated?.salesCount || 0} × $200)
                            </Typography>
                            <Typography variant="body2">
                              $ {numeral(payrollData.calculated?.salesCommission || 0).format('0,0.00')}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        {(payrollData.calculated?.salesList?.length > 0) && (
                          <AccordionDetails sx={{ p: 0, pl: 2 }}>
                            <List dense disablePadding>
                              {payrollData.calculated.salesList.map((sale, idx) => (
                                <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                                  <ListItemText
                                    primary={
                                      <Typography variant="caption" color="text.secondary">
                                        #{sale.saleNum} - {sale.customerName}
                                      </Typography>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        )}
                      </Accordion>
                    </TableCell>
                  </TableRow>

                  {/* Collection Bonus - only show if enabled for this user */}
                  {collectionBonus > 0 && payrollData.config.collectionBonusEnabled !== false && (
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: theme.colors.warning.main }}>
                          BONO COBRANZA ({collectionBonus === 500 ? '85%' : '80%'})
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: theme.colors.warning.main }}>
                          $ {numeral(collectionBonus).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Extra Perceptions */}
                  {payrollData.weeklyData?.extraPerceptions?.map((item, index) => (
                    <TableRow key={`perception-${index}`}>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">{item.concept}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">
                          $ {numeral(item.amount).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total Perceptions */}
              <Box
                sx={{
                  backgroundColor: alpha(theme.colors.success.main, 0.1),
                  borderRadius: 1,
                  p: 1.5,
                  my: 2
                }}
              >
                <Grid container justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight="bold">
                    TOTAL PERCEPCIONES
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                    $ {numeral(totals.perceptions).format('0,0.00')}
                  </Typography>
                </Grid>
              </Box>

              {/* Deductions Header */}
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                DESCUENTOS
              </Typography>

              {/* Deductions Table */}
              <Table size="small">
                <TableBody>
                  {/* Rest Days / Vacation Days */}
                  {payrollData.weeklyData?.restDays?.map((restDay, index) => (
                    <TableRow key={`rest-${index}`}>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">
                          {restDay.type === 'VACACIONES' ? 'VACACIONES' : 'DESCANSO'}{' - '}
                          {restDay.description ||
                            formatTZDate(dateFromString(restDay.date), 'DD MMM YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" color="error">
                          $ {numeral(payrollData.config.restDayDeductionAmount).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Extra Deductions */}
                  {payrollData.weeklyData?.extraDeductions?.map((item, index) => (
                    <TableRow key={`deduction-${index}`}>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2">{item.concept}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ border: 'none', py: 0.5 }}>
                        <Typography variant="body2" color="error">
                          $ {numeral(item.amount).format('0,0.00')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* No deductions message */}
                  {(!payrollData.weeklyData?.restDays?.length &&
                    !payrollData.weeklyData?.extraDeductions?.length) && (
                    <TableRow>
                      <TableCell sx={{ border: 'none', py: 0.5 }} colSpan={2}>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Sin descuentos esta semana
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Net Pay */}
              <Box
                sx={{
                  backgroundColor: alpha(theme.colors.info.main, 0.15),
                  borderRadius: 1,
                  p: 2,
                  mt: 2,
                  border: `2px solid ${theme.colors.info.main}`
                }}
              >
                <Grid container justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    NETO A PAGAR
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    $ {numeral(totals.netPay).format('0,0.00')}
                  </Typography>
                </Grid>
              </Box>

              {/* Notes */}
              {payrollData.weeklyData?.notes && (
                <Box
                  sx={{
                    backgroundColor: alpha(theme.colors.warning.main, 0.1),
                    borderRadius: 1,
                    p: 2,
                    mt: 2,
                    borderLeft: `4px solid ${theme.colors.warning.main}`
                  }}
                >
                  <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                    NOTAS
                  </Typography>
                  <Typography variant="body2">
                    {payrollData.weeklyData.notes}
                  </Typography>
                </Box>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Tooltip title="Configurar valores base del usuario">
                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => setConfigModalOpen(true)}
                    >
                      Configurar
                    </Button>
                  </Tooltip>
                  <Tooltip title="Editar datos de esta semana">
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setWeeklyModalOpen(true)}
                    >
                      Editar Semana
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Config Modal */}
      {isAdmin && selectedUserId && payrollData?.weeklyData && configModalOpen && (
        <PayrollConfigModal
          open={configModalOpen}
          userId={selectedUserId}
          userName={selectedUser?.name || ''}
          currentConfig={payrollData?.config || null}
          swrKey={swrKey}
          handleOnClose={handleConfigModalClose}
        />
      )}

      {/* Weekly Modal */}
      {isAdmin && selectedUserId && payrollData?.config && weeklyModalOpen && (
        <PayrollWeeklyModal
          open={weeklyModalOpen}
          userId={selectedUserId}
          userName={selectedUser?.name || ''}
          weekStart={payrollData?.weekStart}
          weekEnd={payrollData?.weekEnd}
          currentWeeklyData={payrollData?.weeklyData || null}
          vacationDaysRemaining={payrollData?.calculated?.vacationDaysRemaining || 0}
          swrKey={swrKey}
          handleOnClose={handleWeeklyModalClose}
        />
      )}
    </>
  );
}
