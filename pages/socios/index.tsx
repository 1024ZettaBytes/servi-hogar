import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import AssignPartnerMachineModal from "@/components/AssignPartnerMachineModal";
import TablaSocios from "./TablaSocios";
import { useGetPartners, useGetPayouts, getFetcher } from "../api/useRequest";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import TablaPagosSocios from "./TablaPagosSocios";

function Socios({}) {
  const paths = ["Inicio", "Socios"];
  const { partnersList, partnersError } = useGetPartners(getFetcher, true);
  const { payoutsList, payoutsError } = useGetPayouts(getFetcher);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");

  return (
    <>
      <Head>
        <title>Socios</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Socios"}
          sutitle={""}
          button={{
            text: "Nuevo",
            variant: "contained",
            onClick: () => setIsAssignModalOpen(true)
          }}
        />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item xs={12}>
            {assignmentMessage ? (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                onClose={() => setAssignmentMessage("")}
              >
                {assignmentMessage}
              </Alert>
            ) : null}
            {partnersError ? (
              <Alert severity="error">{partnersError?.message}</Alert>
            ) : !partnersList ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaSocios partnersList={partnersList} />
              </Card>
            )}
          </Grid>
          <Grid item xs={12}>
            {payoutsError ? (
              <Alert severity="error">{payoutsError?.message}</Alert>
            ) : !payoutsList ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaPagosSocios payoutsList={payoutsList} />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      <AssignPartnerMachineModal
        open={isAssignModalOpen}
        partnersList={partnersList || []}
        handleOnClose={(success, message) => {
          setIsAssignModalOpen(false);
          if (success && message) {
            setAssignmentMessage(message);
          }
        }}
      />
      <Footer />
    </>
  );
}

Socios.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Socios;
