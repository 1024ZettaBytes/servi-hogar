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
import {
  capitalizeFirstLetter,
  printElement,
  getLastDayMonth,
  getFirstDayMonth,
  sleep,
  convertDateToLocal,
  convertDateToTZ,
  formatTZDate,
} from "lib/client/utils";
import ActivityReportTable from "./ActivityReportTable";
import MonthPicker from "@/components/MonthPicker";
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
const customerStyle = {
  header: { ...headerStyle, backgroundColor: "#F4F189" },
  howFound: {
    facebook: { ...headerStyle, backgroundColor: "#2269C4" },
    ads: { ...headerStyle, backgroundColor: "#EC0000" },
    referred: { ...headerStyle, backgroundColor: "#8E8E8E" },
  },
};
const paymentStyle = { ...headerStyle, backgroundColor: "#89C3F4" };
function DayReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(convertDateToLocal(new Date()));
  const [start, setStart] = useState<Date>(getFirstDayMonth(convertDateToLocal(new Date())));
  const [end, setEnd] = useState<Date>(getLastDayMonth(convertDateToLocal(new Date())));
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "range",
    convertDateToTZ(start),
    convertDateToTZ(end)
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `Mensual_${formatTZDate(start, "MMMM-YYYY")}.pdf`;
    await printElement(document, fileName);
    setIsPrinting(false);
  };
  const handleOnSelectDate = (newValue) => {
    if (newValue && newValue.toString() !== "Invalid Date") {
      setSelectedDate(newValue);
      setStart(getFirstDayMonth(newValue));
      setEnd(getLastDayMonth(newValue));
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
    return capitalizeFirstLetter(
      formatTZDate(selectedDate, "MMMM YYYY")
    );
  };
  return (
    <>
      <Head>
        <title>Reportes | Mensual</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte Mensual"}
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
                display={"flex"}
                mr={1}
              >
                <Typography fontWeight={"bold"} fontSize={16}>
                  Seleccione el mes:{" "}
                </Typography>
              </Grid>
              <Grid item lg={9}>
                <MonthPicker
                  selectedValue={selectedDate}
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
                    title={"REPORTE MENSUAL"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <Grid container p={2}>
                    <Grid item lg={12}>
                      <ActivityReportTable
                        colorStyle={{
                          deliveryStyle,
                          changeStyle,
                          pickupStyle,
                          customerStyle,
                          paymentStyle,
                        }}
                        data={reportData}
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
