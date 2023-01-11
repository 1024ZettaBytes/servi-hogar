import {
  Box,
  Typography,
  Container,
  Button,
  styled
} from '@mui/material';
import Head from 'next/head';
import type { ReactElement } from 'react';
import BaseLayout from 'src/layouts/BaseLayout';

const MainContent = styled(Box)(
  () => `
    height: 100%;
    display: flex;
    flex: 1;
    flex-direction: column;
`
);

const TopWrapper = styled(Box)(
  ({ theme }) => `
  display: flex;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing(6)};
`
);



function Status404() {
  return (
    <>
      <Head>
        <title>No se encontró - 404</title>
      </Head>
      <MainContent>
        <TopWrapper>
          <Container maxWidth="md">
            <Box textAlign="center">
              <img alt="404" height={180} src="/static/images/status/404.png" />
              <Typography variant="h2" sx={{ my: 2 }}>
                La pagina que estás buscando no existe :/
              </Typography>
              <Typography
                variant="h4"
                color="text.secondary"
                fontWeight="normal"
                sx={{ mb: 4 }}
              >
               Si fuiste redirigido por el propio sistema por favor contacta al administrador, en caso contrario verifica la URL 🧐
              </Typography>
            </Box>
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 3, p: 4 }}>

                <Button href="/" variant="outlined">
                  Ir a la página de Inicio
                </Button>
             
            </Container>
          </Container>
        </TopWrapper>
      </MainContent>
    </>
  );
}

export default Status404;

Status404.getLayout = function getLayout(page: ReactElement) {
  return <BaseLayout>{page}</BaseLayout>;
};
