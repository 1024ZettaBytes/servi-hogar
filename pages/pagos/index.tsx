import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { useState } from 'react';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from '../../lib/auth';
import PageHeader from '@/components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import { Container, Grid } from '@mui/material';
import Footer from '@/components/Footer';
import TablaPagos from './TablaPagos';
import { useSnackbar } from 'notistack';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import AddPaymentModal from '@/components/AddPaymentModal';
import AddTwoTone from '@mui/icons-material/AddTwoTone';

function Pagos({}) {
  const paths = ['Inicio', 'Pagos'];
  const { enqueueSnackbar } = useSnackbar();



  const [addModalIsOpen, setAddModalIsOpen] = useState(false);


  const handleClickOpen = () => {
    setAddModalIsOpen(true);
  };

  const handleClose = (addedPayment, successMessage = null) => {
    setAddModalIsOpen(false);
    if (addedPayment && successMessage) {
      enqueueSnackbar(successMessage, {
        variant: 'success',
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center'
        },
        autoHideDuration: 1500
      });
    }
  };
  const button = {
    text: 'Nuevo pago',
    onClick: handleClickOpen,
    startIcon: <AddTwoTone />,
    variant: 'contained'
  };
  return (
    <>
      <Head>
        <title>Pagos</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Lista de pagos'} sutitle={''} button={button} />
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
          <TablaPagos />
        </Grid>
      </Container>
      {addModalIsOpen ? (
        <AddPaymentModal open={addModalIsOpen} handleOnClose={handleClose} />
      ) : null}
      <Footer />
    </>
  );
}

Pagos.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
export default Pagos;
