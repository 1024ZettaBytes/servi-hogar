import {
  Grid,
  Typography,
  CardContent,
  Card,
  Box,
  Divider,
  Button,
} from "@mui/material";
import { Skeleton } from "@mui/material";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import DoneTwoToneIcon from "@mui/icons-material/DoneTwoTone";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DangerousIcon from '@mui/icons-material/Dangerous';
import Text from "@/components/Text";
import Label from "@/components/Label";
const getHowFoundLabel = (howFoundId: string, referrer?: string) => {
  const map = {
    facebook: "Facebook",
    referred: `Referido por ${referrer}`,
    recomended: "Recomendado"
  };
  return map[howFoundId];
};
const getLevelLabel = (customerLevelId: string, customerLevelName: string) => {
  const map = {
    nuevo: (
      <Label color="secondary">
        <AddIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    regular: (
      <Label color="info">
        <ThumbUpIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    permanente: (
      <Label color="success">
        <CheckCircleIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    deudor: (
      <Label color="warning">
        <RequestQuoteIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
    conflictivo: (
      <Label color="error">
        <DangerousIcon fontSize="small" />
        <b>{customerLevelName}</b>
      </Label>
    ),
  };
  return map[customerLevelId];
};
function CustomerInfoTab({ customer }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Datos personales
              </Typography>
            </Box>
            <Button variant="text" startIcon={<EditTwoToneIcon />}>
              Modificar
            </Button>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid container spacing={0}>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    CURP:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  {customer ? (
                    <Text color="black">
                      <b>{customer?.curp}</b>
                    </Text>
                  ) : (
                    <Skeleton
                      variant="text"
                      sx={{ fontSize: "1rem", width: "100px" }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Nombre:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  {customer ? (
                    <Text color="black">{customer?.name}</Text>
                  ) : (
                    <Skeleton
                      variant="text"
                      sx={{ fontSize: "1rem", width: "100px" }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Celular:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Box sx={{ maxWidth: { xs: "auto", sm: 300 } }}>
                    {customer ? (
                      <Text color="black">{customer?.cell}</Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Nivel:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                {customer ? (
                      getLevelLabel(customer?.level?.id, customer?.level?.name)
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Fuente:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                {customer ? (
                      <Text color="black">{getHowFoundLabel(customer?.howFound, customer?.referredBy?.name)}</Text>
                    ) : (
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: "1rem", width: "100px" }}
                      />
                    )}
                </Grid>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
              Domicilio
              </Typography>
              <Typography variant="subtitle2">
                Manage details related to your account
              </Typography>
            </Box>
            <Button variant="text" startIcon={<EditTwoToneIcon />}>
              Edit
            </Button>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid container spacing={0}>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Language:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Text color="black">
                    <b>English (US)</b>
                  </Text>
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Timezone:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Text color="black">
                    <b>GMT +2</b>
                  </Text>
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Account status:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Label color="success">
                    <DoneTwoToneIcon fontSize="small" />
                    <b>Active</b>
                  </Label>
                </Grid>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <Box
            p={3}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h4" gutterBottom>
                Email Addresses
              </Typography>
              <Typography variant="subtitle2">
                Manage details related to your associated email addresses
              </Typography>
            </Box>
            <Button variant="text" startIcon={<EditTwoToneIcon />}>
              Edit
            </Button>
          </Box>
          <Divider />
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle2">
              <Grid container spacing={0}>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Email ID:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Text color="black">
                    <b>example@demo.com</b>
                  </Text>
                  <Box pl={1} component="span">
                    <Label color="success">Primary</Label>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4} md={3} textAlign={{ sm: "right" }}>
                  <Box pr={3} pb={2}>
                    Email ID:
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Text color="black">
                    <b>demo@example.com</b>
                  </Text>
                </Grid>
              </Grid>
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default CustomerInfoTab;
