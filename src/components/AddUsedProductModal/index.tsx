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
  TextField,
  Autocomplete,
  Typography,
  Skeleton,
  Alert
} from '@mui/material';

import { LoadingButton } from '@mui/lab';
import { getFetcher, useGetProducts } from '../../../pages/api/useRequest';
import numeral from 'numeral';
import { saveUsedProduct } from "../../../lib/client/mantainanacesFetch";
import { addUsedProductToRepair } from "../../../lib/client/saleRepairsFetch";

function AddUsedProductModal(props) {
  const { handleOnClose, open, mantId, saleRepairId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { productsList, productsError, isLoadingProducts } =
    useGetProducts(getFetcher);
  
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: '' });

    const qty = parseInt(event?.target?.qty?.value);
    
    // Use different function based on whether it's maintenance or sale repair
    const result = saleRepairId
      ? await addUsedProductToRepair(saleRepairId, selectedProduct._id, qty)
      : await saveUsedProduct({
          mantainanceId: mantId,
          productId: selectedProduct._id,
          qty
        });
    
    setIsLoading(false);
    if (!result.error) {
      handleSavedUsedProduct(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: '' });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleSavedUsedProduct = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };
  return (
    <Dialog open={open} scroll={'body'}>
      <Card>
        <CardHeader
          title="Agregar refacción a servicio"
          sx={{ textAlign: 'center' }}
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container direction="column" spacing={2} maxWidth="lg">
              <Grid item>
                {productsError ? (
                  <Typography color="red" marginTop={2} fontStyle="italic">
                    {productsError.message}
                  </Typography>
                ) : isLoadingProducts ? (
                  <Skeleton variant="rectangular" width={300} height={60} />
                ) : productsList?.length === 0 ? (
                  <Typography
                    color="darkorange"
                    marginTop={2}
                    fontStyle="italic"
                  >
                    Aun no hay productos registrados
                  </Typography>
                ) : (
                  <Autocomplete
                    fullWidth
                    id="product"
                    options={productsList.map((product) => {
                      return {
                        _id: product._id,
                        label: ` (${product.code}) ${product.name} [${product.stock}]`,
                        id: product.code,
                        stock: product.stock,
                        isDisabled: product.stock <= 0,
                        latestCost: product.latestCost
                      };
                    })}
                    getOptionDisabled={(option: {
                      id: any;
                      isDisabled: boolean;
                    }) => {
                      return option.isDisabled;
                    }}
                    onChange={(_event, newValue) => {
                      setSelectedProduct(newValue);
                    }}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    sx={{ width: 300 }}
                    renderInput={(params) => (
                      <TextField {...params} label="Pieza/Refacción" />
                    )}
                  />
                )}
              </Grid>
              <Grid item>
                <TextField
                sx={{ width: "30%" }}
                  autoComplete="off"
                  required
                  id="qty"
                  name="qty"
                  defaultValue={1}
                  type="number"
                  label="Cantidad"
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: selectedProduct?.stock ?? 0
                    }
                  }}
                />
                {selectedProduct && (
                <Grid item lg={12} xs={12} mt={1}>
                  <Alert severity="info">
                    {`El costo de esta pieza es $${numeral(selectedProduct?.latestCost).format('0,0.00')}/unidad.`}
                  </Alert>
                </Grid>
              )}
              </Grid>
              {hasError.error && (
                <Grid item lg={4}>
                  <Alert sx={{ maxWidth: '300px' }} severity="error">
                    {hasError?.msg}
                  </Alert>
                </Grid>
              )}
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
                  <Grid item>
                    <LoadingButton
                      disabled={!selectedProduct}
                      type="submit"
                      loading={isLoading}
                      size="large"
                      variant="contained"
                    >
                      Guardar
                    </LoadingButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default AddUsedProductModal;
