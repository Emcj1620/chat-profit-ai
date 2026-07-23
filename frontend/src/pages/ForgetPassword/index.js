import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  Link
} from "@material-ui/core";
import { LockOutlined } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import { useThemeContext } from "../../context/DarkMode";
import { getBackendUrl } from "../../config";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundPosition: "center center",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },
  cardContainer: {
    padding: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: "16px",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    borderRadius: "8px",
    padding: "10px 0",
    fontWeight: "bold",
  },
}));

const ForgetPassword = () => {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const { appName, appLogoLight, appLogoDark, appBackground, darkMode } = useThemeContext();

  const logoName = (darkMode && appLogoDark) ? appLogoDark : appLogoLight;
  const logoUrl = logoName ? `${getBackendUrl()}public/${logoName}` : null;
  const bgUrl = appBackground ? `${getBackendUrl()}public/${appBackground}` : null;

  const rootStyle = bgUrl
    ? { backgroundImage: `url(${bgUrl})` }
    : { background: darkMode ? "linear-gradient(135deg, #121212 0%, #1e1e2f 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("E-mail de redefinição enviado com sucesso!");
      setRequested(true);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.root} style={rootStyle}>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Paper className={classes.cardContainer} elevation={6}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              style={{ maxHeight: "70px", maxWidth: "260px", width: "auto", margin: "10px auto 20px auto", display: "block" }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <Avatar className={classes.avatar}>
              <LockOutlined />
            </Avatar>
          )}
          <Typography component="h1" variant="h5" style={{ fontWeight: 600, marginBottom: "10px" }}>
            Recuperar Senha
          </Typography>

          {requested ? (
            <Box style={{ textAlign: "center", marginTop: "20px" }}>
              <Typography variant="body1" color="textPrimary" paragraph>
                Enviamos as instruções para o seu e-mail.
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Verifique também a caixa de entrada ou SPAM.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/login"
                style={{ marginTop: "15px", borderRadius: "8px" }}
              >
                Voltar para o Login
              </Button>
            </Box>
          ) : (
            <form className={classes.form} noValidate onSubmit={handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label="Seu E-mail cadastrado"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
              <Grid container justify="flex-end">
                <Grid item>
                  <Link variant="body2" component={RouterLink} to="/login">
                    Voltar para o Login
                  </Link>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default ForgetPassword;
