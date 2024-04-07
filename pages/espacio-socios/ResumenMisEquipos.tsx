import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled,
} from "@mui/material";
import Label from "@/components/Label";
import numeral from "numeral";

const AvatarWrapperMachine = styled(Avatar)(
  ({ theme }) => `
        background-color: ${theme.colors.info.lighter};
        color:  black;
        width: 60px;
        height: 60px;
  `
);
function ResumenMisEquipos({ machinesList }) {
  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pb: 3,
        }}
      >
        <Typography variant="h4">Mis Equipos</Typography>
      </Box>
      <Grid container spacing={1}>
        {machinesList
          ? machinesList.map((machine) => (
              <Grid xs={12} sm={6} md={3} item key={machine.machineNum}>
                <Card
                  sx={{
                    px: 1,
                    height: "150px",
                    overflowY: "auto",
                  }}
                >
                  <CardContent>
                    <Grid
                      container
                      alignItems="center"
                      justifyItems="center"
                      textAlign={{ lg: "center" }}
                    >
                      <Grid item lg={3} md={2} xs={2}>
                        <AvatarWrapperMachine>
                          <Typography>
                            <b>{machine?.machineNum}</b>
                          </Typography>
                        </AvatarWrapperMachine>
                      </Grid>
                      <Grid item lg={9} md={2} xs={2}>
                        <Label
                          color={machine?.isOnRent ? "success" : "secondary"}
                        >
                          <b>
                            {machine?.isOnRent
                              ? `RENTADO${
                                  machine?.rentWeeks > 0
                                    ? " (" + machine?.rentWeeks + " semana(s))"
                                    : ""
                                }`
                              : "Sin renta"}
                          </b>
                        </Label>
                      </Grid>
                      <Grid item lg={6} md={8} xs={8}>
                        <Typography variant="h5" noWrap textAlign="left">
                          <b>Costo</b>
                        </Typography>
                        <Typography variant="subtitle2" noWrap textAlign="left">
                          {numeral(machine?.cost).format(`$0,0.00`)}
                        </Typography>
                      </Grid>
                      <Grid item lg={6} md={8} xs={8}>
                        <Typography variant="h5" noWrap textAlign="left">
                          <b>Ganancias</b>
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          color="green"
                          noWrap
                          textAlign="left"
                        >
                          {numeral(machine?.generated).format(`$0,0.00`)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))
          : null}
      </Grid>
    </>
  );
}

export default ResumenMisEquipos;
