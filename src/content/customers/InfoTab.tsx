import { capitalizeFirstLetter, formatTZDate } from "../../../lib/client/utils";
import {
  Grid,
  Typography,
  CardContent,
  Card,
  Box,
  Divider,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Alert,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Skeleton } from "@mui/material";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import DangerousIcon from "@mui/icons-material/Dangerous";
import Text from "@/components/Text";
import Label from "@/components/Label";
import { useState } from "react";
import { updateCustomer } from "lib/client/customersFetch";
import { LoadingButton } from "@mui/lab";
import { HOW_FOUND_LIST } from "lib/consts/OBJ_CONTS";
import numeral from "numeral";



const getHowFoundLabel = (howFoundId: string, referrer?: string) => {
  let map = { ...HOW_FOUND_LIST };
  if (howFoundId === "referred") map.referred = `Recomendado por ${referrer}`;
  return map[howFoundId];
};
const getLevelLabel = (customerLevelId: string, customerLevelName: string) => {
  const map = {
    nuevo: (
      <Label color="secondary">
        <AddIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    regular: (
      <Label color="info">
        <ThumbUpIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    permanente: (
      <Label color="success">
        <CheckCircleIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    deudor: (
      <Label color="warning">
        <RequestQuoteIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    conflictivo: (
      <Label color="error">
        <DangerousIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
  };
  return map[customerLevelId];
};
const getIdOperation = (type: string) => (
  <TextField
    id="type"
    name="type"
    variant="outlined"
    size="small"
    sx={{ display: "none" }}
    value={type}
  />
);
const getErrorMessage = (message: string) => (
  <Typography variant="h5" component="h5" color="error" textAlign="left">
    {message}
  </Typography>
);
function CustomerInfoTab({
  role,
  customer,
  customerLevelList,
  customerList,
  citiesList,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState<any>({
    info: false,
    residence: false,
  });
  const [customerToEdit, setCustomerToEdit] = useState<any>({ isSet: false });
  const [isUpdating, setIsUpdating] = useState<any>({
    info: false,
    residence: false,
  });
  const [hasErrorUpdating, setHasErrorUpdating] = useState<any>({
    info: { error: false, msg: "" },
    residence: { error: false, msg: "" },
  });
  const handleReferredBy = (customerId) => {
    const referredBy = customerList.filter(
      (c) => c._id.toString() === customerId?.id
    )[0];
    setCustomerToEdit({ ...customerToEdit, referredBy });
  };
  function handleCitySelection(cityId) {
    const filteredCity = citiesList.filter((c) => c._id === cityId);
    const city = filteredCity[0];
    const sector = {};
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, city, sector },
    });
  }

  function handleSectorSelection(sectorId) {
    const sector = { _id: sectorId };
    setCustomerToEdit({
      ...customerToEdit,
      currentResidence: { ...customerToEdit.currentResidence, sector },
    });
  }
  async function handleUpdateCustomer(event) {
    event.preventDefault();
    const type = event.target.type.value;
    setHasErrorUpdating({
      ...hasErrorUpdating,
      [type]: { error: false, msg: "" },
    });
    setIsUpdating({ ...isUpdating, [type]: true });
    const result = await updateCustomer({
      ...customerToEdit,
      [type]: true,
    });
    setIsUpdating({ ...isUpdating, [type]: false });
    if (!result.error) {
      setIsEditing({ ...isEditing, [type]: false });
      enqueueSnackbar(result.msg, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    } else {
      setHasErrorUpdating({
        ...hasErrorUpdating,
        [type]: { error: true, msg: result.msg },
      });
    }
  }
  const getInfoTextField = (
    field: string,
    minLength: number,
    maxLength: number
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      required
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          [field]: e.target.value,
        });
      }}
    />
  );

  const getResidenceTextField = (
    field: string,
    minLength: number,
    maxLength: number
  ) => (
    <TextField
      fullWidth
      inputProps={{ minLength, maxLength }}
      autoComplete="off"
      required
      id={field}
      name={field}
      variant="outlined"
      size="small"
      value={customerToEdit.currentResidence[field]}
      onChange={(e) => {
        setCustomerToEdit({
          ...customerToEdit,
          currentResidence: {
            ...customerToEdit.currentResidence,
            [field]: e.target.value,
          },
        });
      }}
    />
  );

  if (!customerToEdit.isSet && customer) {
    setCustomerToEdit({ ...customer, isSet: true });
  }
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Datos personales
              </Typography>
            </Box>
            {!isEditing.info && (
              <Button
                variant="text"
                startIcon={<EditTwoToneIcon />}
                onClick={() => {
                  setCustomerToEdit({ ...customer, isSet: true });
                  setIsEditing({ ...isEditing, info: true });
                }}
              >
                Modificar
              </Button>
            )}
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Box component="form" onSubmit={handleUpdateCustomer}>
                <Grid
                  container
                  direction={"row"}
                  alignItems="left"
                  justifyItems="left"
                >
                  <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Nombre:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.info ? (
                          <Text color="black">{customer?.name}</Text>
                        ) : (
                          getInfoTextField("name", 1, 100)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Celular:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                        {customer ? (
                          !isEditing.info ? (
                            <Text color="black">{customer?.cell}</Text>
                          ) : (
                            getInfoTextField("cell", 10, 10)
                          )
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Nivel:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.info || role !== "ADMIN" ? (
                          getLevelLabel(
                            customer?.level?.id,
                            customer?.level?.name
                          )
                        ) : customerLevelList ? (
                          <FormControl>
                            <Select
                              size="small"
                              labelId="level-id"
                              id="level"
                              name="level"
                              required
                              autoComplete="off"
                              value={customerToEdit?.level._id || ""}
                              onChange={(event) =>
                                setCustomerToEdit({
                                  ...customerToEdit,
                                  level: { _id: event.target.value },
                                })
                              }
                            >
                              {customerLevelList
                                ? customerLevelList.map((level) => (
                                    <MenuItem key={level._id} value={level._id}>
                                      {level.name}
                                    </MenuItem>
                                  ))
                                : null}
                            </Select>
                          </FormControl>
                        ) : (
                          getErrorMessage("Error al obtener los niveles")
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Fuente:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.info ? (
                          <Text color="black">
                            {getHowFoundLabel(
                              customer?.howFound,
                              customer?.referredBy?.name
                            )}
                          </Text>
                        ) : (
                          <RadioGroup
                            aria-labelledby="howFound-radiogroup-label"
                            name="howFound"
                            defaultValue={customer?.howFound || ""}
                            onChange={(e) =>
                              setCustomerToEdit({
                                ...customerToEdit,
                                howFound: e.target.value,
                              })
                            }
                          >
                            {Object.entries(HOW_FOUND_LIST).map((how) => (
                              <FormControlLabel
                                key={how[0]}
                                value={how[0]}
                                control={<Radio required={true} />}
                                label={how[1]}
                              />
                            ))}
                          </RadioGroup>
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    {isEditing.info && customerToEdit?.howFound === "referred" && (
                      <>
                        <Grid
                          item
                          xs={3}
                          sm={6}
                          md={6}
                          textAlign={{ sm: "right" }}
                        >
                          <Box pr={2} pb={2}>
                            Recomendado por:
                          </Box>
                        </Grid>
                        <Grid item xs={9} sm={6} md={6}>
                          {customerList ? (
                            <Autocomplete
                              size="small"
                              disablePortal
                              id="combo-box-demo"
                              options={customerList
                                .filter((c) => c._id !== customerToEdit._id)
                                .map((c) => {
                                  return {
                                    label: `${c.name}`,
                                    id: c._id,
                                  };
                                })}
                              onChange={(
                                event: any,
                                newValue: string | null
                              ) => {
                                event.target;
                                handleReferredBy(newValue);
                              }}
                              defaultValue={
                                customerToEdit.referredBy
                                  ? {
                                      label: `${customerToEdit.referredBy.name}`,
                                      id: customerToEdit.referredBy._id,
                                    }
                                  : null
                              }
                              fullWidth
                              isOptionEqualToValue={(option: any, value: any) =>
                                option.id === value.id
                              }
                              renderInput={(params) => (
                                <TextField required {...params} />
                              )}
                            />
                          ) : (
                            getErrorMessage("Error al obtener los clientes")
                          )}
                        </Grid>
                      </>
                    )}
                    {!isEditing.info && (
                      <>
                        <Grid
                          item
                          xs={6}
                          sm={6}
                          md={6}
                          textAlign={{ sm: "right" }}
                        >
                          <Box pr={2} pb={2}>
                            Fecha de ingreso:
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={6} md={6}>
                          {customer ? (
                            <Text color="black">
                              {capitalizeFirstLetter(
                                formatTZDate(
                                  new Date(customer?.createdAt),
                                  "MMMM DD YYYY HH:mm:ss"
                                )
                              )}
                            </Text>
                          ) : (
                            <Skeleton
                              variant="text"
                              sx={{ fontSize: "1rem", width: "100px" }}
                            />
                          )}
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Grid>
                {isEditing.info && (
                  <>
                    {hasErrorUpdating.info.error && (
                      <Grid item xs={12} sm={12} md={12} textAlign={"center"}>
                        <br />
                        <Alert severity="error">
                          {hasErrorUpdating.info.msg}
                        </Alert>
                      </Grid>
                    )}
                    <Grid
                      item
                      xs={0}
                      sm={0}
                      md={0}
                      textAlign={{ sm: "right" }}
                    ></Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={12}
                      textAlign={"center"}
                      marginTop={2}
                    >
                      <Button
                        variant="outlined"
                        size="medium"
                        onClick={() => {
                          setIsEditing({ ...isEditing, info: false });
                          setHasErrorUpdating({
                            ...hasErrorUpdating,
                            info: false,
                          });
                          setIsUpdating({ ...isUpdating, info: false });
                        }}
                      >
                        Cancelar
                      </Button>

                      <LoadingButton
                        sx={{ marginLeft: 1 }}
                        type="submit"
                        size="medium"
                        loading={isUpdating.info}
                        variant="contained"
                      >
                        Guardar
                      </LoadingButton>
                      {getIdOperation("info")}
                    </Grid>
                  </>
                )}
              </Box>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Domicilio
              </Typography>
              <Typography variant="subtitle2">
                Se muestra el domicilio actual del cliente
              </Typography>
            </Box>
            {!isEditing.residence && (
              <Button
                variant="text"
                startIcon={<EditTwoToneIcon />}
                onClick={() => {
                  setCustomerToEdit({ ...customer, isSet: true });
                  setIsEditing({ ...isEditing, residence: true });
                }}
              >
                Modificar
              </Button>
            )}
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Box component="form" onSubmit={handleUpdateCustomer}>
                <Grid
                  container
                  direction={"row"}
                  alignItems="center"
                  justifyItems="center"
                >
                  <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Calle y número:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence.street}
                          </Text>
                        ) : (
                          getResidenceTextField("street", 1, 100)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Colonia:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence.suburb}
                          </Text>
                        ) : (
                          getResidenceTextField("suburb", 1, 100)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Ciudad:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence?.city.name}
                          </Text>
                        ) : (
                          <FormControl sx={{ width: "50%" }}>
                            <Select
                              labelId="city-id"
                              id="city"
                              name="city"
                              required
                              autoComplete="off"
                              size="small"
                              value={
                                customerToEdit?.currentResidence?.city?._id ||
                                ""
                              }
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
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Sector:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence?.sector.name}
                          </Text>
                        ) : (
                          <FormControl sx={{ width: "50%" }}>
                            <Select
                              labelId="sector-id"
                              id="sector"
                              name="sector"
                              required
                              autoComplete="off"
                              size="small"
                              placeholder="Seleccione un valor"
                              value={
                                customerToEdit?.currentResidence?.sector._id ||
                                ""
                              }
                              disabled={
                                !customerToEdit?.currentResidence.sector
                              }
                              onChange={(event) =>
                                handleSectorSelection(event.target.value)
                              }
                            >
                              {customerToEdit?.currentResidence?.city?.sectors
                                ?.length > 0
                                ? customerToEdit?.currentResidence?.city?.sectors?.map(
                                    (sector) => (
                                      <MenuItem
                                        key={sector._id}
                                        value={sector._id}
                                      >
                                        {sector.name}
                                      </MenuItem>
                                    )
                                  )
                                : null}
                            </Select>
                          </FormControl>
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                  </Grid>
                  <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Domicilio Referencia:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence?.residenceRef}
                          </Text>
                        ) : (
                          getResidenceTextField("residenceRef", 1, 250)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Nombre Referencia:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence?.nameRef}
                          </Text>
                        ) : (
                          getResidenceTextField("nameRef", 1, 100)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Telefono referencia:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.residence ? (
                          <Text color="black">
                            {customer?.currentResidence?.telRef}
                          </Text>
                        ) : (
                          getResidenceTextField("telRef", 1, 100)
                        )
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>

                    {!isEditing.residence ? (
                      <Grid
                        container
                        item
                        xs={12}
                        sm={12}
                        md={12}
                        alignItems="center"
                        justifyItems="center"
                        direction="column"
                        textAlign="center"
                      >
                        {customer ? (
                          customer.currentResidence?.maps &&
                          <Button
                            variant="outlined"
                            href={`${customer?.currentResidence?.maps}`}
                            sx={{ width: "50%" }}
                            target="_blank"
                            startIcon={<LocationOnIcon />}
                          >
                            Ver Ubicación
                          </Button>

                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                    ) : (
                      <>
                        <Grid
                          item
                          xs={3}
                          sm={6}
                          md={6}
                          textAlign={{ sm: "right" }}
                        >
                          <Box pr={2} pb={2}>
                            Maps:
                          </Box>
                        </Grid>
                        <Grid item xs={9} sm={6} md={6}>
                          <TextField
                            autoComplete="off"
                            id="maps"
                            name="maps"
                            multiline
                            maxRows={3}
                            fullWidth={true}
                            value={customerToEdit?.currentResidence?.maps}
                            onChange={(e) => {
                              setCustomerToEdit({
                                ...customerToEdit,
                                currentResidence: {
                                  ...customerToEdit.currentResidence,
                                  maps: e.target.value,
                                },
                              });
                            }}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Grid>
                {isEditing.residence && (
                  <>
                    {hasErrorUpdating.residence.error && (
                      <Grid item xs={12} sm={12} md={12} textAlign={"center"}>
                        <br />
                        <Alert severity="error">
                          {hasErrorUpdating.residence.msg}
                        </Alert>
                      </Grid>
                    )}
                    <Grid
                      item
                      xs={0}
                      sm={6}
                      md={4}
                      textAlign={{ sm: "right" }}
                    ></Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={12}
                      textAlign={"center"}
                      marginTop={2}
                    >
                      <Button
                        variant="outlined"
                        size="medium"
                        onClick={() => {
                          setIsEditing({ ...isEditing, residence: false });
                          setHasErrorUpdating({
                            ...hasErrorUpdating,
                            residence: false,
                          });
                          setIsUpdating({ ...isUpdating, residence: false });
                        }}
                      >
                        Cancelar
                      </Button>

                      <LoadingButton
                        sx={{ marginLeft: 1 }}
                        type="submit"
                        size="medium"
                        loading={isUpdating.residence}
                        variant="contained"
                      >
                        Guardar
                      </LoadingButton>
                      {getIdOperation("residence")}
                    </Grid>
                  </>
                )}
              </Box>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Otros datos
              </Typography>
            </Box>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid item xs={12}>
                <Typography variant="subtitle2">
                  <Grid
                    container
                    direction={"row"}
                    alignItems="center"
                    justifyItems="center"
                  >
                    <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Saldo del cliente:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">{`$${numeral(customer.balance).format(`${customer.balance}0,0.00`)}`}</Text>
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Renta actual:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">
                            {customer?.currentRent?.totalWeeks ? 
                            `${customer?.currentRent?.totalWeeks} semana(s)`
                             : "N/A"}
                          </Text>
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Mayor tiempo de renta:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">
                            {customer?.longestWeeks + " semana(s)"}
                          </Text>
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Renta total:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">
                            {customer?.totalRentWeeks + " semanas(s)"}
                          </Text>
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Clientes recomendados:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          customer?.referrals.map((referral) => (
                            <Text key={referral?._id} color="black">
                              {referral?.name}
                            </Text>
                          ))
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        sm={6}
                        md={6}
                        textAlign={{ sm: "right" }}
                      >
                        <Box pr={2} pb={2}>
                          Semanas gratis:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">{customer?.freeWeeks}</Text>
                        ) : (
                          <Skeleton
                            variant="text"
                            sx={{ fontSize: "1rem", width: "100px" }}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>
                </Typography>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CustomerInfoTab;
