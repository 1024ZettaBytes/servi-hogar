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
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

function CompleteCollectionModal(props) {
  const { open, handleOnClose, handleOnConfirm, isLoading} = props;
  
  const [outcome, setOutcome] = useState('PROMESA');
  const [hasError, setHasError] = useState({ error: false, msg: "" });

  const saveButtonEnabled = true; 

  async function submitHandler(event) {
    event.preventDefault();
    setHasError({ error: false, msg: "" });
    handleOnConfirm(outcome);
  }

  const handleClose = () => {
    setHasError({ error: false, msg: "" });
    setOutcome('PROMESA'); 
    handleOnClose();
  };

  return (
    <Dialog open={open} maxWidth="xs" scroll={"body"} fullWidth>
      <Card>
        <CardHeader title="Completar Cobranza" />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={submitHandler}>
            <Grid container spacing={2}>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ¿Con qué resultado se completó la visita?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    name="outcome"
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                  >
                    <FormControlLabel 
                      value="PROMESA" 
                      control={<Radio />} 
                      label="Promesa de pago" 
                    />
                    <FormControlLabel 
                      value="PAGO" 
                      control={<Radio />} 
                      label="Ya pagó" 
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                {hasError.error ? (
                  <Box mb={2}>
                    <Alert severity="error">{hasError?.msg}</Alert>
                  </Box>
                ) : null}
              </Grid>

              <Grid item xs={12}>
                <Grid
                  container
                  alignItems={"center"}
                  direction="row"
                  justifyContent="flex-end"
                  spacing={2}
                >
                  <Grid item>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={handleClose}
                      disabled={isLoading}
                      color="error"
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
                      Completar
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

CompleteCollectionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleOnClose: PropTypes.func.isRequired,   
  handleOnConfirm: PropTypes.func.isRequired, 
  isLoading: PropTypes.bool
};

CompleteCollectionModal.defaultProps = {
  isLoading: false
};

export default CompleteCollectionModal;