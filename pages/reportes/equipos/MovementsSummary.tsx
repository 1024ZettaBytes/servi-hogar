import { Card, Grid, Box, CardContent, Typography } from "@mui/material";

function MovementsSummary({
  withMovements,
  noMovements,
  lost,
  onLittleWarehouse,
  total,
  colorStyle,
}) {
  return (
    <>
      <Grid container spacing={1} marginBottom={1}>
        <Grid xs={12} sm={6} md={3} item>
          <Grid
            container
            alignItems="center"
            justifyItems="center"
            textAlign={{ lg: "center" }}
          >
            <Grid item lg={2} md={2} xs={2}>
              <Box
                sx={{
                  width: "100%",
                  height: 50,
                  backgroundColor:
                    colorStyle?.machineStyle?.hasMovements?.backgroundColor,
                }}
              />
            </Grid>
            <Grid item lg={3} md={2} xs={2}>
              <Typography variant="h3" gutterBottom noWrap>
                {withMovements}
              </Typography>
            </Grid>
            <Grid item lg={7} md={8} xs={8}>
              <Typography noWrap textAlign="left">
                Activos
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Grid
            container
            alignItems="center"
            justifyItems="center"
            textAlign={{ lg: "center" }}
          >
            <Grid item lg={2} md={2} xs={2}>
              <Box
                sx={{
                  width: "100%",
                  height: 50,
                  backgroundColor:
                    colorStyle?.machineStyle?.noMovements?.backgroundColor,
                }}
              />
            </Grid>
            <Grid item lg={3} md={2} xs={2}>
              <Typography variant="h3" gutterBottom noWrap>
                {noMovements}
              </Typography>
            </Grid>
            <Grid item lg={7} md={8} xs={8}>
              <Typography noWrap textAlign="left">
                Inactivos
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Grid
            container
            alignItems="center"
            justifyItems="center"
            textAlign={{ lg: "center" }}
          >
            <Grid item lg={2} md={2} xs={2}>
              <Box
                sx={{
                  width: "100%",
                  height: 50,
                  backgroundColor:
                    colorStyle?.machineStyle?.onLittleWarehouse?.backgroundColor,
                }}
              />
            </Grid>
            <Grid item lg={3} md={2} xs={2}>
              <Typography variant="h3" gutterBottom noWrap>
                {onLittleWarehouse}
              </Typography>
            </Grid>
            <Grid item lg={7} md={8} xs={8}>
              <Typography noWrap textAlign="left">
                En bodega chica
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid xs={12} sm={6} md={3} item>
          <Grid
            container
            alignItems="center"
            justifyItems="center"
            textAlign={{ lg: "center" }}
          >
            <Grid item lg={2} md={2} xs={2}>
              <Box
                sx={{
                  width: "100%",
                  height: 50,
                  backgroundColor:
                    colorStyle?.machineStyle?.isLost?.backgroundColor,
                }}
              />
            </Grid>
            <Grid item lg={3} md={2} xs={2}>
              <Typography variant="h3" gutterBottom noWrap>
                {lost}
              </Typography>
            </Grid>
            <Grid item lg={7} md={8} xs={8}>
              <Typography noWrap textAlign="left">
                En investigación
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid container>
          <Grid xs={12} md={4} item></Grid>
          <Grid xs={12} md={4} item>
            <Card
              sx={{
                background: "transparent",
                color: "none",
                boxShadow: "none",
              }}
            >
              <CardContent
                sx={{
                  background: "transparent",
                }}
              >
                <Grid container alignItems="center" justifyItems="center">
                  <Grid item lg={5} md={4} xs={4}>
                    <Typography variant="h3" textAlign="center">
                      TOTAL:
                    </Typography>
                  </Grid>
                  <Grid item lg={7} md={8} xs={8}>
                    <Typography variant="h3" noWrap>
                      {total}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid xs={12} md={4} item></Grid>
        </Grid>
      </Grid>
    </>
  );
}

export default MovementsSummary;
