import React from "react";
import { Card, CardContent, Grid, Tooltip, Typography } from "@mui/material";
import numeral from "numeral";
import NextLink from "next/link";

const ReportCard = (props) => {
  const {
    primary,
    secondary,
    iconPrimary,
    color,
    footerData,
    iconFooter,
    refTo,
  } = props;

  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary ? (
    <IconPrimary
      style={{ cursor: "pointer" }}
      fontSize="large"
      sx={{
        "&:hover": {
          background: "gray",
        },
      }}
    />
  ) : null;

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
          {primaryIcon && (
            <Grid item>
              <Typography variant="h2" style={{ color: color }}>
                <NextLink href={refTo || ""}>
                  <Tooltip title="Ver detalle (bancario)" arrow>
                    {primaryIcon}
                  </Tooltip>
                </NextLink>
              </Typography>
            </Grid>
          )}
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
