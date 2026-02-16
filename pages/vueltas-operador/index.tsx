import Head from "next/head";
import { getSession, useSession } from "next-auth/react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import {
  Card,
  Container,
  Grid,
  Skeleton,
  Alert,
  Box,
  Typography,
  Chip,
  TextField,
} from "@mui/material";
import Footer from "@/components/Footer";
import {
  useGetPendingDeliveries,
  useGetPendingPickups,
  useGetPendingSalePickups,
  useGetPendingChanges,
  useGetPendingCollections,
  useGetDeliveries,
  useGetPickups,
  useGetChanges,
  useGetSalePickups,
  useGetCompletedCollections,
  useGetPendingExtraTrips,
  useGetCompletedExtraTrips,
  getFetcher,
} from "../api/useRequest";
import TablaVueltasOperador from "./TablaVueltasOperador";
import TablaVueltasExtras from "./TablaVueltasExtras";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import AddExtraTripModal from "@/components/AddExtraTripModal";
import { formatTZDate, setDateToEnd } from "lib/client/utils";
import numeral from "numeral";
import { useState } from "react";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { mutate } from "swr";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

function VueltasOperador({ session }) {
  const { data: sessionData } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addExtraTripModalOpen, setAddExtraTripModalOpen] = useState(false);
  
  // Use client-side session data if available, otherwise fall back to server-side session
  const currentUser = sessionData?.user || session?.user;
  const userRole = (currentUser as any)?.role;

  const handleRefresh = () => {
    // Trigger re-fetch of all pending tasks
    mutate('/api/deliveries/list/pending');
    mutate('/api/pickups/list/pending');
    mutate('/api/sale-pickups/list/pending');
    mutate('/api/changes/list/pending');
    mutate('/api/sales/collections/pending');
    mutate('/api/extra-trips/pending');
    // Trigger re-fetch of completed tasks for the selected date
    mutate(`/api/deliveries/list?limit=1000&page=1&date=${selectedDate.toISOString()}`);
    mutate(`/api/pickups/list?limit=1000&page=1&date=${formatTZDate(selectedDate, "YYYY-MM-DD")}`);
    mutate(`/api/changes/list?limit=1000&page=1&date=${formatTZDate(selectedDate, "YYYY-MM-DD")}`);
    mutate(`/api/sale-pickups/list?page=1&limit=1000&date=${formatTZDate(selectedDate, "YYYY-MM-DD")}`);
    mutate(`/api/sales/collections/completed?limit=1000&page=1&date=${formatTZDate(selectedDate, "YYYY-MM-DD")}`);
    mutate(`/api/extra-trips/completed?date=${formatTZDate(selectedDate, "YYYY-MM-DD")}`);
  };
  
  // Fetch pending tasks
  const { pendingDeliveriesList, pendingDeliveriesError } =
    useGetPendingDeliveries(getFetcher);
  const { pendingPickupsList, pendingPickupsError } =
    useGetPendingPickups(getFetcher);
  const { pendingSalePickupsList, pendingSalePickupsError } =
    useGetPendingSalePickups(getFetcher);
  const { pendingChangesList, pendingChangesError } =
    useGetPendingChanges(getFetcher);
  const { pendingCollectionsList, pendingCollectionsError } = 
    useGetPendingCollections(getFetcher);

  // Fetch all tasks (including completed) - using high limit to get all for the day
  const { deliveriesList, deliveriesError } = useGetDeliveries(
    getFetcher, 
    1000, 
    1, 
    null, 
    selectedDate
  );
  const { pickups, pickupsError } = useGetPickups(
    getFetcher, 
    1000, 
    1, 
    null, 
    formatTZDate(selectedDate, "YYYY-MM-DD")
  );
  const { changes, changesError } = useGetChanges(
    getFetcher, 
    1000, 
    1, 
    null, 
    formatTZDate(selectedDate, "YYYY-MM-DD")
  );
  const { salePickupsData, salePickupsError } = useGetSalePickups(
    getFetcher,
    1,
    1000,
    '',
    formatTZDate(selectedDate, "YYYY-MM-DD")
  );
  const { completedCollectionsList, completedCollectionsError } = useGetCompletedCollections(
    getFetcher, 
    1000, 
    1, 
    formatTZDate(selectedDate, "YYYY-MM-DD")
  );
  
  // Fetch extra trips
  const { pendingExtraTripsList, pendingExtraTripsError } = useGetPendingExtraTrips(getFetcher);
  const { completedExtraTripsList, completedExtraTripsError } = useGetCompletedExtraTrips(
    getFetcher,
    formatTZDate(selectedDate, "YYYY-MM-DD")
  );

  const generalError =
    pendingDeliveriesError || pendingPickupsError || pendingSalePickupsError || pendingChangesError ||
    deliveriesError || pickupsError || changesError || salePickupsError || pendingCollectionsError ||
    completedCollectionsError || pendingExtraTripsError || completedExtraTripsError;
  const completeData =
    pendingDeliveriesList && pendingPickupsList && pendingSalePickupsList && pendingChangesList &&
    deliveriesList && pickups && changes && salePickupsData && pendingCollectionsList && completedCollectionsList &&
    pendingExtraTripsList !== undefined && completedExtraTripsList !== undefined;
  
  const isBlocked = currentUser?.isBlocked === true;

  // Combine all tasks into a single array with type
  const allPendingTasks = completeData
    ? [
        // Sale warranty pickups (PRIORITY - always first)
        ...(pendingSalePickupsList || []).map((item) => ({
          ...item,
          type: "RECOLECCION_VENTA",
          sector: item.sale?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.sale?.customer?.currentResidence?.sector?._id
          )?.name,
          suburb: item.sale?.customer?.currentResidence?.suburb,
          isPriority: true,
        })),
        // All pending deliveries (no date filter)
        ...(pendingDeliveriesList || []).map((item) => ({
          ...item,
          type: "ENTREGA",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
          suburb: item.rent?.customer?.currentResidence?.suburb,
        })),
        // All pending pickups (no date filter)
        ...(pendingPickupsList || []).map((item) => ({
          ...item,
          type: "RECOLECCION",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
          suburb: item.rent?.customer?.currentResidence?.suburb,
        })),
        // All pending changes (no date filter)
        ...(pendingChangesList || []).map((item) => ({
          ...item,
          type: "CAMBIO",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
          suburb: item.rent?.customer?.currentResidence?.suburb,
        })),
        ...(pendingCollectionsList || []).map((item) => ({
          ...item,
          type: "COBRANZA",
          sector: item.sale?.customer?.currentResidence?.sector?.name,
          takenAt: item.createdAt,
          suburb: item.sale?.customer?.currentResidence?.suburb,
        })),
      ].sort((a, b) => {
        // Priority items (sale pickups) always first
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        
        // Scheduled tasks before unscheduled
        if (a.scheduledTime && !b.scheduledTime) return -1;
        if (!a.scheduledTime && b.scheduledTime) return 1;
        
        // Sort scheduled tasks by scheduledTime
        if (a.scheduledTime && b.scheduledTime) {
          return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
        }
        
        // Unscheduled tasks by takenAt - older first (ascending order)
        const dateA = new Date(a.takenAt || a.createdAt).getTime();
        const dateB = new Date(b.takenAt || b.createdAt).getTime();
        return dateA - dateB;
      })
    : [];

  // Combine completed tasks for the selected date (already filtered by backend)
  const allCompletedTasks = completeData
    ? [
        // Completed deliveries for the selected date (backend filtered)
        ...((deliveriesList?.list || []).filter(item => item.status === 'ENTREGADA')).map((item) => ({
          ...item,
          type: "ENTREGA",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
        })),
        // Completed pickups for the selected date (backend filtered)
        ...((pickups?.list || []).filter(item => item.status === 'RECOLECTADA')).map((item) => ({
          ...item,
          type: "RECOLECCION",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
        })),
        // Completed sale pickups for the selected date (backend filtered)
        ...((salePickupsData?.list || []).filter(item => item.status === 'COMPLETADA')).map((item) => ({
          ...item,
          type: "RECOLECCION_VENTA",
          sector: item.sale?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.sale?.customer?.currentResidence?.sector?._id
          )?.name,
        })),
        // Completed changes for the selected date (backend filtered)
        ...((changes?.list || []).filter(item => item.status === 'FINALIZADO')).map((item) => ({
          ...item,
          type: "CAMBIO",
          sector: item.rent?.customer?.currentResidence?.city?.sectors?.find(
            (s) => s._id === item.rent?.customer?.currentResidence?.sector?._id
          )?.name,
        })),
        ...(completedCollectionsList?.list || []).map((item) => ({
          ...item,
          type: "COBRANZA",
          sector: item.sale?.customer?.currentResidence?.sector?.name,
          finishedAt: item.completedAt, 
          operator: item.completedBy,
          takenAt: item.createdAt
        })),
      ].sort((a, b) => {
        // Sort by finishedAt - most recent first (descending order)
        // Handle cases where finishedAt might be null/undefined
        const dateA = a.finishedAt ? new Date(a.finishedAt).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.finishedAt ? new Date(b.finishedAt).getTime() : Number.MAX_SAFE_INTEGER;
        return dateB - dateA;
      })
    : [];

  // Calculate statistics
  const totalAssigned = allPendingTasks.length + allCompletedTasks.length;
  const completed = allCompletedTasks.length;
  const pending = allPendingTasks.length;

  const earningsPerTask = 25;
  const totalEarnings = completed * earningsPerTask;

  return (
    <>
      <Head>
        <title>Vueltas del operador</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Vueltas del operador"} sutitle={""} />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <DesktopDatePicker
                label="Fecha"
                inputFormat="dd/MM/yyyy"
                value={selectedDate}
                onChange={(newValue) => {
                  setSelectedDate(newValue);
                }}
                maxDate={setDateToEnd(new Date())}
                renderInput={(params) => (
                  <TextField {...params} size="small" />
                )}
              />
            </Grid>
            <Grid item>
              <Chip
                label={`VUELTAS ASIGNADAS: ${totalAssigned}`}
                sx={{
                  backgroundColor: "#FFEB3B",
                  color: "black",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item>
              <Chip
                label={`REALIZADAS: ${completed}`}
                sx={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item>
              <Chip
                label={`PENDIENTES: ${pending}`}
                sx={{
                  backgroundColor: "#F44336",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Grid>
            <Grid item>
              <Chip
                label={`GANANCIAS DEL DÍA: ${numeral(totalEarnings).format(
                  "$0,0.00"
                )}`}
                sx={{
                  backgroundColor: "black",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  padding: "20px 10px",
                }}
              />
            </Grid>
            {["ADMIN", "AUX"].includes(userRole) && (
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => setAddExtraTripModalOpen(true)}
                >
                  Vuelta Extra
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </PageTitleWrapper>
      <Container maxWidth="xl">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {generalError ? (
              <Alert severity="error">
                {pendingDeliveriesError?.message ||
                  pendingPickupsError?.message ||
                  pendingChangesError?.message}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <>
                {/* Blocked User Alert */}
                {isBlocked && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="h4" gutterBottom>
                      Usuario Bloqueado
                    </Typography>
                    <Typography>
                      Tu cuenta ha sido bloqueada por exceder el tiempo permitido entre vueltas (más de 35 minutos). 
                      Por favor contacta al administrador para resolver esta situación.
                    </Typography>
                  </Alert>
                )}

                {/* Schedule Timeline */}
                <ScheduleTimeline selectedDate={selectedDate} />
                
                {/* Pending Tasks Section */}
                <Card sx={{ mb: 4 }}>
                  <Box sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                    <Typography variant="h4" fontWeight="bold">
                      VUELTAS POR REALIZAR
                    </Typography>
                  </Box>
                  <TablaVueltasOperador
                    userRole={userRole}
                    tasksList={allPendingTasks}
                    showTimeBetween={false}
                    isBlocked={isBlocked}
                    selectedDate={selectedDate}
                    onRefresh={handleRefresh}
                  />
                </Card>

                {/* Extra Trips Section */}
               
                  <>
                    {/* Pending Extra Trips */}
                    {pendingExtraTripsList?.length > 0 && (
                      <Card sx={{ mt: 4 }}>
                        <Box sx={{ p: 2, backgroundColor: "#fff3e0" }}>
                          <Typography variant="h4" fontWeight="bold">
                            VUELTAS EXTRAS PENDIENTES
                          </Typography>
                        </Box>
                        <TablaVueltasExtras
                          userRole={userRole}
                          extraTripsList={pendingExtraTripsList}
                          showCompleted={false}
                          isBlocked={isBlocked}
                          selectedDate={selectedDate}
                          onRefresh={handleRefresh}
                        />
                      </Card>
                    )}

                {/* Completed Tasks Section */}
                <Card sx={{ mt: 4 }}>
                  <Box sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                    <Typography variant="h4" fontWeight="bold">
                      VUELTAS REALIZADAS
                    </Typography>
                  </Box>
                  <TablaVueltasOperador
                    userRole={userRole}
                    tasksList={allCompletedTasks}
                    showTimeBetween={true}
                    isBlocked={isBlocked}
                    selectedDate={selectedDate}
                    onRefresh={handleRefresh}
                  />
                </Card>

                    {/* Completed Extra Trips */}
                    {completedExtraTripsList?.length > 0 && (
                      <Card sx={{ mt: 4 }}>
                        <Box sx={{ p: 2, backgroundColor: "#e8f5e9" }}>
                          <Typography variant="h4" fontWeight="bold">
                            VUELTAS EXTRAS FINALIZADAS
                          </Typography>
                        </Box>
                        <TablaVueltasExtras
                          userRole={userRole}
                          extraTripsList={completedExtraTripsList}
                          showCompleted={true}
                          isBlocked={isBlocked}
                          selectedDate={selectedDate}
                          onRefresh={handleRefresh}
                        />
                      </Card>
                    )}
                  </>
                

                {/* Warning for blocking */}
                {allCompletedTasks.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Typography variant="caption" color="error">
                      BLOQUEA SISTEMA POR TARDAR MAS DE 30 MINUTOS ENTRE VUELTAS
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
      <Footer />
      
      {/* Add Extra Trip Modal */}
      {addExtraTripModalOpen && (
        <AddExtraTripModal
          open={addExtraTripModalOpen}
          handleOnClose={(success) => {
            setAddExtraTripModalOpen(false);
            if (success) {
              handleRefresh();
            }
          }}
        />
      )}
    </>
  );
}

VueltasOperador.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default VueltasOperador;
