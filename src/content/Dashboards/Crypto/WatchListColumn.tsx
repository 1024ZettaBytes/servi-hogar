import {
  Card,
  Box,
  Typography,
  Avatar,
  Grid,
  styled
} from '@mui/material';

import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';

const AvatarWrapper = styled(Avatar)(
  ({ theme }) => `
    margin: ${theme.spacing(0, 0, 1, -0.5)};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: ${theme.spacing(1)};
    padding: ${theme.spacing(0.5)};
    border-radius: 60px;
    height: ${theme.spacing(5.5)};
    width: ${theme.spacing(5.5)};
    background: ${
      theme.colors.primary
    };
  
    img {
      background: ${theme.colors.alpha.trueWhite[100]};
      padding: ${theme.spacing(0.5)};
      display: block;
      border-radius: inherit;
      height: ${theme.spacing(4.5)};
      width: ${theme.spacing(4.5)};
    }
`
);

function WatchListColumn() {

  return (
    <Grid
      container
      direction="row"
      justifyContent="center"
      alignItems="stretch"
      spacing={3}
    >
      <Grid item md={4} xs={12}>
        <Card
          sx={{
            overflow: 'visible'
          }}
        >
          <Box
            sx={{
              p: 3
            }}
          >
            <Box display="flex" alignItems="center">
              <AvatarWrapper>
                <LocalLaundryServiceIcon />
              </AvatarWrapper>
              <Box>
                <Typography variant="h4" noWrap>
                Whirpool
                </Typography>
                <Typography variant="subtitle1" noWrap>
                20 KG
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'block',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pt: 3
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  pl: 1
                }}
              >
                # Rentas
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  pr: 1,
                  mb: 1
                }}
              >
                10
              </Typography>
              
            </Box>
          </Box>
          
        </Card>
      </Grid>
      <Grid item md={4} xs={12}>
        <Card
          sx={{
            overflow: 'visible'
          }}
        >
          <Box
            sx={{
              p: 3
            }}
          >
            <Box display="flex" alignItems="center">
              <AvatarWrapper>
              <LocalLaundryServiceIcon />
              </AvatarWrapper>
              <Box>
                <Typography variant="h4" noWrap>
                Hoover
                </Typography>
                <Typography variant="subtitle1" noWrap>
                19 KG
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'block',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pt: 3
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  pl: 1
                }}
              >
                # Rentas
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  pr: 1,
                  mb: 1
                }}
              >
                8
              </Typography>
              
            </Box>
          </Box>
          
        </Card>
      </Grid>
      <Grid item md={4} xs={12}>
        <Card
          sx={{
            overflow: 'visible'
          }}
        >
          <Box
            sx={{
              p: 3
            }}
          >
            <Box display="flex" alignItems="center">
              <AvatarWrapper>
              <LocalLaundryServiceIcon />
              </AvatarWrapper>
              <Box>
                <Typography variant="h4" noWrap>
                Mabe
                </Typography>
                <Typography variant="subtitle1" noWrap>
                M5
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'block',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pt: 3
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  pl: 1
                }}
              >
                # Rentas
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  pr: 1,
                  mb: 1
                }}
              >
                5
              </Typography>
              
            </Box>
          </Box>
          
        </Card>
      </Grid>
    </Grid>
  );
}

export default WatchListColumn;
