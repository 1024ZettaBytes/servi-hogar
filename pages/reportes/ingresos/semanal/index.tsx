import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../../../lib/auth";
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
  CardContent,
} from "@mui/material";
import Footer from "@/components/Footer";
import { getFetcher, useGetReport } from "../../../api/useRequest";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import {
  capitalizeFirstLetter,
  getLastWeekDay,
  getFirstWeekDay,
  printElement,
  sleep,
  formatTZDate,
  convertDateToLocal,
  convertDateToTZ,
} from "lib/client/utils";
import WeekPicker from "@/components/WeekPicker";
import ActivityReportTable from "./ActivityReportTable";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";

const cellStyle = { border: "2px solid #374246" };
const headerStyle = {
  ...cellStyle,
  backgroundColor: "#35AEE2",
  color: "black",
  fontWeight: "bold",
};
const paymentStyle = { ...headerStyle, backgroundColor: "#89C3F4" };
function DayReport() {
  const paths = ["Inicio", "Reportes", "Ingresos", "Semanal"];
  const [selectedDate, setSelectedDate] = useState<Date>(
    convertDateToLocal(new Date())
  );
  const [start, setStart] = useState<Date>(
    getFirstWeekDay(convertDateToLocal(new Date()))
  );
  const [end, setEnd] = useState<Date>(
    getLastWeekDay(convertDateToLocal(new Date()))
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "profits-range",
    convertDateToTZ(start),
    convertDateToTZ(end)
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `INGRESOS_SEMANAL_${formatTZDate(
      start,
      "DD-MMMM-YYYY"
    )}_al_${formatTZDate(end, "DD-MMMM-YYYY")}.pdf`;
    await printElement(document, fileName);
    setIsPrinting(false);
  };
  const handleOnSelectDate = (newValue) => {
    if (newValue && newValue.toString() !== "Invalid Date") {
      setSelectedDate(newValue);
      setStart(getFirstWeekDay(newValue));
      setEnd(getLastWeekDay(newValue));
    }
  };
  const button = {
    text: "Descargar PDF",
    onClick: handleClickOpen,
    startIcon: <CloudDownloadIcon />,
    isLoading: isPrinting,
    variant: "outlined",
    color: "info",
  };
  const getHeader = () => {
    const startMonthDay = start.getDate();
    const endMonthDay = end.getDate();
    const startMonth = capitalizeFirstLetter(formatTZDate(start, "MMMM"));
    const endMonth = capitalizeFirstLetter(formatTZDate(end, "MMMM"));
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    return `${startMonthDay}/${startMonth}/${startYear} - ${endMonthDay}/${endMonth}/${endYear}`;
  };
  return (
    <>
      <Head>
        <title>Ingresos | Semanal</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte Ingresos Semanal"}
          subtitle={""}
          button={!generalError && completeData ? button : null}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
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
                textAlign="center"
                lg={12}
                mr={1}
              >
                <Typography fontWeight={"bold"} fontSize={16}>
                  Seleccione la semana:{" "}
                </Typography>
              </Grid>
              <Grid item lg={12}>
                <WeekPicker
                  selectedValue={selectedDate}
                  start={start}
                  end={end}
                  handleOnChange={handleOnSelectDate}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Grid container>
          <Grid item lg={12}>
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
              ) : reportData.groups.length === 0 ? (
                <Alert severity="info">
                  No hay registros para el periodo seleccionado
                </Alert>
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
                    title={"REPORTE DE INGRESOS SEMANAL"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <Grid container spacing={4} p={2}>
                    <Grid item lg={12}>
                      <ActivityReportTable
                        colorStyle={paymentStyle}
                        list={reportData.groups}
                        TOTAL={reportData.TOTAL}
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

DayReport.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default DayReport;
