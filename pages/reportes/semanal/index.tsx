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
} from "lib/client/utils";
import WeekPicker from "@/components/WeekPicker";
import ActivityReportTable from "./ActivityReportTable";

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
//const customerStyle = { ...headerStyle, backgroundColor: "#E570EE" };
///const paymentStyle = { ...headerStyle, backgroundColor: "#A580EE" };
const DUMMY = {
  deliveries:{
    totalData:{
      sent:80,
      done:55
    },
    days:[
      {
        weekDay:"Sábado",
        sent:10,
        done:10
      },
      {
        weekDay:"Domingo",
        sent:15,
        done:14
      },
      {
        weekDay:"Lunes",
        sent:12,
        done:11
      },
      {
        weekDay:"Martes",
        sent:10,
        done:5
      },
      {
        weekDay:"Miércoles",
        sent:11,
        done:2
      },
      {
        weekDay:"Jueves",
        sent:12,
        done:8
      },
      {
        weekDay:"Viernes",
        sent:10,
        done:5
      },
    ]
  }
}
function DayReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [start, setStart] = useState<Date>(getFirstWeekDay(new Date()));
  const [end, setEnd] = useState<Date>(getLastWeekDay(new Date()));
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "day",
    selectedDate
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = () => {
    const fileName = `SEMANAL_${format(start, "dd-LLLL-yyyy", {
      locale: es,
    })}_al_${format(end, "dd-LLLL-yyyy", {
      locale: es,
    })}.pdf`;

    printElement(document, fileName);
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
        <Grid
          container
          
        >
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
                  <Grid container
                  spacing={2}
                  p={2}
                  
                  >
                  <Grid item lg={6}>
                  <ActivityReportTable
                    header="ENTREGAS"
                    colorStyle={deliveryStyle}
                    totalData={DUMMY.deliveries.totalData}
                    list={DUMMY.deliveries.days}
                  />
                  </Grid>
                  <Grid item lg={6}>
                  <ActivityReportTable
                    header="CAMBIOS"
                    colorStyle={changeStyle}
                    totalData={DUMMY.deliveries.totalData}
                    list={DUMMY.deliveries.days}
                  />
                  </Grid>
                  <Grid item lg={6}>
                  <ActivityReportTable
                    header="RECOLECCIONES"
                    colorStyle={pickupStyle}
                    totalData={DUMMY.deliveries.totalData}
                    list={DUMMY.deliveries.days}
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
