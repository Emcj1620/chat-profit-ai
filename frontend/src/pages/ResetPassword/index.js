import React, { useState } from "react";
import { Link as RouterLink, useLocation, useHistory } from "react-router-dom";

import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Grid,
  Typography,
  Container,
  Paper,
  InputAdornment,
  IconButton,
  Link
} from "@material-ui/core";
import { LockOutlined, Visibility, VisibilityOff } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { toast } from "react-toastify";

import { useThemeContext } from "../../context/DarkMode";
import { getBackendUrl } from "../../config";
import api from "../../services/api";
import toastError from "../../errors/toastError";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

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

const ResetPassword = () => {
  const classes = useStyles();
  const query = useQuery();
  const history = useHistory();
  const token = query.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Senha redefinida com sucesso! Você já pode entrar.");
      history.push("/login");
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
          <img
            src={logoUrl}
            alt={appName}
            style={{ maxHeight: "70px", maxWidth: "260px", width: "auto", margin: "10px auto 20px auto", display: "block" }}
            onError={(e) => { e.target.src = "/logo.png"; }}
          />
          <Typography component="h1" variant="h5" style={{ fontWeight: 600, marginBottom: "10px" }}>
            Cadastrar Nova Senha
          </Typography>
          <form className={classes.form} noValidate onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nova Senha"
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((e) => !e)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirme a Nova Senha"
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading}
            >
              {loading ? "Redefinindo..." : "Salvar Nova Senha"}
            </Button>
            <Grid container justify="flex-end">
              <Grid item>
                <Link variant="body2" component={RouterLink} to="/login">
                  Voltar para o Login
                </Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default ResetPassword;
