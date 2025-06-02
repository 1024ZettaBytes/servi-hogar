import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Card,
  Container,
  Grid,
  Skeleton,
  TextField,
  Typography
} from '@mui/material';
import { getFetcher, useGetMantainenceById } from '../api/useRequest';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import NextBreadcrumbs from '@/components/Shared/BreadCrums';
import Head from 'next/head';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/components/PageHeader';
import SidebarLayout from '@/layouts/SidebarLayout';
import { validateServerSideSession } from 'lib/auth';
import { getSession } from 'next-auth/react';
import Footer from '@/components/Footer';
import { useRouter } from 'next/router';
import { getStatusLabel } from './TablaMantPendientes';
import AddUsedProductModal from '@/components/AddUsedProductModal';
import SnacksTable from './SnacksTable';
import MantainanceActionModal from '@/components/MantainanceActionModal';

const getSubHeader = (text, fullWidth = false, marginTop = 2) => {
  return (
    <Grid marginTop={marginTop} item lg={fullWidth ? 12 : 2}>
      <Typography variant="h4">{text}</Typography>
    </Grid>
  );
};
export default function ByMantId({ session }) {
  const router = useRouter();
  const { user } = session;
  const isAdmin = user?.role === 'ADMIN';
  //const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const paths = ['Inicio', 'Mantenimientos', 'Detalle'];
  const { mantId } = router.query;
  const [description, setDescription] = useState('');
  const [recordModalIsOpen, setRecordModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [actionModalIsOpen, setActionModalIsOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const { mantData, mantByIdError, isLoadingMant } = useGetMantainenceById(
    getFetcher,
    mantId
  );

  const handleCloseRecordModal = (
    addedRecord = false,
    successMessage = null
  ) => {
    setRecordModalIsOpen(false);
    if (addedRecord && successMessage) {
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

  const isInProgress = mantData?.status === 'PENDIENTE';
  return (
    <>
      <Head>
        <title>Detalle Mantenimiento</title>
      </Head>
      <PageTitleWrapper>
        <PageHeader title={'Detalle Mantenimiento'} sutitle={''} />
        <NextBreadcrumbs paths={paths} lastLoaded={true} />
      </PageTitleWrapper>
      <Container maxWidth="lg">
        <Card sx={{ p: 2 }}>
          {mantByIdError ? (
            <Grid item>
              <Alert severity="error">{mantByIdError.message}</Alert>
            </Grid>
          ) : (
            <>
              <Grid
                container
                direction="row"
                justifyContent="left"
                alignItems="left"
                spacing={1}
              >
                {getSubHeader('# Equipo', true)}
                <Grid item lg={3} xs={12}>
                  {isLoadingMant ? (
                    <Skeleton variant="rounded" height={50} />
                  ) : (
                    <Typography ml={1} color={'primary'} fontWeight="bold">
                      {mantData?.machine?.machineNum}
                    </Typography>
                  )}
                </Grid>
                {getSubHeader('Estado', true)}
                {isLoadingMant ? (
                  <Grid item lg={2} xs={12}>
                    <Skeleton variant="rounded" height={50} />
                  </Grid>
                ) : (
                  <Grid item xs={12}>
                    {getStatusLabel(mantData?.status)}
                  </Grid>
                )}
                {getSubHeader('Refacciones', true, 4)}
                <Grid item container lg={8}>
                  {isLoadingMant ? (
                    <Grid item lg={12}>
                      <Skeleton variant="rounded" height={200} />
                    </Grid>
                  ) : (
                    <>
                      {!mantData?.usedInventory ||
                      mantData.usedInventory.length === 0 ? (
                        <Typography
                          textAlign="center"
                          fontStyle={'italic'}
                          width="100%"
                        >
                          Aún no hay refacciones agregadas
                        </Typography>
                      ) : (
                        <Grid item>
                          <SnacksTable
                            showSearch={false}
                            rows={mantData?.usedInventory}
                          />
                        </Grid>
                      )}
                      {isInProgress && (
                        <Grid item textAlign="end" lg={10}>
                          <Button
                            sx={{ display: 'inline', marginTop: 1 }}
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              setModalType('PRODUCT');
                              setRecordModalIsOpen(true);
                            }}
                          >
                            Agregar
                          </Button>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
                {getSubHeader('Detalle *', true, 6)}
                <Grid item container lg={6}>
                  {isLoadingMant ? (
                    <Grid item lg={12}>
                      <Skeleton variant="rounded" height={200} />
                    </Grid>
                  ) : (
                    <>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        placeholder="Descripción del trabajo realizado"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!isInProgress}
                      />
                    </>
                  )}
                </Grid>
              </Grid>
              {mantData && isInProgress && (
                <>
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    textAlign={'center'}
                    marginTop={10}
                  >
                    {isAdmin &&
                    mantData &&
                    mantData.usedInventory?.length === 0 ? (
                      <Button
                        variant="outlined"
                        size="medium"
                        color="error"
                        onClick={() => {
                          setCurrentAction('CANCEL');
                          setActionModalIsOpen(true);
                        }}
                      >
                        Cancelar Mantenimiento
                      </Button>
                    ) : null}

                    <LoadingButton
                      sx={{ marginLeft: 1 }}
                      disabled={!description || description.trim().length <= 0}
                      type="submit"
                      size="medium"
                      loading={false}
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setCurrentAction('FINISH');
                        setActionModalIsOpen(true);
                      }}
                    >
                      Finalizar
                    </LoadingButton>
                  </Grid>
                </>
              )}
            </>
          )}
        </Card>
      </Container>
      <Footer />
      {recordModalIsOpen && modalType === 'PRODUCT' && (
        <AddUsedProductModal
          handleOnClose={handleCloseRecordModal}
          mantId={mantId}
          open
        />
      )}
      {actionModalIsOpen && currentAction === 'CANCEL' && (
        <MantainanceActionModal
          open
          mantainanceId={mantId}
          requiredInput={false}
          title="Cancelar Mantenimiento"
          inputLabel="Razón de cancelación"
          text={`Se cancelará el servicio del equipo ${mantData.machine.machineNum}.`}
          type="CANCELED"
          onClose={handleCloseRecordModal}
          onSuccess={(addedRecord, message) => {
            handleCloseRecordModal(addedRecord, message);
            setActionModalIsOpen(false);
          }}
        />
      )}

      {actionModalIsOpen && currentAction === 'FINISH' && (
        <MantainanceActionModal
          open
          description={description}
          mantainanceId={mantId}
          requiredInput={false}
          title="Finalizar mantenimiento"
          text={`Se marcará el servicio del equipo ${mantData.machine.machineNum} como completado.`}
          type="COMPLETED"
          onClose={handleCloseRecordModal}
          onSuccess={(addedRecord, message) => {
            handleCloseRecordModal(addedRecord, message);
            setActionModalIsOpen(false);
          }}
        />
      )}
    </>
  );
}
ByMantId.getLayout = (page) => <SidebarLayout>{page}</SidebarLayout>;

export async function getServerSideProps({ req, resolvedUrl }) {
  let props = await validateServerSideSession(getSession, req, resolvedUrl);
  return props;
}
