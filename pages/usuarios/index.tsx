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
import TablaDesbloqueos from "./TablaDesbloqueos";
import {
  useGetUsers,
  useGetRoles,
  useGetUserUnlocks,
  useGetAllWarehousesOverview,
  getFetcher,
} from "../api/useRequest";
import { useSnackbar } from "notistack";

import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import AddTwoTone from "@mui/icons-material/AddTwoTone";
import AddUserModal from "@/components/AddUserModal";

function Usuarios({ session }) {
  const paths = ["Inicio", "Usuarios"];
  const { enqueueSnackbar } = useSnackbar();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";
  const { userList, userError } = useGetUsers(getFetcher);
  // /api/users/roles is ADMIN-only (adding users is an ADMIN-only action),
  // so AUX must not call it — doing so 403s and blocked the whole page.
  const { rolesList, rolesError } = useGetRoles(getFetcher, isAdmin);
  // AUX only unlocks users, it does not see the unlock history log.
  const { unlocksList, unlocksError } = useGetUserUnlocks(getFetcher, isAdmin);
  const { warehousesList, warehousesError } = useGetAllWarehousesOverview(getFetcher);
  const [addModalIsOpen, setAddModalIsOpen] = useState(false);
  const generalError =
    userError || warehousesError || (isAdmin && (rolesError || unlocksError));
  const completeData =
    userList && warehousesList && (!isAdmin || (rolesList && unlocksList));

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
          button={isAdmin && !generalError && completeData ? button : null}
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
                {userError?.message || rolesError?.message || unlocksError?.message}
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
                  userRole={userRole}
                />
              </Card>
            )}
          </Grid>
          {isAdmin && (
            <Grid item xs={12}>
              {generalError ? null : !completeData ? (
                <Skeleton
                  variant="rectangular"
                  width={"100%"}
                  height={500}
                  animation="wave"
                />
              ) : (
                <Card>
                  <TablaDesbloqueos
                    unlocksList={unlocksList}
                  />
                </Card>
              )}
            </Grid>
          )}
        </Grid>
      </Container>
      {isAdmin && addModalIsOpen && completeData ? (
        <AddUserModal
          open={addModalIsOpen}
          handleOnClose={handleClose}
          rolesList={rolesList}
          warehousesList={warehousesList}
          tecList={userList?.filter(
            (u) => u.role?.id === "TEC" && u.isActive
          ) || []}
        />
      ) : null}
      <Footer />
    </>
  );
}

Usuarios.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  // ADMIN manages users fully; AUX only unlocks OPE users from this page.
  if (props?.props?.session && !["ADMIN", "AUX"].includes(props.props.session.user.role)) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return props;
}
export default Usuarios;
