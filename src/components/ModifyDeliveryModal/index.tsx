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
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import OperationTime from "../../../pages/renta-rapida/OperationTime";
import { updateDeliveryTime } from "../../../lib/client/deliveriesFetch";
import { dateDiffInDays } from "lib/client/utils";

function ModifyDeliveryModal(props) {
  const { handleOnClose, open, deliveryToEdit } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState({
    date: new Date(deliveryToEdit.date),
    timeOption: deliveryToEdit.timeOption,
    fromTime: new Date(deliveryToEdit.fromTime),
    endTime: new Date(deliveryToEdit.endTime),
  });
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  const saveButtonEnabled =
    deliveryTime.timeOption === "any" ||
    (deliveryTime.date &&
      dateDiffInDays(new Date(), new Date(deliveryTime.date)) >= 0 &&
      deliveryTime.fromTime &&
      deliveryTime.endTime &&
      new Date(deliveryTime.fromTime).getTime() <=
        new Date(deliveryTime.endTime).getTime());

  const onChangeDeliverTime = (id, value) => {
    if (
      (id === "fromTime" || id === "endTime") &&
      value.toString() === "Invalid Date"
    ) {
      value = null;
    }

    setDeliveryTime({ ...deliveryTime, [id]: value });
  };
  async function submitHandler(event) {
    event.preventDefault();
    setIsLoading(true);
    setHasError({ error: false, msg: "" });
    const result = await updateDeliveryTime({
      deliveryId: deliveryToEdit._id,
      deliveryTime,
    });
    setIsLoading(false);
    if (!result.error) {
      handleUpdatedDelivery(result.msg);
    } else {
      handleErrorOnSave(result.msg);
    }
  }
  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setIsLoading(false);
    handleOnClose(false);
  };
  const handleUpdatedDelivery = (successMessage) => {
    handleOnClose(true, successMessage);
  };

  const handleErrorOnSave = (msg) => {
    setHasError({ error: true, msg });
  };

  return (
    <Dialog open={open} fullWidth={true} scroll={"body"}>
      <Card>
        <CardHeader title="Modificar horario de entrega" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <OperationTime
              fullWidth
              date={deliveryTime.date}
              minDate={deliveryToEdit.createdAt}
              timeOption={deliveryTime.timeOption}
              fromTime={deliveryTime.fromTime}
              endTime={deliveryTime.endTime}
              onChangeTime={onChangeDeliverTime}
            />
            <Grid
              container
              direction="column"
              justifyContent="center"
              spacing={2}
              maxWidth="lg"
            >
              <Grid item lg={12}>
                {hasError.error ? (
                  <Grid item>
                    <br />
                    <Alert severity="error">{hasError?.msg}</Alert>
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
                      disabled={!saveButtonEnabled}
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

ModifyDeliveryModal.propTypes = {
  handleOnClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  deliveryToEdit: PropTypes.object.isRequired,
};

export default ModifyDeliveryModal;
