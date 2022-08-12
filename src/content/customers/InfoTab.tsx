import { format } from "date-fns";
import { es } from "date-fns/locale";
import { capitalizeFirstLetter } from "../../../lib/client/utils";
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

const getHowFoundLabel = (howFoundId: string, referrer?: string) => {
  const map = {
    facebook: "Facebook",
    referred: `Referido por ${referrer}`,
    recomended: "Recomendado",
  };
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
function CustomerInfoTab({ customer, customerLevelList, customerList }) {
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
    const referredBy =  customerList.filter((c)=> c._id.toString() === customerId?.id)[0];
    setCustomerToEdit({...customerToEdit, referredBy});
  };
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
      setIsEditing({...isEditing, [type]: false});
      enqueueSnackbar(result.msg,{variant:"success", anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },autoHideDuration: 1500});
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
                        CURP:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {customer ? (
                        !isEditing.info ? (
                          <Text color="black">
                            <b>{customer?.curp}</b>
                          </Text>
                        ) : (
                          getInfoTextField("curp", 18, 18)
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
                        !isEditing.info ? (
                          getLevelLabel(
                            customer?.level?.id,
                            customer?.level?.name
                          )
                        ) : (
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
                          <>
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
                              <FormControlLabel
                                value="referred"
                                control={<Radio required={true} />}
                                label="Referido"
                              />
                              <FormControlLabel
                                value="facebook"
                                control={<Radio required={true} />}
                                label="Facebook"
                              />
                              <FormControlLabel
                                value="recomended"
                                control={<Radio required={true} />}
                                label="Recomendado"
                              />
                            </RadioGroup>{" "}
                          </>
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
                            Referido por:
                          </Box>
                        </Grid>
                        <Grid item xs={9} sm={6} md={6}>
                          <Autocomplete
                            size="small"
                            disablePortal
                            id="combo-box-demo"
                            options={customerList
                              .filter((c) => c._id !== customerToEdit._id)
                              .map((c) => {
                                return {
                                  label: `(${c.curp}) ${c.name}`,
                                  id: c._id,
                                };
                              })}
                            onChange={(event: any, newValue: string | null) => {
                              event.target;
                              handleReferredBy(newValue);
                            }}
                            defaultValue={
                              customerToEdit.referredBy
                                ? {
                                    label: `(${customerToEdit.referredBy.curp}) ${customerToEdit.referredBy.name}`,
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
                                format(
                                  new Date(customer?.createdAt),
                                  "MMMM dd yyyy HH:mm:mm",
                                  { locale: es }
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
                    {isEditing.info && (
                      <>
                        {hasErrorUpdating.info.error && (
                          <Grid item xs={12} sm={12} md={12} textAlign={"right"}>
                            <br />
                            <Typography
                              variant="h5"
                              component="h5"
                              color="error"
                              textAlign="right"
                            >
                              {hasErrorUpdating.info.msg}
                            </Typography>
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
                          sm={6}
                          md={8}
                          textAlign={"right"}
                          marginTop={2}
                        >
                          <Button
                            variant="outlined"
                            size="medium"
                            onClick={() => {
                              setIsEditing({ ...isEditing, info: false });
                              setHasErrorUpdating({...hasErrorUpdating, info: false });
                              setIsUpdating({...isUpdating, info: false });
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
                  </Grid>
                </Grid>
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
            <Button variant="text" startIcon={<EditTwoToneIcon />}>
              Modificar
            </Button>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid
                container
                direction={"row"}
                alignItems="center"
                justifyItems="center"
              >
                <Grid container item spacing={0} xs={12} sm={6} md={6}>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Calle y número:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.street}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Colonia:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.suburb}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Ciudad:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.city?.name}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Sector:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.sector?.name}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                </Grid>
                <Grid container item spacing={0} xs={12} sm={6} md={6}>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Domicilio Referencia:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.residenceRef}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Nombre Referencia:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.nameRef}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                    <Box pr={2} pb={2}>
                      Telefono referencia:
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={6}>
                    {customer ? (
                      <Text color="black">
                        {customer?.currentResidence?.telRef}
                      </Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Grid>

                  <Grid
                    container
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    alignItems="center"
                    justifyItems="center"
                    direction="column"
                  >
                    {customer ? (
                      <Button
                        variant="outlined"
                        href={`${customer?.currentResidence?.maps}`}
                        sx={{ width: "50%" }}
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
                </Grid>
              </Grid>
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
                          Renta actual:
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={6} md={6}>
                        {customer ? (
                          <Text color="black">
                            {customer?.currentRent || "1 semana"}
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
                            {customer?.maxRentTime || "3 semanas"}
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
                            {customer?.totalRent || "4 semanas"}
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
                          Clientes referidos:
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
