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
} from "@mui/material";
import Footer from "@/components/Footer";
import { getFetcher, useGetMachinesReport } from "../../api/useRequest";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { printElement, sleep, formatTZDate } from "lib/client/utils";
import ActivityReportTable from "./MovementsReportable";
const cellStyle = { border: "2px solid #374246" };
const headerStyle = {
  ...cellStyle,
  backgroundColor: "#35AEE2",
  color: "black",
  fontWeight: "bold",
};
const machineStyle = {
  hasMovements: { ...headerStyle, backgroundColor: "#43B91A" },
  noMovements: { ...headerStyle, backgroundColor: "#EC0000" },
  doesNotExists: { ...headerStyle, backgroundColor: "#8E8E8E" },
  isLost: { ...headerStyle, backgroundColor: "#F66A02" },
  onLittleWarehouse: { ...headerStyle, backgroundColor: "#F6E702" },
};
function DayReport() {
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const { reportData, reportError } = useGetMachinesReport(getFetcher);
  const generalError = reportError;
  const completeData = reportData;

  const handleClickOpen = async () => {
    setIsPrinting(true);
    await sleep(1000);
    const fileName = `Equipos-Mensual_${formatTZDate(
      new Date(),
      "MMMM-YYYY"
    )}.pdf`;
    await printElement(document, fileName);
    setIsPrinting(false);
  };

  const button = {
    text: "Descargar PDF",
    onClick: handleClickOpen,
    startIcon: <CloudDownloadIcon />,
    isLoading: isPrinting,
    variant: "outlined",
    color: "info",
  };

  return (
    <>
      <Head>
        <title>Reportes | Equipos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Reporte de Equipos"}
          subtitle={""}
          button={!generalError && completeData ? button : null}
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
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
                  />
                  <Grid container p={0.5}>
                    <Grid item lg={12}>
                      <ActivityReportTable
                        colorStyle={{
                          machineStyle,
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
