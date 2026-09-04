import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Box,
  TextField,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import Footer from '@/components/Footer';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import { createExternalRepair } from '../../../lib/client/externalRepairsFetch';
import { formatTZDate } from '../../../lib/client/utils';
import {
  getFetcher,
  useGetOperators,
  useGetUsers,
  useGetAllCustomers,
  useGetCustomerById
} from '../../../pages/api/useRequest';

function AgendarRecoleccionExterna() {
  const paths = ['Inicio', 'Reparaciones Externas', 'Agendar recolección'];
  const { enqueueSnackbar } = useSnackbar();
  const { operatorsList } = useGetOperators(getFetcher);
  const { userList: technicianList } = useGetUsers(getFetcher, 'TEC');
  const activeTechnicians = (technicianList || []).filter((t) => t.isActive);
  const { customerList } = useGetAllCustomers(getFetcher, false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const { customer, isLoadingCustomer } = useGetCustomerById(
    getFetcher,
    selectedCustomer?._id
  );

  const [customerName, setCustomerName] = useState(null);
  const [customerCell, setCustomerCell] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [customerMaps, setCustomerMaps] = useState(null);
  const [failureDescription, setFailureDescription] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [pickupDate, setPickupDate] = useState(null);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerName(null);
    setCustomerCell(null);
    setCustomerAddress(null);
    setCustomerMaps(null);
  };
  const addressLine = customer?.currentResidence ? `${customer.currentResidence.street}, ${customer.currentResidence.suburb}` : null;
  const confirmedCustomerName = customerName ?? customer?.name ?? '';
  const confirmedCustomerCell = customerCell ?? customer?.cell ?? '';
  const confirmedCustomerAddress =
    customerAddress ?? addressLine ?? '';
  const confirmedCustomerMaps =
    customerMaps ?? customer?.currentResidence?.maps ?? '';

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (!selectedCustomer ||!customer || !failureDescription || !operatorId || !technicianId || !pickupDate) {
      setHasError({
        error: true,
        msg: 'Seleccione cliente y complete falla, chofer, técnico y fecha de recolección.'
      });
      setIsLoading(false);
      return;
    }

    const result = await createExternalRepair({
      customerId: customer._id,
      customerName: confirmedCustomerName,
      customerCell: confirmedCustomerCell,
      customerAddress: confirmedCustomerAddress,
      customerMaps: confirmedCustomerMaps,
      failureDescription,
      pickupAssignedTo: operatorId,
      assignedTechnicianId: technicianId,
      pickupScheduledDate: formatTZDate(pickupDate, 'YYYY-MM-DD')
    });

    setIsLoading(false);
    if (!result.error) {
      enqueueSnackbar(result.msg, {
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000
      });
      handleSelectCustomer(null);
      setFailureDescription('');
      setOperatorId('');
      setTechnicianId('');
      setPickupDate(new Date());
    } else {
      setHasError({ error: true, msg: result.msg });
    }
  }

  return (
    <>
      <Head>
        <title>Agendar Recolección Externa</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={'Agendar Recolección Externa'}
          sutitle={'Programar la recolección de una lavadora de un cliente'}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>

      <Container maxWidth="sm">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Cliente y recolección" />
              <Divider />
              <CardContent>
                {!customerList || !operatorsList || !technicianList ? (
                  <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                  </Box>
                ) : (
                <Box component="form" onSubmit={submitHandler}>
                  <Grid container direction="column" spacing={2}>
                    <Grid item>
                      <Autocomplete
                        options={customerList || []}
                        getOptionLabel={(c: any) =>
                          `${c.name}${c.cell ? ` (${c.cell})` : ''}`
                        }
                        value={selectedCustomer}
                        isOptionEqualToValue={(o: any, v: any) =>
                          o._id === v._id
                        }
                        onChange={(_e, v) => handleSelectCustomer(v)}
                        renderInput={(params) => (
                          <TextField {...params} required label="Cliente" />
                        )}
                      />
                    </Grid>

                    {isLoadingCustomer && (
                      <Grid item>
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress size={28} />
                        </Box>
                      </Grid>
                    )}

                    {!isLoadingCustomer && customer && (
                      <>
                        <Grid item>
                          <TextField
                            label="Nombre (confirmar)"
                            fullWidth
                            value={confirmedCustomerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </Grid>
                        <Grid item>
                          <TextField
                            label="Teléfono (confirmar)"
                            fullWidth
                            value={confirmedCustomerCell}
                            onChange={(e) => setCustomerCell(e.target.value)}
                          />
                        </Grid>
                        <Grid item>
                          <TextField
                            label="Dirección (confirmar)"
                            fullWidth
                            value={confirmedCustomerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                          />
                        </Grid>
                        <Grid item>
                          <TextField
                            label="Ubicación / Maps (confirmar)"
                            fullWidth
                            value={confirmedCustomerMaps}
                            onChange={(e) => setCustomerMaps(e.target.value)}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item>
                      <TextField
                        autoComplete="off"
                        required
                        label="Falla reportada por el cliente"
                        fullWidth
                        multiline
                        minRows={3}
                        value={failureDescription}
                        onChange={(e) => setFailureDescription(e.target.value)}
                      />
                    </Grid>
                    <Grid item>
                      <FormControl fullWidth required>
                        <InputLabel id="op-label">Chofer (recolección)</InputLabel>
                        <Select
                          labelId="op-label"
                          label="Chofer (recolección)"
                          value={operatorId}
                          onChange={(e) => setOperatorId(e.target.value)}
                        >
                          {(operatorsList || []).map((op) => (
                            <MenuItem key={op._id} value={op._id}>
                              {op.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item>
                      <FormControl fullWidth required>
                        <InputLabel id="tec-label">Técnico asignado</InputLabel>
                        <Select
                          labelId="tec-label"
                          label="Técnico asignado"
                          value={technicianId}
                          onChange={(e) => setTechnicianId(e.target.value)}
                        >
                          {activeTechnicians.map((tec) => (
                            <MenuItem key={tec._id} value={tec._id}>
                              {tec.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item>
                      <DesktopDatePicker
                        label="Fecha de recolección*"
                        inputFormat="dd/MM/yyyy"
                        value={pickupDate}
                        onChange={(newValue) => setPickupDate(newValue)}
                        minDate={new Date()}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth required />
                        )}
                      />
                    </Grid>

                    {hasError.error && (
                      <Grid item>
                        <Alert severity="error">{hasError.msg}</Alert>
                      </Grid>
                    )}

                    <Grid item>
                      <LoadingButton
                        loading={isLoading}
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                      >
                        Agendar recolección
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

AgendarRecoleccionExterna.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  if (
    props?.props?.session &&
    !['ADMIN', 'AUX'].includes(props.props.session.user.role)
  ) {
    return { redirect: { destination: '/', permanent: false } };
  }
  return props;
}

export default AgendarRecoleccionExterna;
