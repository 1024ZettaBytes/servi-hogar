import Head from 'next/head';
import { getSession } from 'next-auth/react';
import SidebarLayout from '@/layouts/SidebarLayout';
import {validateServerSideSession} from "../lib/auth"
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container } from '@mui/material';
import Footer from '@/components/Footer';
import Banner from './Banner';
//import MovementsSummary from '@/components/MovementsSummary';
//import AccountBalance from '@/content/Dashboards/Crypto/AccountBalance';
//import Wallets from '@/content/Dashboards/Crypto/Wallets';
//import WatchList from '@/content/Dashboards/Crypto/WatchList';

function Home({session}) {
  const {user} = session;
  return (
    <>
      <Head>
        <title>Servi Hogar</title>
      </Head>
      <PageTitleWrapper>
      <PageHeader title={"¡Bienvenido(a) "+user?.name+"!"} sutitle={"Esta es la página de inicio"} showAvatar={true}/>
      </PageTitleWrapper>
      <Container maxWidth="lg">
        {/*<MovementsSummary
        />
        /*<Grid
          container
          direction="row"
          justifyContent="left"
          alignItems="stretch"
          spacing={4}
        >
          <Grid item lg={12} xs={12}>
            <Wallets />
          </Grid>
          <Grid item xs={12} lg={6}>
            <AccountBalance />
          </Grid>
          
          <Grid item xs={12}>
            <WatchList />
          </Grid>
        </Grid>*/}
      </Container>
      <Banner/>
      <Footer />
    </>
  );
}

Home.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;
export async function getServerSideProps({ req, resolvedUrl }) {
  return await validateServerSideSession(getSession, req, resolvedUrl);
}
export default Home;
