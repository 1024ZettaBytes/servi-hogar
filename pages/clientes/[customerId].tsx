import { useState, ChangeEvent } from "react";
import Head from "next/head";
import { getSession } from "next-auth/react";
import PageTitleWrapper from "@/components/PageTitleWrapper";
import { Container, Tabs, Tab, Grid, Alert } from "@mui/material";
import Footer from "@/components/Footer";
import { styled } from "@mui/material/styles";
import SidebarLayout from "@/layouts/SidebarLayout";
import { validateServerSideSession } from "lib/auth";
import { useRouter } from "next/router";
import NextBreadcrumbs from "@/components/Shared/BreadCrums";
import PageHeader from "@/components/PageHeader";
import {
  getFetcher,
  useGetAllCustomers,
  useGetCustomerById,
  useGetCustomerLevels,
  useGetCities,
} from "pages/api/useRequest";
import CustomerInfoTab from "@/content/customers/InfoTab";
import HistoryTab from "@/content/customers/HistoryTab";

const TabsWrapper = styled(Tabs)(
  () => `
    .MuiTabs-scrollableX {
      overflow-x: auto !important;
    }
`
);

function CustomerDetail({ session }) {
  const userRole = session.user.role;
  const router = useRouter();
  const { customerId } = router.query;
  const { customer, customerByIdError } = useGetCustomerById(
    getFetcher,
    customerId
  );
  const { customerList } = useGetAllCustomers(getFetcher);
  const { customerLevelList } = useGetCustomerLevels(getFetcher);
  const { citiesList } = useGetCities(getFetcher);
  const [currentTab, setCurrentTab] = useState<string>("info");
  const paths = ["Inicio", "Clientes", customer?.name];

  const tabs = [
    { value: "info", label: "Información general" },
    { value: "history", label: "Historial" },
    /* { value: "security", label: "Passwords/Security" },*/
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };
  const isLoadingCustomer = !customerByIdError && !customer;
  const foundCustomer = !isLoadingCustomer && customer?._id;
  return (
    <>
      <Head>
        <title>Detalle Cliente</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Detalle Cliente"} sutitle={""} />
        <NextBreadcrumbs
          paths={paths}
          lastLoaded={!customerByIdError && customer}
        />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          {isLoadingCustomer || foundCustomer ? (
            <>
              <Grid item xs={12}>
                <TabsWrapper
                  onChange={handleTabsChange}
                  value={currentTab}
                  variant="scrollable"
                  scrollButtons="auto"
                  textColor="primary"
                  indicatorColor="primary"
                >
                  {tabs.map((tab) => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} />
                  ))}
                </TabsWrapper>
              </Grid>
              <Grid item xs={12}>
                {currentTab === "info" && (
                  <CustomerInfoTab
                    role={userRole}
                    customer={customer}
                    customerList={customerList}
                    customerLevelList={customerLevelList}
                    citiesList={citiesList}
                  />
                )}
                {currentTab === "history" && <HistoryTab movementsList={customer?.movements} />}
                {
                  //currentTab === "security" && <SecurityTab />
                }
              </Grid>
            </>
          ) : (
            <Grid item>
              <Alert severity="error">
                No se encontró el cliente, por favor verifique e intente de
                nuevo.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Container>
      <Footer />
    </>
  );
}

CustomerDetail.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default CustomerDetail;
