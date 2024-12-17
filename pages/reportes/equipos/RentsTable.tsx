import { getSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../../lib/auth";
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
} from "@mui/material";
import Footer from "@/components/Footer";
import { getFetcher, useGetMachinesOnRentReport } from "../../api/useRequest";
import numeral from "numeral";

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
function RentsTable() {
  const { reportData, reportError } = useGetMachinesOnRentReport(
    getFetcher
  );
  const generalError = reportError;
  const completeData = reportData;



  
  return (
    <>
      <Container maxWidth="lg">
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
                    title={"Equipos rentados"}
                  />
                  <Divider />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" style={headerStyle}>
                            DÍAS RENTADA
                          </TableCell>
                          <TableCell align="center" style={headerStyle}>
                            # LAVADORAS
                          </TableCell>
                          <TableCell
                            align="center"
                            style={headerStyle}
                          >PORCENTAJE</TableCell>
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
                              1 - 60
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.less60?.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {
                              reportData?.less60?.percentage?.toFixed(1) +"%"
                            }
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
                              61 - 180
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.less180?.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.less180?.percentage?.toFixed(1) +"%"}
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
                              181 - 365
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.less365?.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.less365?.percentage?.toFixed(1) +"%"}
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
                              +365
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.more365?.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" style={cellStyle}>
                            <Typography
                              variant="body1"
                              color="text.primary"
                              gutterBottom
                              noWrap
                            >
                              {reportData?.more365?.percentage?.toFixed(1) +"%"}
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

RentsTable.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default RentsTable;
