import {
  Card,
  Grid,
  Box,
  CardContent,
  Typography,
  Avatar,
  styled
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';

const AvatarWrapperSuccess = styled(Avatar)(
  ({ theme }) => `
      background-color: ${theme.colors.success.lighter};
      color:  ${theme.colors.success.main};
`
);

const AvatarWrapperError = styled(Avatar)(
  ({ theme }) => `
      background-color: ${theme.colors.error.lighter};
      color:  ${theme.colors.error.main};
`
);
const AvatarWrapperWarning = styled(Avatar)(
  ({ theme }) => `
      background-color: ${theme.colors.warning.lighter};
      color:  ${theme.colors.warning.main};
`
);
function Wallets() {
  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          pb: 3
        }}
      >
        <Typography variant="h3">Rentas</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={4} item>
          <Card
            sx={{
              px: 1
            }}
          >
            <CardContent>
            <AvatarWrapperSuccess>
              <LocalShippingIcon />
            </AvatarWrapperSuccess>
              
              <Box
                sx={{
                  pt: 3
                }}
              >
                <Typography variant="h3" gutterBottom noWrap>
                  3
                </Typography>
                <Typography variant="subtitle2" noWrap>
                  Pendientes de entrega
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <Card
            sx={{
              px: 1
            }}
          >
            <CardContent>
              <AvatarWrapperWarning>
                <ScheduleIcon />
              </AvatarWrapperWarning>
              <Box
                sx={{
                  pt: 3
                }}
              >
                <Typography variant="h3" gutterBottom noWrap>
                  0
                </Typography>
                <Typography variant="subtitle2" noWrap>
                  Por vencer
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <Card
            sx={{
              px: 1
            }}
          >
            <CardContent>
              <AvatarWrapperError>
                <NotificationImportantIcon />
              </AvatarWrapperError>
              <Box
                sx={{
                  pt: 3
                }}
              >
                <Typography variant="h3" gutterBottom noWrap>
                  2
                </Typography>
                <Typography variant="subtitle2" noWrap>
                  Por recoger
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default Wallets;
