import Head from 'next/head';
import { getSession, useSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddTwoTone from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import Footer from '@/components/Footer';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { useSnackbar } from 'notistack';
import {
  getFetcher,
  useGetRouteCashSummary,
  useGetOfficeCashBox,
  useGetCashCuts
} from '../api/useRequest';
import CloseRouteCutModal from '@/components/CashCut/CloseRouteCutModal';
import DepositReceiptModal from '@/components/CashCut/DepositReceiptModal';
import CloseShiftModal from '@/components/CashCut/CloseShiftModal';
import ConfirmBoxModal from '@/components/CashCut/ConfirmBoxModal';
import AddCashExpenseModal from '@/components/CashCut/AddCashExpenseModal';
import EditAmountModal from '@/components/CashCut/EditAmountModal';
import TablaCortes from '@/components/CashCut/TablaCortes';
import { formatTZDate } from 'lib/client/utils';
import { CASH_EXPENSE_CONCEPTS } from '../../lib/consts/OBJ_CONTS';

const money = (value) => `$${Number(value || 0).toLocaleString('es-MX')}`;

function CorteCaja() {
  const paths = ['Inicio', 'Corte de caja'];
  const { enqueueSnackbar } = useSnackbar();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userId = (session?.user as any)?.id;

  const isOperator = userRole === 'OPE';
  const isOffice = userRole === 'ADMIN' || userRole === 'AUX';
  const isAdmin = userRole === 'ADMIN';

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const [routeCutOpen, setRouteCutOpen] = useState(false);
  const [depositCut, setDepositCut] = useState(null);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [confirmCut, setConfirmCut] = useState(null);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // El admin ve ambas secciones: cobra en calle igual que un operador y puede
  // depositar por cuenta de ellos. Un AUX solo maneja caja de oficina.
  const showRouteSection = isOperator || isAdmin;
  const { routeCashSummary, routeCashSummaryError, isLoadingRouteCash } =
    useGetRouteCashSummary(showRouteSection ? getFetcher : () => null);
  const { officeCashBox, officeCashBoxError, isLoadingOfficeBox } =
    useGetOfficeCashBox(isOffice ? getFetcher : () => null);
  const { cashCuts, cashCutsError, isLoadingCashCuts } = useGetCashCuts(
    getFetcher,
    limit,
    page + 1
  );

  const notify = (result) => {
    enqueueSnackbar(result.msg, {
      variant: result.error ? 'error' : 'success',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
      autoHideDuration: 3000
    });
  };

  const handleModalClose = (setter) => (success, msg) => {
    setter(false);
    if (success) notify({ error: false, msg });
  };

  const handleTargetModalClose = (setter) => (success, msg) => {
    setter(null);
    if (success) notify({ error: false, msg });
  };

  const pendingConfirmation = officeCashBox?.pendingConfirmation;
  // Quien entregó la caja no puede confirmarla; la cuenta quien la recibe.
  const canConfirmBox =
    pendingConfirmation &&
    pendingConfirmation.user?._id !== userId &&
    (isAdmin ||
      !pendingConfirmation.handedToUser ||
      pendingConfirmation.handedToUser?._id === userId);

  return (
    <>
      <Head>
        <title>Corte de caja</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Corte de caja'}
          sutitle={
            isOperator
              ? 'Efectivo cobrado en ruta y depósitos'
              : 'Caja de oficina, entregas de turno y gastos'
          }
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid container direction="row" spacing={3}>
          {/* ---------- RUTA ---------- */}
          {showRouteSection && (
            <Grid item xs={12}>
              {routeCashSummaryError ? (
                <Alert severity="error">
                  Hubo un problema al cargar su efectivo pendiente.
                </Alert>
              ) : isLoadingRouteCash || !routeCashSummary ? (
                <Card>
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                </Card>
              ) : (
                <Card>
                  <CardHeader
                    title="Efectivo pendiente de entregar"
                    avatar={<AccountBalanceWalletIcon color="primary" />}
                  />
                  <Divider />
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="h1" fontWeight="bold">
                          {money(routeCashSummary.total)}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {routeCashSummary.count} cobro(s) sin cortar
                          {routeCashSummary.periodStart
                            ? ` desde el ${formatTZDate(
                                new Date(routeCashSummary.periodStart),
                                'DD/MM/YYYY HH:mm'
                              )}`
                            : ''}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="large"
                        disabled={routeCashSummary.count === 0}
                        onClick={() => setRouteCutOpen(true)}
                      >
                        Cerrar mi corte
                      </Button>
                    </Stack>

                    {routeCashSummary.breakdown?.length > 0 && (
                      <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Desglose
                        </Typography>
                        <Stack spacing={1}>
                          {routeCashSummary.breakdown.map((item) => (
                            <Stack
                              key={item._id}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="body2">
                                  {item.reference}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatTZDate(
                                    new Date(item.date),
                                    'DD/MM/YYYY HH:mm'
                                  )}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight="bold">
                                {money(item.amount)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          )}

          {/* Cortes de ruta pendientes de depositar */}
          {showRouteSection &&
            routeCashSummary?.pendingDeposits?.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Pendientes de depositar" />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {routeCashSummary.pendingDeposits.map((cut) => (
                      <Stack
                        key={cut._id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            Corte #{cut.cutNumber} — {money(cut.declaredAmount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTZDate(
                              new Date(cut.periodEnd),
                              'DD/MM/YYYY HH:mm'
                            )}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<ReceiptLongIcon />}
                          onClick={() => setDepositCut(cut)}
                        >
                          Subir comprobante
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* ---------- OFICINA ---------- */}
          {isOffice && (
            <Grid item xs={12}>
              {officeCashBoxError ? (
                <Alert severity="error">
                  Hubo un problema al cargar la caja de oficina.
                </Alert>
              ) : isLoadingOfficeBox || !officeCashBox ? (
                <Card>
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                </Card>
              ) : (
                <Card>
                  <CardHeader
                    title="Caja de oficina"
                    avatar={<PointOfSaleIcon color="primary" />}
                    action={
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<AddTwoTone />}
                          onClick={() => setExpenseOpen(true)}
                        >
                          Gasto
                        </Button>
                        <Button
                          variant="contained"
                          disabled={!!pendingConfirmation}
                          onClick={() => setCloseShiftOpen(true)}
                        >
                          Cerrar turno
                        </Button>
                      </Stack>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {pendingConfirmation && (
                      <Alert
                        severity="warning"
                        sx={{ mb: 2 }}
                        action={
                          canConfirmBox ? (
                            <Button
                              color="inherit"
                              size="small"
                              onClick={() => setConfirmCut(pendingConfirmation)}
                            >
                              Contar y recibir
                            </Button>
                          ) : null
                        }
                      >
                        {pendingConfirmation.user?.name} entregó{' '}
                        {money(pendingConfirmation.declaredAmount)} y falta que
                        {pendingConfirmation.handedToUser?.name
                          ? ` ${pendingConfirmation.handedToUser.name} lo cuente`
                          : ' alguien lo cuente'}{' '}
                        y confirme.
                      </Alert>
                    )}

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', sm: 'flex-end' }}
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Debe haber en caja
                        </Typography>
                        <Typography variant="h1" fontWeight="bold">
                          {money(officeCashBox.expectedBalance)}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Saldo inicial
                          </Typography>
                          <Typography variant="body2">
                            {money(officeCashBox.previousBalance)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Cobros en efectivo
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            + {money(officeCashBox.cashIn)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            Gastos y compras
                          </Typography>
                          <Typography variant="body2" color="error.main">
                            − {money(officeCashBox.expensesTotal)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>

                    {officeCashBox.breakdown?.length > 0 && (
                      <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Cobros en efectivo de este turno
                        </Typography>
                        <Stack spacing={1}>
                          {officeCashBox.breakdown.map((item) => (
                            <Stack
                              key={item._id}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Typography variant="body2">
                                  {item.reference}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {item.collectedBy
                                    ? `${item.collectedBy} · `
                                    : ''}
                                  {formatTZDate(
                                    new Date(item.date),
                                    'DD/MM/YYYY HH:mm'
                                  )}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color="success.main"
                              >
                                + {money(item.amount)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {officeCashBox.expenses?.length > 0 && (
                      <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Gastos de este turno
                        </Typography>
                        <Stack spacing={1}>
                          {officeCashBox.expenses.map((expense) => (
                            <Stack
                              key={expense._id}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Chip
                                    size="small"
                                    label={
                                      CASH_EXPENSE_CONCEPTS[expense.concept] ||
                                      expense.concept
                                    }
                                  />
                                  <Typography variant="body2">
                                    {expense.description || '—'}
                                  </Typography>
                                </Stack>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {expense.createdBy?.name} ·{' '}
                                  {formatTZDate(
                                    new Date(expense.date),
                                    'DD/MM/YYYY HH:mm'
                                  )}
                                </Typography>
                              </Box>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  color="error.main"
                                >
                                  − {money(expense.amount)}
                                </Typography>
                                {expense.receiptUrl && (
                                  <Tooltip title="Ver recibo">
                                    <Link
                                      href={expense.receiptUrl}
                                      target="_blank"
                                      rel="noopener"
                                    >
                                      <IconButton size="small">
                                        <ReceiptLongIcon fontSize="small" />
                                      </IconButton>
                                    </Link>
                                  </Tooltip>
                                )}
                                {isAdmin && (
                                  <Tooltip title="Corregir monto">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        setEditTarget({
                                          kind: 'EXPENSE',
                                          id: expense._id,
                                          currentValue: expense.amount,
                                          label: `Gasto #${expense.expenseNumber}`
                                        })
                                      }
                                    >
                                      <EditTwoToneIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          )}

          {/* ---------- HISTORIAL ---------- */}
          <Grid item xs={12}>
            {cashCutsError ? (
              <Alert severity="error">
                Hubo un problema al cargar el historial de cortes.
              </Alert>
            ) : (
              <TablaCortes
                cuts={cashCuts?.list || []}
                total={cashCuts?.total || 0}
                page={page}
                limit={limit}
                isLoading={isLoadingCashCuts || !cashCuts}
                canEdit={isAdmin}
                isAdmin={isAdmin}
                currentUserId={userId}
                onDeposit={setDepositCut}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(0);
                }}
                onEditAmount={setEditTarget}
              />
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />

      {routeCutOpen && (
        <CloseRouteCutModal
          open={routeCutOpen}
          handleOnClose={handleModalClose(setRouteCutOpen)}
          systemAmount={routeCashSummary?.total}
          count={routeCashSummary?.count}
        />
      )}
      {depositCut && (
        <DepositReceiptModal
          open={!!depositCut}
          handleOnClose={handleTargetModalClose(setDepositCut)}
          cut={depositCut}
        />
      )}
      {closeShiftOpen && (
        <CloseShiftModal
          open={closeShiftOpen}
          handleOnClose={handleModalClose(setCloseShiftOpen)}
          box={officeCashBox}
        />
      )}
      {confirmCut && (
        <ConfirmBoxModal
          open={!!confirmCut}
          handleOnClose={handleTargetModalClose(setConfirmCut)}
          cut={confirmCut}
        />
      )}
      {expenseOpen && (
        <AddCashExpenseModal
          open={expenseOpen}
          handleOnClose={handleModalClose(setExpenseOpen)}
          availableBalance={officeCashBox?.expectedBalance}
        />
      )}
      {editTarget && (
        <EditAmountModal
          open={!!editTarget}
          handleOnClose={handleTargetModalClose(setEditTarget)}
          target={editTarget}
        />
      )}
    </>
  );
}

CorteCaja.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  const props = await validateServerSideSession(getSession, req, resolvedUrl);
  // Solo quien maneja efectivo entra: ruta (OPE) y oficina (ADMIN/AUX).
  const role = props?.props?.session?.user?.role;
  if (role && !['ADMIN', 'AUX', 'OPE'].includes(role)) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return props;
}

export default CorteCaja;
