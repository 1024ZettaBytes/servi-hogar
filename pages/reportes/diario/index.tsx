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
import { getFetcher, useGetReport } from "../../api/useRequest";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { capitalizeFirstLetter, printElement } from "lib/client/utils";

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
const customerStyle = { ...headerStyle, backgroundColor: "#E570EE" };
const paymentStyle = { ...headerStyle, backgroundColor: "#A580EE" };
function DayReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { reportData, reportError } = useGetReport(
    getFetcher,
    "day",
    selectedDate
  );
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = () => {
    const fileName = `Reporte_DIARIO_${format(selectedDate, "dd-MM-yyyy")}.pdf`;

    printElement(document, fileName);
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
    variant: "outlined",
    color: "info",
  };
  const getHeader = () => {
    const weekDay = capitalizeFirstLetter(
      format(selectedDate, "eeee", {
        locale: es,
      })
    );
    const monthDay = selectedDate.getDate();
    const month = capitalizeFirstLetter(
      format(selectedDate, "LLLL", {
        locale: es,
      })
    );
    const year = selectedDate.getFullYear();
    return `${weekDay} ${monthDay} de ${month}, ${year}`;
  };
  return (
    <>
      <Head>
        <title>Reportes | Diario</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte Diario"}
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
                    title={"REPORTE DIARIO"}
                    subheader={getHeader()}
                  />
                  <Divider />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" style={headerStyle}>
                            Actividad
                          </TableCell>
                          <TableCell align="center" style={headerStyle}>
                            Por día
                          </TableCell>
                          <TableCell
                            align="center"
                            style={headerStyle}
                          >{`Total ${format(selectedDate, "LLLL", {
                            locale: es,
                          })}`}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell align="center" style={deliveryStyle}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              Entregas
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.deliveries?.dayTotal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.deliveries?.monthTotal}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="center" style={pickupStyle}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              Recolecciones
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.pickups?.dayTotal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.pickups?.monthTotal}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="center" style={changeStyle}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              Cambios
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.changes?.dayTotal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.changes?.monthTotal}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="center" style={customerStyle}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              Clientes Nuevos
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.customers?.dayTotal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.customers?.monthTotal}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="center" style={paymentStyle}>
                            <Typography
                              variant="body1"
                              fontWeight="bold"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              Depositos
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.payments?.dayTotal}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.payments?.monthTotal}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
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
