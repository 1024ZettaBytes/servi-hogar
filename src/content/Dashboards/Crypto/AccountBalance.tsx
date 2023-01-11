import {
  Button,
  Card,
  Box,
  Grid,
  Typography,
  styled,
  Avatar,
} from '@mui/material';
import TrendingUp from '@mui/icons-material/TrendingUp';
const AvatarSuccess = styled(Avatar)(
  ({ theme }) => `
      background-color: ${theme.colors.success.main};
      color: ${theme.palette.success.contrastText};
      width: ${theme.spacing(8)};
      height: ${theme.spacing(8)};
      box-shadow: ${theme.colors.shadows.success};
`
);


function AccountBalance() {


  return (
    <Card>
      <Grid spacing={0} container>
        <Grid item xs={12} md={12}>
          <Box p={4}>
            <Typography
              sx={{
                pb: 3
              }}
              variant="h4"
            >
              Ingresos
            </Typography>
            <Box>
              <Typography variant="h1" gutterBottom>
                $30,584.00
              </Typography> 
              <Box
                display="flex"
                sx={{
                  py: 4
                }}
                alignItems="center"
              >
                <AvatarSuccess
                  sx={{
                    mr: 2
                  }}
                  variant="rounded"
                >
                  <TrendingUp fontSize="large" />
                </AvatarSuccess>
                <Box>
                  <Typography variant="h4">+ $3,594.00</Typography>
                  <Typography variant="subtitle2" noWrap>
                    este mes
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid sm item>
                <Button fullWidth variant="contained">
                  Ver detalle
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        
      </Grid>
    </Card>
  );
}

export default AccountBalance;
