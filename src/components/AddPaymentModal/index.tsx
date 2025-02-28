import PropTypes from 'prop-types';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Alert,
  Container,
  Skeleton,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Autocomplete,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/es-mx';
dayjs.locale('es-mx');
dayjs.extend(LocalizedFormat);
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Image from 'next/image';
import { LoadingButton } from '@mui/lab';
import { useGetAllCustomers, getFetcher } from '../../../pages/api/useRequest';
import { savePayment } from '../../../lib/client/paymentsFetch';
import {
  PAYMENT_REASONS,
  PAYMENT_METHODS
} from '../../../lib/consts/OBJ_CONTS';
import { MuiFileInput } from 'mui-file-input';
import numeral from 'numeral';
import { DesktopDatePicker } from '@mui/x-date-pickers';
import { convertDateToTZ, dateDiffInDays } from 'lib/client/utils';
function AddPaymentModal(props) {
  const { customerId, handleOnClose, open, reason, amount } = props;
  const { customerList, customerError } = useGetAllCustomers(getFetcher, false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [account, setAccount] = useState<string>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(null);
  const [selectedAmount, setSelectedAmount] = useState<any>(null);
  const [selectedFolio, setSelectedFolio] = useState<any>(null);
  const [attached, setAttached] = useState<any>({
    voucher: { file: null, url: null }
  });
  const [badFormat, setBadFormat] = useState<any>({
    voucher: false
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [hasErrorSubmitting, setHasErrorSubmitting] = useState<any>({
    error: false,
    msg: ''
  });
  const handleCustomerSelect = (selected: any) => {
    const found = customerList.filter(
      (c) => c._id.toString() === selected?.id
    )[0];
    setSelectedCustomer(found);
  };

  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      label: 'Seleccione el cliente y concepto'
    },
    {
      label: 'Método de pago'
    },
    {
      label: 'Cantidad y comprobante'
    }
  ];

  const handleOnSubmit = async (event) => {
    event.preventDefault();
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(true);
    const result = await savePayment(attached.voucher.file, {
      customerId: selectedCustomer._id,
      reason: selectedReason,
      method: selectedMethod,
      account,
      paymentDate: convertDateToTZ(paymentDate),
      amount: selectedAmount,
      folio: selectedFolio
    });
    setIsSubmitting(false);
    if (!result.error) {
      handleSavedPayment(result.msg);
    } else {
      setHasErrorSubmitting({ error: true, msg: result.msg });
    }
  };
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const handleNext = (event) => {
    event.preventDefault();
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleClose = () => {
    setHasErrorSubmitting({ error: false, msg: '' });
    setIsSubmitting(false);
    handleOnClose(false);
  };
  const handleSavedPayment = (successMessage) => {
    handleOnClose(true, successMessage);
  };
  if (customerId && customerList && !selectedCustomer) {
    handleCustomerSelect({ id: customerId });
  }
  if (reason && !selectedReason) {
    setSelectedReason(reason);
  }
  if (amount && !selectedAmount) {
    setSelectedAmount(amount);
  }
  if (customerId && reason && activeStep === 0) {
    setActiveStep(1);
  }

  return (
    <Dialog open={open} fullWidth={true} maxWidth={'md'} scroll={'body'}>
      <Card>
        <CardHeader title="Nuevo pago" />
        <Divider />
        <CardContent>
          <Box>
            <Container>
              <Grid container>
                {customerError ? (
                  <Grid item m={1}>
                    <Alert severity="error">{customerError.message}</Alert>
                  </Grid>
                ) : (
                  <>
                    <Grid item lg={6}>
                      <Stepper
                        activeStep={activeStep}
                        orientation="vertical"
                        sx={{ backgroundColor: 'transparent' }}
                      >
                        {steps.map((step, index) => (
                          <Step key={step.label}>
                            <StepLabel>
                              {index === 0 && selectedCustomer && selectedReason
                                ? `${step.label} (${selectedCustomer.name} - ${PAYMENT_REASONS[selectedReason]})`
                                : index === 1 && selectedMethod
                                ? `${step.label} (${PAYMENT_METHODS[selectedMethod]})`
                                : step.label}
                            </StepLabel>
                            <StepContent>
                              <Box
                                component="form"
                                onSubmit={
                                  activeStep < steps.length - 1
                                    ? handleNext
                                    : handleOnSubmit
                                }
                              >
                                {activeStep === 0 && (
                                  <Grid container>
                                    <Grid item lg={8} m={1}>
                                      {(
                                        customerId
                                          ? selectedCustomer
                                          : customerList
                                      ) ? (
                                        <Autocomplete
                                          disablePortal
                                          id="combo-box-demo"
                                          options={customerList.map(
                                            (customer) => {
                                              return {
                                                label: `${customer.name} (${customer.cell})`,
                                                id: customer._id
                                              };
                                            }
                                          )}
                                          onChange={(
                                            event: any,
                                            newValue: string | null
                                          ) => {
                                            event.target;
                                            handleCustomerSelect(newValue);
                                          }}
                                          value={
                                            selectedCustomer
                                              ? {
                                                  label: `${selectedCustomer.name} (${selectedCustomer.cell})`,
                                                  id: selectedCustomer._id
                                                }
                                              : null
                                          }
                                          fullWidth
                                          isOptionEqualToValue={(
                                            option: any,
                                            value: any
                                          ) => option.id === value.id}
                                          renderInput={(params) => (
                                            <TextField
                                              required
                                              {...params}
                                              label="Cliente"
                                            />
                                          )}
                                        />
                                      ) : (
                                        <Skeleton
                                          variant="text"
                                          sx={{
                                            fontSize: '1rem',
                                            width: '100px'
                                          }}
                                        />
                                      )}
                                    </Grid>
                                    {selectedCustomer && (
                                      <Grid item m={1}>
                                        <Typography variant="h5">
                                          Saldo
                                        </Typography>
                                        <Typography variant="subtitle2">
                                          {numeral(
                                            selectedCustomer.balance
                                          ).format(
                                            `$${selectedCustomer.balance}0,0.00`
                                          )}
                                        </Typography>
                                      </Grid>
                                    )}
                                    <Grid item xs={12} sm={12} lg={12} />
                                    <Grid item lg={6} m={1}>
                                      <FormControl sx={{ width: '100%' }}>
                                        <InputLabel id="reason-id">
                                          Concepto*
                                        </InputLabel>
                                        <Select
                                          labelId="reason-id"
                                          label="Concepto*"
                                          id="reason"
                                          name="reason"
                                          required
                                          autoComplete="off"
                                          size="medium"
                                          value={selectedReason || ''}
                                          onChange={(event) =>
                                            setSelectedReason(
                                              event.target.value
                                            )
                                          }
                                        >
                                          {Object.keys(PAYMENT_REASONS).map(
                                            (reasonKey) => (
                                              <MenuItem
                                                key={reasonKey}
                                                value={reasonKey}
                                              >
                                                {PAYMENT_REASONS[reasonKey]}
                                              </MenuItem>
                                            )
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                )}
                                {activeStep === 1 && (
                                  <Grid container>
                                    <Grid item lg={6} m={1}>
                                      <FormControl sx={{ width: '100%' }}>
                                        <InputLabel id="method-id">
                                          Método*
                                        </InputLabel>
                                        <Select
                                          labelId="method-id"
                                          label="Concepto*"
                                          id="method"
                                          name="method"
                                          required
                                          autoComplete="off"
                                          size="medium"
                                          value={selectedMethod || ''}
                                          onChange={(event) =>
                                            setSelectedMethod(
                                              event.target.value
                                            )
                                          }
                                        >
                                          {Object.keys(PAYMENT_METHODS).map(
                                            (methodKey) => (
                                              <MenuItem
                                                key={methodKey}
                                                value={methodKey}
                                              >
                                                {PAYMENT_METHODS[methodKey]}
                                              </MenuItem>
                                            )
                                          )}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    {selectedMethod &&
                                      !['CASH', 'CASH_OFFICE'].includes(
                                        selectedMethod
                                      ) && (
                                        <Grid item lg={4} m={1}>
                                          <TextField
                                            label="Cuenta"
                                            required
                                            value={account}
                                            variant="outlined"
                                            InputProps={{
                                              startAdornment: (
                                                <InputAdornment position="start">
                                                  <AccountBalanceWalletIcon />
                                                </InputAdornment>
                                              )
                                            }}
                                            onChange={(event) => {
                                              setAccount(event.target.value);
                                            }}
                                          />
                                        </Grid>
                                      )}
                                  </Grid>
                                )}
                                {activeStep === 2 && (
                                  <Grid container>
                                    <Grid item lg={12} m={1}>
                                      <DesktopDatePicker
                                        label="Fecha de pago"
                                        inputFormat="dd/MM/yyyy"
                                        value={paymentDate}
                                        maxDate={new Date()}
                                        onChange={(newValue) => {
                                          setPaymentDate(newValue);
                                        }}
                                        renderInput={(params) => (
                                          <TextField {...params} required />
                                        )}
                                      />
                                    </Grid>
                                    <Grid item lg={4} m={1}>
                                      <TextField
                                        label="Cantidad"
                                        type="number"
                                        required
                                        value={selectedAmount}
                                        variant="outlined"
                                        size="small"
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position="start">
                                              $
                                            </InputAdornment>
                                          ),
                                          inputProps: {
                                            min: 0,
                                            style: { textAlign: 'center' }
                                          }
                                        }}
                                        onChange={(event) => {
                                          setSelectedAmount(event.target.value);
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={12} lg={12} />
                                    <Grid item lg={6} m={1}>
                                      <TextField
                                        fullWidth
                                        label="Folio comprobante"
                                        required={
                                          selectedMethod !== 'CASH' &&
                                          selectedMethod !== 'CASH_OFFICE'
                                        }
                                        value={selectedFolio || ''}
                                        variant="outlined"
                                        size="small"
                                        onChange={(event) => {
                                          setSelectedFolio(event.target.value);
                                        }}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={12} lg={12} />
                                    <Grid item lg={8} m={1}>
                                      <MuiFileInput
                                        required={
                                          selectedMethod !== 'CASH' &&
                                          selectedMethod !== 'CASH_OFFICE' &&
                                          !attached.voucher.file
                                        }
                                        placeholder={'No seleccionada'}
                                        label={'Foto de comprobante'}
                                        value={attached.voucher?.file}
                                        onChange={(file) => {
                                          if (
                                            file &&
                                            !file.type.includes('image/') &&
                                            !file.type.includes('/pdf')
                                          ) {
                                            setBadFormat({
                                              ...badFormat,
                                              voucher: true
                                            });
                                            setAttached({
                                              ...attached,
                                              voucher: {
                                                ...attached.voucher,
                                                error: true
                                              }
                                            });
                                            return;
                                          }
                                          const url = file
                                            ? URL.createObjectURL(file)
                                            : null;
                                          setAttached({
                                            ...attached,
                                            voucher: { file, url, error: false }
                                          });
                                        }}
                                      />
                                    </Grid>
                                    <Grid item lg={12} />
                                    {attached.voucher?.error && (
                                      <Grid item lg={4} m={1}>
                                        <Typography color="error">
                                          Seleccione un archivo válido(*.jpg,
                                          *.jpeg, *.png).
                                        </Typography>
                                      </Grid>
                                    )}
                                  </Grid>
                                )}
                                {hasErrorSubmitting.error && (
                                  <Grid item lg={12} m={1}>
                                    <Alert severity="error">
                                      {hasErrorSubmitting.msg}
                                    </Alert>
                                  </Grid>
                                )}
                                <Box sx={{ mb: 2 }}>
                                  <div>
                                    {index > 0 && (
                                      <Button
                                        disabled={isSubmitting}
                                        onClick={handleBack}
                                        sx={{ mt: 1, mr: 1 }}
                                      >
                                        Atrás
                                      </Button>
                                    )}
                                    <LoadingButton
                                      loading={isSubmitting}
                                      variant="contained"
                                      disabled={
                                        customerError ||
                                        (index === 2 && !paymentDate) ||
                                        (index === 2 &&
                                          (paymentDate.toString() ===
                                            'Invalid Date' ||
                                            dateDiffInDays(
                                              new Date(),
                                              paymentDate
                                            ) > 0))
                                      }
                                      type="submit"
                                      sx={{ mt: 1, mr: 1 }}
                                    >
                                      {index === steps.length - 1
                                        ? 'Guardar'
                                        : 'Siguiente'}
                                    </LoadingButton>
                                  </div>
                                </Box>
                              </Box>
                            </StepContent>
                          </Step>
                        ))}
                      </Stepper>
                    </Grid>
                    <Grid item lg={6}>
                      {attached.voucher?.url &&
                        !attached.voucher.file.name.includes('pdf') && (
                          <Grid item lg={12} m={1}>
                            <Image
                              src={attached.voucher.url}
                              alt="Comprobante de pago"
                              width={400}
                              height={600}
                            />
                          </Grid>
                        )}
                      <Grid item lg={8} m={1}>
                        <MuiFileInput
                          required={
                            selectedMethod !== 'CASH' &&
                            selectedMethod !== 'CASH_OFFICE' &&
                            !attached.voucher.file
                          }
                          placeholder={'No seleccionada'}
                          label={'Foto de comprobante'}
                          value={attached.voucher?.file}
                          onChange={(file) => {
                            if (
                              file &&
                              !file.type.includes('image/') &&
                              !file.type.includes('/pdf')
                            ) {
                              setBadFormat({
                                ...badFormat,
                                voucher: true
                              });
                              setAttached({
                                ...attached,
                                voucher: {
                                  ...attached.voucher,
                                  error: true
                                }
                              });
                              return;
                            }
                            const url = file ? URL.createObjectURL(file) : null;
                            setAttached({
                              ...attached,
                              voucher: { file, url, error: false }
                            });
                          }}
                        />
                      </Grid>
                      <Grid item lg={12} />
                      {attached.voucher?.error && (
                        <Grid item lg={4} m={1}>
                          <Typography color="error">
                            Seleccione un archivo válido(*.jpg, *.jpeg, *.png).
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}
              </Grid>
            </Container>
          </Box>
          <Grid item lg={12}>
            <Grid
              container
              alignItems={'right'}
              direction="row"
              justifyContent="right"
              spacing={2}
            >
              <Grid item>
                <Button
                  size="large"
                  variant="outlined"
                  onClick={() => handleClose()}
                >
                  Cancelar
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Dialog>
  );
}

AddPaymentModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  customerId: PropTypes.string,
  reason: PropTypes.string,
  amount: PropTypes.number
};

export default AddPaymentModal;
