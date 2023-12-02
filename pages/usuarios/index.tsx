import Head from "next/head";
import { getSession } from "next-auth/react";
import { useState } from "react";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "../../lib/auth";
import PageHeader from "@/components/PageHeader";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Card, Container, Grid, Skeleton, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import TablaUsuarios from "./TablaUsuarios";
import {
  useGetUsers,
  useGetRoles,
  getFetcher,
} from "../api/useRequest";
import { useSnackbar } from "notistack";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import AddUserModal from "@/components/AddUserModal";

function Usuarios({}) {
  const paths = ["Inicio", "Usuarios"];
  const { enqueueSnackbar } = useSnackbar();
  const { userList, userError } = useGetUsers(getFetcher);
  const { rolesList, rolesError } = useGetRoles(getFetcher);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const generalError = userError || rolesError;
  const completeData = userList && rolesList;

  const handleClickOpen = () => {
    setAddModalIsOpen(true);
  };

  const handleClose = (addedUser, successMessage = null) => {
    setAddModalIsOpen(false);
    if (addedUser && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: "success",
        anchorOrigin: {
          vertical: "top",
          horizontal: "center",
        },
        autoHideDuration: 1500,
      });
    }
  };
  const button = { text: "Agregar usuario", onClick: handleClickOpen, startIcon: <AddTwoTone/>, variant:"contained" };
  return (
    <>
      <Head>
        <title>Usuarios</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader
          title={"Usuarios"}
          sutitle={""}
          button={!generalError && completeData ? button : null}
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
            {generalError ? (
              <Alert severity="error">
                {userError?.message || rolesError?.message}
              </Alert>
            ) : !completeData ? (
              <Skeleton
                variant="rectangular"
                width={"100%"}
                height={500}
                animation="wave"
              />
            ) : (
              <Card>
                <TablaUsuarios
                  userList={userList}
                />
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {addModalIsOpen && completeData ? (
        <AddUserModal
          open={addModalIsOpen}
          handleOnClose={handleClose}
          rolesList={rolesList}
        />
      ) : null}
      <Footer />
    </>
  );
}

Usuarios.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Usuarios;
