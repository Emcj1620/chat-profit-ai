import React, { useState, useContext } from "react";
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
  InputAdornment,
  IconButton,
  Link
} from '@material-ui/core';

import { LockOutlined, Visibility, VisibilityOff } from '@material-ui/icons';

import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useThemeContext } from "../../context/DarkMode";
import { getBackendUrl } from "../../config";

// const Copyright = () => {
// 	return (
// 		<Typography variant="body2" color="textSecondary" align="center">
// 			{"Copyleft "}
// 			<Link color="inherit" href="https://github.com/canove">
// 				Canove
// 			</Link>{" "}
// 			{new Date().getFullYear()}
// 			{"."}
// 		</Typography>
// 	);
// };

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
    fontWeight: "bold"
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

  const logoName = (darkMode && appLogoDark) ? appLogoDark : appLogoLight;
  const logoUrl = logoName ? `${getBackendUrl()}public/${logoName}` : null;
  const bgUrl = appBackground ? `${getBackendUrl()}public/${appBackground}` : null;

  const rootStyle = bgUrl
    ? { backgroundImage: `url(${bgUrl})` }
    : { background: darkMode ? "linear-gradient(135deg, #121212 0%, #1e1e2f 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };

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
            {appName}
          </Typography>
          <form className={classes.form} noValidate onSubmit={handlSubmit}>
            <TextField
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
              color="primary"
              className={classes.submit}
            >
              {i18n.t("login.buttons.submit")}
            </Button>
            <Grid container>
              <Grid item>
                <Link
                  href="#"
                  variant="body2"
                  component={RouterLink}
                  to="/signup"
                >
                  {i18n.t("login.buttons.register")}
                </Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default Login;
