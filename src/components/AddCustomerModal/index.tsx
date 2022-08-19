import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  InputLabel,
  TextField,
  Typography,
  Select,
  FormControl,
  MenuItem,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { saveCustomer } from "../../../lib/client/customersFetch";
import {HOW_FOUND_LIST} from "../../../lib/consts/OBJ_CONTS";
function AddCustomerModal(props) {
  const { handleOnClose, open, citiesList, customerList } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [selectedCity, setSelectedCity] = useState();
  const [selectedSector, setSelectedSector] = useState();
  const [citySectors, setCitySectors] = useState([]);
  const [wasReferred, setWasReferred] = useState(false);
  const [selectedHowFound, setSelectedHowFound] = useState();
  const [referredBy, setReferredBy] = useState();
  
  function handleCitySelection(city) {
    setSelectedCity(city);
    setSelectedSector(undefined);
    const filteredCity = citiesList.filter((c) => c._id === city);
    setCitySectors(filteredCity[0].sectors);
  }
  function handleSectorSelection(sector) {
    setSelectedSector(sector);
  }
  function handleHowFoundSelection(howFound) {
    setSelectedHowFound(howFound);
    setWasReferred(howFound === "referred");
  }
  function handleReferredBySelection(referredBy){
    setReferredBy(referredBy);
  }
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await saveCustomer({
      name: event.target.name.value,
      cell: event.target.cell.value,
      howFound: event.target.howFound.value,
      referredBy: referredBy,
      street: event.target.street.value,
      suburb: event.target.suburb.value,
      city: selectedCity,
      sector: selectedSector,
      residenceRef: event.target.residenceRef.value,
      nameRef: event.target.nameRef.value,
      telRef: event.target.telRef.value,
      maps: event.target.maps.value,
    });
    setIsLoading(false);
    if (!result.error) {
      handleSavedCustomer(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleSavedCustomer = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Ingrese datos de nuevo cliente" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="lg"
            >
              <Grid item lg={12}>
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  Datos personales
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="name"
                  name="name"
                  label="Nombre"
                  fullWidth={true}
                />
              </Grid>

              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="cell"
                  name="cell"
                  label="Celular"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <FormLabel id="howFound-radiogroup-label">
                  ¿Cómo se enteró del servicio?
                </FormLabel>
                <RadioGroup
                  aria-labelledby="howFound-radiogroup-label"
                  name="howFound"
                  value={selectedHowFound || ""}
                  onChange={(e) => handleHowFoundSelection(e.target.value)}
                  row
                >
                  {Object.entries(HOW_FOUND_LIST).map(how=><FormControlLabel
                    key={how[0]}
                    value={how[0]}
                    control={<Radio required={true} />}
                    label={how[1]}
                  />)}
                  </RadioGroup>
              </Grid>
              {wasReferred ? (
                  <Grid item lg={12}>
                    <Autocomplete
                      disablePortal
                      id="combo-box-demo"
                      options={customerList.map((customer) => {
                        return { label: `${customer.name}`, id: customer._id };
                      })}
                      onChange={(event: any, newValue: string | null) => {
                        event.target;
                        handleReferredBySelection(newValue);
                      }}
                      fullWidth
                      isOptionEqualToValue={(option:any, value:any) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField
                        required  
                          {...params}
                          label="Referido por"
                        />
                      )}
                    />
                  </Grid>
                ) : null}
              <Grid item lg={12}>
                <Typography
                  variant="h5"
                  component="h5"
                  color="secondary"
                  textAlign="left"
                  fontWeight="bold"
                >
                  Domicilio
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="street"
                  name="street"
                  label="Calle y Número"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="suburb"
                  name="suburb"
                  label="Colonia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <FormControl fullWidth>
                  <InputLabel id="city-id">Ciudad</InputLabel>
                  <Select
                    labelId="city-id"
                    id="city"
                    name="city"
                    label="Ciudad"
                    required
                    autoComplete="off"
                    value={selectedCity || ""}
                    onChange={(event) =>
                      handleCitySelection(event.target.value)
                    }
                  >
                    {citiesList
                      ? citiesList.map((city) => (
                          <MenuItem key={city._id} value={city._id}>
                            {city.name}
                          </MenuItem>
                        ))
                      : null}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item lg={12}>
                <FormControl fullWidth>
                  <InputLabel id="sector-id">Sector</InputLabel>
                  <Select
                    labelId="sector-id"
                    id="sector"
                    name="sector"
                    label="Sector"
                    required
                    autoComplete="off"
                    value={selectedSector || ""}
                    disabled={!selectedCity}
                    onChange={(event) =>
                      handleSectorSelection(event.target.value)
                    }
                  >
                    {citiesList && selectedCity
                      ? citySectors.map((sector) => (
                          <MenuItem key={sector._id} value={sector._id}>
                            {sector.name}
                          </MenuItem>
                        ))
                      : null}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="residenceRef"
                  name="residenceRef"
                  label="Domicilio Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="nameRef"
                  name="nameRef"
                  label="Nombre Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="telRef"
                  name="telRef"
                  label="Teléfono Referencia"
                  fullWidth={true}
                />
              </Grid>
              <Grid item lg={12}>
                <TextField
                  autoComplete="off"
                  required
                  id="maps"
                  name="maps"
                  label="Maps"
                  multiline
                  maxRows={3}
                  fullWidth={true}
                />
                {hasError.error ? (
                  <Grid item>
                    <br />
                    <Typography
                      variant="h5"
                      component="h5"
                      color="error"
                      textAlign="center"
                    >
                      {hasError.msg}
                    </Typography>
                  </Grid>
                ) : null}
              </Grid>

              <Grid item lg={12}>
                <Grid
                  container
                  alignItems={"right"}
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

AddCustomerModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  citiesList: PropTypes.array.isRequired,
  customerList: PropTypes.array.isRequired,
};

export default AddCustomerModal;

