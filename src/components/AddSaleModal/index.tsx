import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Divider,
  Grid,
  TextField,
  Alert,
  Skeleton,
  FormControlLabel,
  Switch,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getFetcher,
  useGetAllCustomers,
  useGetPaymentAccounts
} from '../../../pages/api/useRequest';
import { saveSale } from '../../../lib/client/salesFetch';
import { getAllSalesMachines } from '../../../lib/client/salesMachinesFetch';
import { PAYMENT_METHODS } from '../../../lib/consts/OBJ_CONTS';
import { compressImage } from '../../../lib/client/utils';
import PaymentReceipt from '../PaymentReceipt';

function AddSaleModal(props) {
  const { handleOnClose, open, preSelectedMachine } = props;
  const { customerList, customerError } = useGetAllCustomers(getFetcher, false);
  const { paymentAccounts } = useGetPaymentAccounts(getFetcher);

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [useExistingMachine, setUseExistingMachine] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [cashPrice, setCashPrice] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [totalWeeks, setTotalWeeks] = useState('');
  const [salesMachines, setSalesMachines] = useState([]);
  const [salesMachinesError, setSalesMachinesError] = useState(null);
  const [salesMachinesLoading, setSalesMachinesLoading] = useState(true);

  // Upfront cash payment states
  const [isUpfrontCashPayment, setIsUpfrontCashPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState<any>(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [paymentImagePreview, setPaymentImagePreview] = useState(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch sales machines on mount
  useEffect(() => {
    async function fetchSalesMachines() {
      setSalesMachinesLoading(true);
      const result = await getAllSalesMachines(false);
      if (!result.error) {
        setSalesMachines(result.salesMachinesList || []);
      } else {
        setSalesMachinesError(result.msg);
      }
      setSalesMachinesLoading(false);
    }
    if (open) {
      fetchSalesMachines();
    }
  }, [open]);

  useEffect(() => {
    if (open && preSelectedMachine) {
      setUseExistingMachine(true);
      setSelectedMachine(preSelectedMachine);
    }
  }, [open, preSelectedMachine]);

  // Get available sales machines (active ones that are not sold)
  const availableMachines = salesMachines.filter(
    (machine) => machine.active && !machine.isSold
  );

  const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';

  const weeklyPayment =
    totalWeeks && totalAmount && initialPayment
      ? (
        (parseFloat(totalAmount) - parseFloat(initialPayment)) /
        parseFloat(totalWeeks)
      ).toFixed(2)
      : '0.00';

  const handleImageUpload = async (event) => {
    const imageFile = event.target.files[0];

    if (
      imageFile &&
      (!imageFile.type.includes('image/') || imageFile.type.includes('/heic'))
    ) {
      setHasError({ error: true, msg: 'Formato de imagen no válido' });
      return;
    }

    if (!imageFile) {
      setPaymentImage(null);
      setPaymentImagePreview(null);
      return;
    }

    const result = await compressImage(imageFile);
    if (result) {
      setPaymentImage(result.file);
      setPaymentImagePreview(result.url);
    } else {
      setPaymentImage(imageFile);
      setPaymentImagePreview(URL.createObjectURL(imageFile));
    }
  };

  const handleRemoveImage = () => {
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
  };

  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    if (useExistingMachine && !selectedMachine) {
      setHasError({ error: true, msg: 'Debe seleccionar un equipo' });
      setIsLoading(false);
      return;
    }

    if (!useExistingMachine && !serialNumber.trim()) {
      setHasError({ error: true, msg: 'Debe ingresar un número de serie' });
      setIsLoading(false);
      return;
    }

    if (isUpfrontCashPayment) {
      if (!cashPrice || parseFloat(cashPrice) <= 0) {
        setHasError({ error: true, msg: 'Debe ingresar el precio de contado' });
        setIsLoading(false);
        return;
      }
      if (!paymentMethod) {
        setHasError({ error: true, msg: 'Debe seleccionar un método de pago' });
        setIsLoading(false);
        return;
      }
      if (requiresImage && !selectedPaymentAccount) {
        setHasError({ error: true, msg: 'Debe seleccionar una cuenta de pago' });
        setIsLoading(false);
        return;
      }
      if (requiresImage && !paymentImage) {
        setHasError({ error: true, msg: 'Debe adjuntar una foto del comprobante de pago' });
        setIsLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('machineId', useExistingMachine ? (selectedMachine?._id || '') : '');
    formData.append('serialNumber', useExistingMachine ? '' : serialNumber);
    formData.append('customerId', selectedCustomer?.id || '');
    formData.append('saleDate', new Date().toISOString());
    formData.append('cashPrice', cashPrice || '');
    formData.append('isUpfrontCashPayment', isUpfrontCashPayment ? 'true' : 'false');

    if (isUpfrontCashPayment) {
      formData.append('paymentMethod', paymentMethod);
      if (selectedPaymentAccount) {
        formData.append('paymentAccountId', selectedPaymentAccount._id);
      }
      if (paymentImage) {
        formData.append('paymentImage', paymentImage);
      }
    } else {
      formData.append('totalAmount', totalAmount);
      formData.append('initialPayment', initialPayment);
      formData.append('totalWeeks', totalWeeks);
    }

    const result = await saveSale(formData);

    setIsLoading(false);
    if (!result.error) {
      // If there's a receipt from upfront payment, show it
      if (result.data?.receipt) {
        setReceipt(result.data.receipt);
        setShowReceipt(true);
      } else {
        handleSavedSale(result.msg, result.data);
      }
    } else {
      handleErrorOnSave(result.msg);
    }
  }

  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    setUseExistingMachine(true);
    setSelectedMachine(null);
    setSelectedCustomer(null);
    setSerialNumber('');
    setCashPrice('');
    setTotalAmount('');
    setInitialPayment('');
    setTotalWeeks('');
    setIsUpfrontCashPayment(false);
    setPaymentMethod('');
    setSelectedPaymentAccount(null);
    if (paymentImagePreview) {
      URL.revokeObjectURL(paymentImagePreview);
    }
    setPaymentImage(null);
    setPaymentImagePreview(null);
    setReceipt(null);
    setShowReceipt(false);
    handleOnClose(false);
  };

  const handleSavedSale = (successMessage, saleData) => {
    handleOnClose(true, successMessage, saleData);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceipt(null);
    handleOnClose(true, 'Venta registrada con éxito');
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <>
      <Dialog open={open} fullWidth={true} maxWidth="xs" scroll={'body'}>
        <Card>
          <CardHeader title="Registrar Nueva Venta" />
          <Divider />
          <CardContent>
            <Box component="form" onSubmit={submitHandler}>
              <Grid
                container
                direction="column"
                justifyContent="center"
                spacing={2}
                maxWidth="xs"
              >
                <Grid item lg={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useExistingMachine}
                        disabled={!!preSelectedMachine}
                        onChange={(e) => {
                          setUseExistingMachine(e.target.checked);
                          setSelectedMachine(null);
                          setSerialNumber('');
                        }}
                      />
                    }
                    label="Usar equipo existente"
                  />
                </Grid>

                {useExistingMachine ? (
                  <Grid item lg={12}>
                    {salesMachinesError ? (
                      <Alert severity="error">{salesMachinesError}</Alert>
                    ) : salesMachinesLoading ? (
                      <Skeleton
                        variant="rectangular"
                        width={'100%'}
                        height={56}
                        animation="wave"
                      />
                    ) : (
                      <Autocomplete
                        disabled={!!preSelectedMachine}
                        options={availableMachines}
                        getOptionLabel={(option) =>
                          `#${option.machineNum} - ${option.brand} ${option.capacity || ''
                          }`
                        }
                        value={selectedMachine}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        onChange={(_event, newValue) => {
                          setSelectedMachine(newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Seleccionar Equipo de Venta"
                            required
                          />
                        )}
                      />
                    )}
                  </Grid>
                ) : (
                  <Grid item lg={12}>
                    <TextField
                      autoComplete="off"
                      required
                      id="serialNumber"
                      name="serialNumber"
                      label="Número de Serie"
                      fullWidth={true}
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </Grid>
                )}

                <Grid item lg={12}>
                  {customerError ? (
                    <Alert severity="error">{customerError?.message}</Alert>
                  ) : !customerList ? (
                    <Skeleton
                      variant="rectangular"
                      width={'100%'}
                      height={56}
                      animation="wave"
                    />
                  ) : (
                    <Autocomplete
                      disablePortal
                      options={customerList.map((customer) => {
                        return {
                          label: `${customer.name} (${customer.cell})`,
                          id: customer._id
                        };
                      })}
                      value={selectedCustomer}
                      onChange={(_event, newValue) => {
                        setSelectedCustomer(newValue);
                      }}
                      isOptionEqualToValue={(option: any, value: any) =>
                        option.id === value.id
                      }
                      renderInput={(params) => (
                        <TextField {...params} label="Cliente (opcional)" />
                      )}
                    />
                  )}
                </Grid>

                {/* Upfront Cash Payment Switch */}
                <Grid item lg={12}>
                  <Divider sx={{ mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isUpfrontCashPayment}
                        onChange={(e) => {
                          setIsUpfrontCashPayment(e.target.checked);
                          if (!e.target.checked) {
                            setPaymentMethod('');
                            setSelectedPaymentAccount(null);
                            handleRemoveImage();
                          }
                        }}
                        color="success"
                      />
                    }
                    label="Pago de contado inmediato"
                  />
                </Grid>

                {/* Cash Price - shown always but required when upfront */}
                <Grid item lg={12}>
                  <TextField
                    type="number"
                    autoComplete="off"
                    id="cashPrice"
                    name="cashPrice"
                    label="Precio de Contado ($)"
                    fullWidth={true}
                    required={isUpfrontCashPayment}
                    value={cashPrice}
                    onChange={(e) => setCashPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={
                      isUpfrontCashPayment
                        ? 'Monto que el cliente pagará de contado'
                        : 'Precio si el cliente paga en los primeros 30 días'
                    }
                  />
                </Grid>

                {/* Upfront Payment Info */}
                {isUpfrontCashPayment && cashPrice && (
                  <Grid item lg={12}>
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>La venta se registrará como PAGADA</strong>
                      </Typography>
                      <Typography variant="body2">
                        Monto: <strong>${parseFloat(cashPrice).toFixed(2)}</strong>
                      </Typography>
                      <Typography variant="body2">
                        La entrega quedará pendiente de asignación.
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                {/* Payment Method - only for upfront cash payment */}
                {isUpfrontCashPayment && (
                  <>
                    <Grid item lg={12}>
                      <FormControl fullWidth required>
                        <InputLabel id="payment-method-label">Método de Pago</InputLabel>
                        <Select
                          labelId="payment-method-label"
                          id="paymentMethod"
                          value={paymentMethod}
                          label="Método de Pago"
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            if (e.target.value !== 'TRANSFER' && e.target.value !== 'DEP') {
                              setSelectedPaymentAccount(null);
                              handleRemoveImage();
                            }
                          }}
                        >
                          {Object.keys(PAYMENT_METHODS).map((key) => (
                            <MenuItem key={key} value={key}>
                              {PAYMENT_METHODS[key]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Payment Account - only for TRANSFER/DEP */}
                    {requiresImage && (
                      <Grid item lg={12}>
                        <FormControl fullWidth required>
                          <InputLabel id="payment-account-label">Cuenta</InputLabel>
                          <Select
                            labelId="payment-account-label"
                            id="paymentAccount"
                            value={selectedPaymentAccount?._id || ''}
                            label="Cuenta"
                            onChange={(e) => {
                              const selected = paymentAccounts?.find(
                                (acc) => acc._id === e.target.value
                              );
                              setSelectedPaymentAccount(selected);
                            }}
                          >
                            {paymentAccounts?.map((acc) => (
                              <MenuItem key={acc._id} value={acc._id}>
                                {`${acc.bank} ${acc.count} (${acc.number.slice(-4)})`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}

                    {/* Payment Image - only for TRANSFER/DEP */}
                    {requiresImage && (
                      <Grid item lg={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          Foto del comprobante de pago *
                        </Typography>
                        {!paymentImagePreview ? (
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<PhotoCamera />}
                            sx={{ height: 56 }}
                          >
                            Seleccionar foto
                            <input
                              hidden
                              accept="image/*"
                              type="file"
                              onChange={handleImageUpload}
                            />
                          </Button>
                        ) : (
                          <Card>
                            <CardMedia
                              component="img"
                              height="200"
                              image={paymentImagePreview}
                              alt="Comprobante de pago"
                            />
                            <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                              <IconButton
                                color="error"
                                onClick={handleRemoveImage}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Card>
                        )}
                      </Grid>
                    )}
                  </>
                )}

                {/* Credit fields - hidden when upfront cash payment */}
                {!isUpfrontCashPayment && (
                  <>
                    <Grid item lg={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="totalAmount"
                        name="totalAmount"
                        label="Precio a Crédito ($)"
                        fullWidth={true}
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item lg={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="initialPayment"
                        name="initialPayment"
                        label="Pago Inicial ($)"
                        fullWidth={true}
                        value={initialPayment}
                        onChange={(e) => setInitialPayment(e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>

                    <Grid item lg={12}>
                      <TextField
                        type="number"
                        autoComplete="off"
                        required
                        id="totalWeeks"
                        name="totalWeeks"
                        label="Número de Semanas"
                        fullWidth={true}
                        value={totalWeeks}
                        onChange={(e) => setTotalWeeks(e.target.value)}
                        inputProps={{ min: 1, step: 1 }}
                      />
                    </Grid>

                    {totalWeeks && totalAmount && initialPayment && (
                      <Grid item lg={12}>
                        <Alert severity="info">
                          Pago semanal: <strong>${weeklyPayment}</strong>
                          <br />
                          Saldo restante:{' '}
                          <strong>
                            $
                            {(
                              parseFloat(totalAmount) - parseFloat(initialPayment)
                            ).toFixed(2)}
                          </strong>
                        </Alert>
                      </Grid>
                    )}
                  </>
                )}

                {hasError.error && (
                  <Grid item lg={12}>
                    <Alert severity="error">{hasError.msg}</Alert>
                  </Grid>
                )}

                <Grid
                  item
                  container
                  direction="row"
                  justifyContent="center"
                  lg={12}
                  spacing={2}
                >
                  <Grid item>
                    <Button onClick={handleClose} color="error">
                      Cancelar
                    </Button>
                  </Grid>
                  <Grid item>
                    <LoadingButton
                      loading={isLoading}
                      type="submit"
                      variant="contained"
                      color={isUpfrontCashPayment ? 'success' : 'primary'}
                    >
                      {isUpfrontCashPayment ? 'Registrar y Pagar' : 'Guardar'}
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Dialog>

      {/* Receipt Dialog for upfront cash payment */}
      {showReceipt && (
        <PaymentReceipt
          receipt={receipt}
          open={showReceipt}
          onClose={handleCloseReceipt}
        />
      )}
    </>
  );
}

AddSaleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,
  preSelectedMachine: PropTypes.object
};

export default AddSaleModal;
