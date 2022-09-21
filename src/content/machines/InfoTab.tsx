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
  Alert,
} from "@mui/material";
import { MACHINE_STATUS_LIST } from "../../../lib/consts/OBJ_CONTS";
import { useSnackbar } from "notistack";
import { Skeleton } from "@mui/material";
import TablaHistorialEquipos from "./TablaHistorialEquipos";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CurrencyExchangeIcon from "@mui/icons-material/CurrencyExchange";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BuildIcon from "@mui/icons-material/Build";
import Text from "@/components/Text";
import Label from "@/components/Label";
import { useState } from "react";
import { updateMachine } from "lib/client/machinesFetch";
import { LoadingButton } from "@mui/lab";
import numeral from "numeral";

const getStatusLabel = (
  status: String,
  rent: any,
  vehicle: any,
  warehouse: any
) => {
  const notAvailable = "Información no disponible";
  switch (status) {
    case MACHINE_STATUS_LIST.RENTADO:
      return (
        <Label color="secondary">
          <CurrencyExchangeIcon fontSize="small" />
          <b>{rent ? `Rentado (Renta ${rent?.rentNum})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.VEHI:
      return (
        <Label color="info">
          <LocalShippingIcon fontSize="small" />
          <b>
            {vehicle ? `En vehículo (${vehicle?.description})` : notAvailable}
          </b>
        </Label>
      );
    case MACHINE_STATUS_LIST.ESPE:
      return (
        <Label color="warning">
          <HourglassEmptyIcon fontSize="small" />
          <b>{warehouse ? `Pendiente (${warehouse?.name})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.LISTO:
      return (
        <Label color="warning">
          <EventAvailableIcon fontSize="small" />
          <b>{warehouse ? `Disponible (${warehouse?.name})` : notAvailable}</b>
        </Label>
      );
    case MACHINE_STATUS_LIST.MANTE:
      return (
        <Label color="warning">
          <BuildIcon fontSize="small" />
          <b>
            {warehouse ? `En mantenimiento (${warehouse?.name})` : notAvailable}
          </b>
        </Label>
      );
  }
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

function MachineInfoTab({ role, machine }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isEditing, setIsEditing] = useState<any>({
    info: false,
    residence: false,
  });
  const [machineToEdit, setMachineToEdit] = useState<any>({ isSet: false });
  const [isUpdating, setIsUpdating] = useState<any>({ info: false });
  const [hasErrorUpdating, setHasErrorUpdating] = useState<any>({
    info: { error: false, msg: "" },
  });

  async function handleUpdateMachine(event) {
    event.preventDefault();
    const type = event.target.type.value;
    setHasErrorUpdating({
      ...hasErrorUpdating,
      [type]: { error: false, msg: "" },
    });
    setIsUpdating({ ...isUpdating, [type]: true });
    const result = await updateMachine({
      ...machineToEdit,
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
      value={machineToEdit[field]}
      onChange={(e) => {
        setMachineToEdit({
          ...machineToEdit,
          [field]: e.target.value,
        });
      }}
    />
  );


  if (!machineToEdit.isSet && machine) {
    setMachineToEdit({ ...machine, isSet: true });
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
                Datos generales
              </Typography>
            </Box>
            {!isEditing.info && role === "ADMIN" && (
              <Button
                variant="text"
                startIcon={<EditTwoToneIcon />}
                onClick={() => {
                  setMachineToEdit({ ...machine, isSet: true });
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
              <Box component="form" onSubmit={handleUpdateMachine}>
                <Grid
                  container
                  direction={"row"}
                  alignItems="left"
                  justifyItems="left"
                >
                  <Grid container item spacing={0} xs={12} sm={6} md={6}>
                    <Grid item xs={3} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        # de Equipo:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        !isEditing.info ? (
                          <Text color="black">{machine?.machineNum}</Text>
                        ) : (
                          getInfoTextField("machineNum", 1, 5)
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
                        Marca:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                        {machine ? (
                          !isEditing.info ? (
                            <Text color="black">{machine?.brand}</Text>
                          ) : (
                            getInfoTextField("brand", 1, 20)
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
                        Características:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                        {machine ? (
                          !isEditing.info ? (
                            <Text color="black">{machine?.capacity}</Text>
                          ) : (
                            getInfoTextField("capacity", 1, 8)
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
                        Estado actual:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        getStatusLabel(
                          machine?.status?.id,
                          machine.lastRent,
                          machine.currentVehicle,
                          machine.currentWarehouse
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
                        Cambios:
                      </Box>
                    </Grid>
                    <Grid item xs={9} sm={6} md={6}>
                      {machine ? (
                        <Text color="black">{machine?.totalChanges}</Text>
                      ) : (
                        <Skeleton
                          variant="text"
                          sx={{ fontSize: "1rem", width: "100px" }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={6} sm={6} md={6} textAlign={{ sm: "right" }}>
                      <Box pr={2} pb={2}>
                        Fecha de ingreso:
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} md={6}>
                      {machine ? (
                        <Text color="black">
                          {capitalizeFirstLetter(
                            format(
                              new Date(machine?.createdAt),
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
                Historial de movimientos
              </Typography>
            </Box>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Grid container>
              <Grid item xs={12} md={12} lg={12}>
                {machine?.movements ? (
                  <TablaHistorialEquipos movements={machine?.movements} />
                ) : (
                  <Skeleton
                    variant="rectangular"
                    width={"100%"}
                    height={500}
                    animation="wave"
                  />
                )}
              </Grid>

              {machine ? (
                <Grid item xs={12} md={12} lg={12}>
                  <Grid container padding={3}>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography variant="h5">
                        {"Costo: $" +
                          numeral(machine?.cost).format(
                            `${machine?.cost}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography variant="h5">
                        {"Gastos: $" +
                          numeral(machine?.expenses).format(
                            `${machine?.expenses}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                      <Typography
                        variant="h5"
                        color={machine?.earnings > 0.0 ? "success" : "error"}
                      >
                        {"Generado: $" +
                          numeral(machine?.earnings).format(
                            `${machine?.earnings}0,0.00`
                          )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <Skeleton variant="text" width={"100%"} animation="wave" />
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default MachineInfoTab;
