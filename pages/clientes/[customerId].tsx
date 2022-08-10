import { useState, ChangeEvent } from 'react';
import Head from 'next/head';
import { getSession } from "next-auth/react";
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Tabs, Tab, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import { styled } from '@mui/material/styles';
import EditProfileTab from '@/content/Management/Users/settings/EditProfileTab';
import SecurityTab from '@/content/Management/Users/settings/SecurityTab';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from 'lib/auth';
import { useRouter } from 'next/router';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import PageHeader from '@/components/PageHeader';
import { getFetcher, useGetCustomerById } from 'pages/api/useRequest';
import CustomerInfoTab from '@/content/customers/InfoTab';

const TabsWrapper = styled(Tabs)(
  () => `
    .MuiTabs-scrollableX {
      overflow-x: auto !important;
    }
`
);

function CustomerDetail() {
  const router = useRouter()
  const { customerId } = router.query;
  const { customer, customerByIdError } = useGetCustomerById(getFetcher, customerId);
  const [currentTab, setCurrentTab] = useState<string>('info');
  const paths = ["Inicio", "Clientes", customer?.name];
  
  

  const tabs = [
    { value: 'info', label: 'Información general' },
    { value: 'history', label: 'Historial' },
    { value: 'security', label: 'Passwords/Security' }
  ];

  const handleTabsChange = (_event: ChangeEvent<{}>, value: string): void => {
    setCurrentTab(value);
  };

  return (
    <>
      <Head>
        <title>Detalle Cliente</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={"Detalle Cliente"} sutitle={""}/>
        <NextBreadcrumbs paths={paths} lastLoaded={!customerByIdError && customer}/>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
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
            {currentTab === 'info' && <CustomerInfoTab customer={customer}/>}
            {currentTab === 'history' && <EditProfileTab />}
            {currentTab === 'security' && <SecurityTab />}
          </Grid>
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
