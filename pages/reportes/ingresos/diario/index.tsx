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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  CardContent,
} from "@mui/material";
import Footer from "@/components/Footer";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { getFetcher, useGetReport } from "../../../api/useRequest";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import {
  capitalizeFirstLetter,
  convertDateToLocal,
  convertDateToTZ,
  formatTZDate,
  printElement,
  sleep,
} from "lib/client/utils";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import numeral from "numeral";

const cellStyle = { border: "2px solid #374246" };
const headerStyle = {
  ...cellStyle,
  backgroundColor: "#35AEE2",
  color: "black",
  fontWeight: "bold",
};

function DayReport() {
  const paths = ["Inicio", "Reportes", "Ingresos", "Diario"];
  const [selectedDate, setSelectedDate] = useState<Date>(
    convertDateToLocal(new Date())
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "profits-range",
    convertDateToTZ(selectedDate),
    convertDateToTZ(selectedDate)
  );
  const generalError = reportError;
  const completeData = reportData;
  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `INGRESOS_DIARIO_${formatTZDate(
      selectedDate,
      "DD-MM-YYYY"
    )}.pdf`;
    await printElement(document, fileName);
    setIsPrinting(false);
  };
  const handleOnSelectDate = (newValue) => {
    if (newValue && newValue.toString() !== "Invalid Date") {
      setSelectedDate(newValue);
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
    const weekDay = capitalizeFirstLetter(formatTZDate(selectedDate, "dddd"));
    const monthDay = selectedDate.getDate();
    const month = capitalizeFirstLetter(formatTZDate(selectedDate, "MMMM"));
    const year = selectedDate.getFullYear();
    return `${weekDay} ${monthDay} de ${month}, ${year}`;
  };
  return (
    <>
      <Head>
        <title>Ingresos | Diario</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte de Ingresos Diario"}
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
              ) : reportData.groups.length === 0 ? (
                <Alert severity="info">
                  No hay registros para el día seleccionado
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
                    title={"REPORTE INGRESOS DIARIO"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {reportData?.groups?.map((group) => (
                            <TableCell
                              key={group.account}
                              align="center"
                              style={headerStyle}
                            >
                              {group.account}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {reportData?.groups?.map((group) => (
                            <TableCell
                              key={group.account + group.days[0].date}
                              align="center"
                              style={cellStyle}
                            >
                              <Typography
                                variant="body1"
                                fontWeight="bold"
                                color="text.primary"
                                gutterBottom
                                noWrap
                              >
                                {numeral(group.days[0].done).format(
                                  `$${group.days[0].done}0,0.00`
                                )}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box p={2}></Box>
                  <Typography width="100%" align="center" padding="20px" variant="h2" style={{ color: "black" }}>
                    TOTAL:{" "}
                    {numeral(reportData.TOTAL).format(
                      `$${reportData.TOTAL}0,0.00`
                    )}
                  </Typography>
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
