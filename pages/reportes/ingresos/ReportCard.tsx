import React from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import numeral from "numeral";

const ReportCard = (props) => {
  const {
    primary,
    secondary,
    iconPrimary,
    color,
    footerData,
    iconFooter,
  } = props;

  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? <IconPrimary fontSize="large" /> : null;

  const IconFooter = iconFooter;
  const footerIcon = iconFooter ? <IconFooter /> : null;

  return (
    <Card style={{ backgroundColor: "#F1F1F1" }}>
      <CardContent>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="overline">{secondary}</Typography>
            <Typography variant="h2" style={{ color: color }}>
              {numeral(primary).format(`$${primary}0,0.00`)}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h2" style={{ color: color }}>
              {primaryIcon}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <div style={{ background: color }}>
        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="body2">{footerData}</Typography>
          </Grid>
          <Grid item>
            <Typography
              style={{
                paddingLeft: "20px",
                paddingRight: "20px",
                color: "white",
              }}
              variant="body2"
            >
              {footerIcon}
            </Typography>
          </Grid>
        </Grid>
      </div>
    </Card>
  );
};

export default ReportCard;
