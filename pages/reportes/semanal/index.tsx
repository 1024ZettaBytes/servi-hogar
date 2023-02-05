import Head from "next/head";
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
  CardContent,
} from "@mui/material";
import Footer from "@/components/Footer";
import { getFetcher, useGetReport } from "../../api/useRequest";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  capitalizeFirstLetter,
  getLastWeekDay,
  getFirstWeekDay,
  printElement,
  sleep,
} from "lib/client/utils";
import WeekPicker from "@/components/WeekPicker";
import ActivityReportTable from "./ActivityReportTable";
import RegistersReportTable from "./RegistersReportTable";

const cellStyle = { border: "2px solid #374246" };
const headerStyle = {
  ...cellStyle,
  backgroundColor: "#35AEE2",
  color: "black",
  fontWeight: "bold",
};
const deliveryStyle = { ...headerStyle, backgroundColor: "#DAF7A6" };
const pickupStyle = { ...headerStyle, backgroundColor: "#EE5656" };
const changeStyle = { ...headerStyle, backgroundColor: "#FFC300" };
const customerStyle = { ...headerStyle, backgroundColor: "#F4F189" };
const paymentStyle = { ...headerStyle, backgroundColor: "#89C3F4" };
function DayReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [start, setStart] = useState<Date>(getFirstWeekDay(new Date()));
  const [end, setEnd] = useState<Date>(getLastWeekDay(new Date()));
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "range",
    start,
    end
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `SEMANAL_${format(start, "dd-LLLL-yyyy", {
      locale: es,
    })}_al_${format(end, "dd-LLLL-yyyy", {
      locale: es,
    })}.pdf`;
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
    const startMonth = capitalizeFirstLetter(
      format(start, "LLLL", {
        locale: es,
      })
    );
    const endMonth = capitalizeFirstLetter(
      format(end, "LLLL", {
        locale: es,
      })
    );
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    return `${startMonthDay}/${startMonth}/${startYear} - ${endMonthDay}/${endMonth}/${endYear}`;
  };
  return (
    <>
      <Head>
        <title>Reportes | Semanal</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte Semanal"}
          subtitle={""}
          button={!generalError && completeData ? button : null}
        />
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
                    title={"REPORTE SEMANAL"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <Grid container spacing={4} p={2}>
                    <Grid item lg={6}>
                      <ActivityReportTable
                        header="ENTREGAS"
                        colorStyle={deliveryStyle}
                        totalData={reportData?.deliveries?.totalData}
                        list={reportData?.deliveries?.days}
                      />
                    </Grid>
                    <Grid item lg={6}>
                      <ActivityReportTable
                        header="CAMBIOS"
                        colorStyle={changeStyle}
                        totalData={reportData?.changes?.totalData}
                        list={reportData?.changes?.days}
                      />
                    </Grid>
                    <Grid item lg={6}>
                      <ActivityReportTable
                        header="RECOLECCIONES"
                        colorStyle={pickupStyle}
                        totalData={reportData?.pickups.totalData}
                        list={reportData?.pickups.days}
                      />
                    </Grid>
                    <Grid item lg={6}>
                      <RegistersReportTable
                        header="DEPOSITOS"
                        colorStyle={paymentStyle}
                        totalData={reportData.payments.totalData}
                        list={reportData.payments.days}
                      />
                    </Grid>
                    <Grid item lg={6}>
                      <RegistersReportTable
                        header="CLIENTES NUEVOS"
                        colorStyle={customerStyle}
                        totalData={reportData.customers.totalData}
                        list={reportData.customers.days}
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
