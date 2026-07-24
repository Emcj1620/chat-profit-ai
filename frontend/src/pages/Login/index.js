import React, { useState, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  Button,
  CssBaseline,
  TextField,
  Grid,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Link,
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useThemeContext } from "../../context/DarkMode";
import { getBackendUrl } from "../../config";

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
  // Card escuro com glassmorphism — logo fica visível sobre o fundo escuro
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
    "&:hover": {
      background: "linear-gradient(90deg, #A8FF33 0%, #0084FF 100%)",
    }
  },
  // Inputs com bordas claras para contraste no fundo escuro
  inputRoot: {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
      "&.Mui-focused fieldset": { borderColor: "#28C76F" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
    "& .MuiInputBase-input": { color: "#fff" },
    "& .MuiIconButton-root": { color: "rgba(255,255,255,0.6)" },
  },
  linkText: {
    color: "#A8FF33",
    "&:hover": { color: "#28C76F" },
  },
  appTitle: {
    color: "#fff",
    fontWeight: 700,
    marginBottom: "10px",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  },
}));

const Login = () => {
  const classes = useStyles();

  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const { handleLogin } = useContext(AuthContext);
  const { appName, appLogoLight, appLogoDark, appBackground, darkMode } = useThemeContext();

  const handleChangeInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlSubmit = (e) => {
    e.preventDefault();
    handleLogin(user);
  };

  const logoName = (darkMode && appLogoDark) ? appLogoDark : (appLogoLight || "chat_profit_logo.png");
  const logoUrl = `${getBackendUrl()}public/${logoName}`;
  const bgFileName = appBackground || "chat_profit_bg.png";
  const bgUrl = `${getBackendUrl()}public/${bgFileName}`;

  const rootStyle = {
    backgroundImage: `url(${bgUrl}), url(/bg_auth.png)`
  };

  return (
    <div className={classes.root} style={rootStyle}>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <div className={classes.cardContainer}>
          {/* Logo sobre fundo escuro — visibilidade perfeita */}
          <img
            src={logoUrl}
            alt={appName}
            style={{
              maxHeight: "80px",
              maxWidth: "280px",
              width: "auto",
              margin: "0 auto 20px auto",
              display: "block",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))"
            }}
            onError={(e) => { e.target.src = "/logo.png"; }}
          />
          <Typography component="h1" variant="h5" className={classes.appTitle}>
            {appName}
          </Typography>
          <form className={classes.form} noValidate onSubmit={handlSubmit}>
            <TextField
              className={classes.inputRoot}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label={i18n.t("login.form.email")}
              name="email"
              value={user.email}
              onChange={handleChangeInput}
              autoComplete="email"
              autoFocus
            />
            <TextField
              className={classes.inputRoot}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label={i18n.t("login.form.password")}
              id="password"
              value={user.password}
              onChange={handleChangeInput}
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
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
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className={classes.submit}
            >
              {i18n.t("login.buttons.submit")}
            </Button>
            <Grid container justify="space-between" style={{ marginTop: "10px" }}>
              <Grid item>
                <Link
                  href="#"
                  variant="body2"
                  component={RouterLink}
                  to="/forget-password"
                  className={classes.linkText}
                >
                  Esqueci minha senha
                </Link>
              </Grid>
              <Grid item>
                <Link
                  href="#"
                  variant="body2"
                  component={RouterLink}
                  to="/signup"
                  className={classes.linkText}
                >
                  {i18n.t("login.buttons.register")}
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default Login;
