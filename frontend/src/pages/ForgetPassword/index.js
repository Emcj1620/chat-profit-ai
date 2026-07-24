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
    borderRadius: "20px",
    background: "rgba(10, 14, 26, 0.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 40px 0 rgba(0,0,0,0.55)",
    width: "100%",
    color: "#fff",
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
    background: "linear-gradient(90deg, #28C76F 0%, #0084FF 100%)",
    color: "#fff",
  },
  inputRoot: {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
      "&.Mui-focused fieldset": { borderColor: "#28C76F" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
    "& .MuiInputBase-input": { color: "#fff" },
  },
}));

const ForgetPassword = () => {
  const classes = useStyles();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const { appName, appLogoLight, appLogoDark, appBackground, darkMode } = useThemeContext();

  // Fallback permanente: usa arquivo raiz se banco não tiver configuração
  const logoName = (darkMode && appLogoDark) ? appLogoDark : (appLogoLight || "chat_profit_logo.png");
  const logoUrl = `${getBackendUrl()}public/${logoName}`;
  const bgFileName = appBackground || "chat_profit_bg.png";
  const bgUrl = `${getBackendUrl()}public/${bgFileName}`;

  const rootStyle = {
    backgroundImage: `url(${bgUrl}), url(/bg_auth.png)`
  };

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
        <div className={classes.cardContainer}>
          <img
            src={logoUrl}
            alt={appName}
            style={{ maxHeight: "80px", maxWidth: "280px", width: "auto", margin: "0 auto 20px auto", display: "block", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
            onError={(e) => { e.target.src = "/logo.png"; }}
          />
          <Typography component="h1" variant="h5" style={{ fontWeight: 700, marginBottom: "10px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
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
              className={classes.inputRoot}
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
        </div>
      </Container>
    </div>
  );
};

export default ForgetPassword;
