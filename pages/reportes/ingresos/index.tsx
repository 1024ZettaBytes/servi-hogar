import Head from "next/head";
import { useTheme } from "@material-ui/core/styles";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  CardHeader,
  Divider,
  Typography,
  TextField,
  CardContent,
} from "@mui/material";
import Footer from "@/components/Footer";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { getFetcher, useGetReport } from "../../api/useRequest";
import {
  capitalizeFirstLetter,
  convertDateToLocal,
  convertDateToTZ,
  formatTZDate,
} from "lib/client/utils";
import ReportCard from "./ReportCard";

import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import MonetizationOnTwoTone from "@material-ui/icons/MonetizationOnTwoTone";

function ProfitsReport() {

  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(
    convertDateToLocal(new Date())
  );
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "profits",
    convertDateToTZ(selectedDate)
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleOnSelectDate = (newValue) => {
    if (newValue && newValue.toString() !== "Invalid Date") {
      setSelectedDate(newValue);
    }
  };
  const getHeader = () => {
    const weekDay = capitalizeFirstLetter(formatTZDate(selectedDate, "dddd"));
    const monthDay = selectedDate.getDate();
    const month = capitalizeFirstLetter(formatTZDate(selectedDate, "MMMM"));
    const year = selectedDate.getFullYear();
    return `${weekDay} ${monthDay} de ${month}, ${year}`;
  };
  return (
    <>
      <Head>
        <title>Reportes | Ingresos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Reporte de Ingresos"} subtitle={""} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Card
          sx={{
            px: 1,
            mb: 1,
          }}
        >
          <CardContent>
            <Grid container>
              <Grid
                item
                alignItems="center"
                justifyContent="center"
                display={"flex"}
                mr={1}
              >
                <Typography fontWeight={"bold"} fontSize={15}>
                  Seleccione día:{" "}
                </Typography>
              </Grid>
              <Grid item lg={10}>
                <DesktopDatePicker
                  label=""
                  inputFormat="dd/MM/yyyy"
                  value={selectedDate}
                  maxDate={new Date()}
                  disabled={!generalError && !completeData}
                  onChange={(newValue) => {
                    handleOnSelectDate(newValue);
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            <Card id="reportTable">
              {generalError ? (
                <Alert severity="error">{reportError?.message}</Alert>
              ) : !completeData ? (
                <Skeleton
                  variant="rectangular"
                  width={"100%"}
                  height={500}
                  animation="wave"
                />
              ) : (
                <div>
                  <CardHeader
                    sx={{
                      display: "flex",
                      textAlign: "center",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                    }}
                    title={"INGRESOS"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <Grid container spacing={3} padding={2}>
                    <Grid item lg={3} sm={6} xs={12}>
                      <ReportCard
                        primary={reportData?.day?.SUM}
                        secondary="Del día"
                        color={theme.palette.success.main}
                        footerData=""
                        iconPrimary={MonetizationOnTwoTone}
                        iconFooter={TrendingUpIcon}
                      />
                    </Grid>
                    <Grid item lg={12} />
                    <Grid item lg={4} sm={6} xs={12}>
                      <ReportCard
                        primary={reportData?.week?.SUM}
                        secondary={`De la semana ${reportData?.week?.start} - ${reportData?.week?.end}`}
                        color={theme.palette.warning.dark}
                        footerData=""
                        iconPrimary={MonetizationOnTwoTone}
                        iconFooter={TrendingUpIcon}
                      />
                    </Grid>
                    <Grid item lg={12} />
                    <Grid item lg={6} sm={6} xs={12}>
                      <ReportCard
                        primary={reportData?.month?.SUM}
                        secondary={`Del mes de ${reportData?.month?.name}`}
                        color={theme.palette.success.contrastText}
                        footerData=""
                        iconPrimary={MonetizationOnTwoTone}
                        iconFooter={TrendingUpIcon}
                      />
                    </Grid>
                    <Grid item lg={12} />
                    <Grid item lg={8} sm={6} xs={12}>
                      <ReportCard
                        primary={reportData?.year?.SUM}
                        secondary={`Del año ${reportData?.year?.number}`}
                        color={theme.palette.info.dark}
                        footerData=""
                        iconPrimary={MonetizationOnTwoTone}
                        iconFooter={TrendingUpIcon}
                      />
                    </Grid>
                  </Grid>
                  <Box p={2}></Box>
                </div>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

ProfitsReport.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default ProfitsReport;
