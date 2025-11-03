import Head from "next/head";
import classes from "./index.module.css";
import {
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { signIn } from "next-auth/react";
import router from "next/router";
import React, { useState } from "react";
import { LoadingButton } from "@mui/lab";

function LoginForm() {
  const [hasError, setHasError] = useState({ error: false, msg: "" });
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = React.useRef(true);
  let userInputRef = React.useRef<HTMLInputElement>(null);
  let passwordInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function submitHandler(event) {
    event.preventDefault();
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setHasError({ error: false, msg: "" });

    const enteredUser = userInputRef?.current?.value;
    const enteredPassword = passwordInputRef?.current?.value;

    // optional: Add validation
    const result = await signIn("credentials", {
      redirect: false,
      user: enteredUser,
      password: enteredPassword,
    });

    if (!isMountedRef.current) return;

    if (!result.error) {
      // set some auth state
      const url = (router.query?.returnUrl || "/").toString();
      // Use window.location to avoid race condition with auth page redirect
      window.location.href = url;
    } else {
      setIsLoading(false);
      setHasError({ error: true, msg: result.error });
    }
  }
  return (
    <>
      <Head>
        <title>Iniciar sesión</title>
      </Head>
      <Container sx={{marginTop:"100px"}}>
        <Grid container >
          <Grid item xs={2} lg={4}></Grid>
          <Grid item xs={8} lg={4} className={classes.logoContainer}>
            <img
              className={classes.loginLogo}
              src="/static/images/servi_hogar.png"
              alt="Servi Hogar Logo"
            />
          </Grid>
          <Grid item xs={2} lg={4}></Grid>
        </Grid>
      </Container>
      <Container sx={{marginTop:"10px"}}>
        <Grid container direction={"row"}>
          <Grid item xs={2} lg={4}></Grid>
          <Grid item xs={12} lg={4} justifyContent="center" alignItems="center">
            <Card>
              <CardHeader title="" />
              <Divider />
              <CardContent>
                <Box
                  component="form"
                  sx={{
                    "& .MuiTextField-root": {
                      marginTop: "15px",
                      width: "100%",
                    },
                  }}
                  onSubmit={submitHandler}
                >
                  {hasError.error && (
                    <Typography
                      variant="h5"
                      component="h5"
                      color="error"
                      textAlign="center"
                    >
                      {hasError.msg}
                    </Typography>
                  )}
                  <div>
                    <TextField
                      required
                      id="outlined-required"
                      label="Usuario"
                      inputRef={userInputRef}
                    />
                  </div>
                  <div>
                    <TextField
                      required
                      id="outlined-search"
                      label="Contraseña"
                      type="password"
                      inputRef={passwordInputRef}
                    />
                  </div>
                  <Grid container className={classes.buttonContainer}>
                    <Grid item xs={12}>
                      <LoadingButton
                        type="submit"
                        loading={isLoading}
                        fullWidth
                        variant="contained"
                      >
                        INICIAR SESION
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={2} lg={4}></Grid>
        </Grid>
      </Container>
    </>
  );
}

export default LoginForm;
