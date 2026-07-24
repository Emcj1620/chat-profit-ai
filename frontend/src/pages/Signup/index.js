import React, { useState } from "react";

import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";

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
	Link,
	Paper
} from '@material-ui/core';

import { LockOutlined, Visibility, VisibilityOff } from '@material-ui/icons';

import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { useThemeContext } from "../../context/DarkMode";
import { getBackendUrl } from "../../config";

const useStyles = makeStyles(theme => ({
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
	form: {
		width: "100%",
		marginTop: theme.spacing(2),
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
		"& .MuiIconButton-root": { color: "rgba(255,255,255,0.6)" },
	},
}));

const UserSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
	password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email").required("Required"),
});

const SignUp = () => {
	const classes = useStyles();
	const history = useHistory();

	const initialState = { name: "", email: "", password: "" };
	const [showPassword, setShowPassword] = useState(false);
	const [user] = useState(initialState);

	const { appName, appLogoLight, appLogoDark, appBackground, darkMode } = useThemeContext();

	const handleSignUp = async values => {
		try {
			await api.post("/auth/signup", values);
			toast.success(i18n.t("signup.toasts.success"));
			history.push("/login");
		} catch (err) {
			toastError(err);
		}
	};

	// Fallback permanente: usa o arquivo na raiz se o banco não tiver configuração
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
					<img
						src={logoUrl}
						alt={appName}
						style={{ maxHeight: "80px", maxWidth: "280px", width: "auto", margin: "0 auto 20px auto", display: "block", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
						onError={(e) => { e.target.src = "/logo.png"; }}
					/>
					<Typography component="h1" variant="h5" style={{ fontWeight: 700, marginBottom: "10px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
						{i18n.t("signup.title")}
					</Typography>
					<Formik
						initialValues={user}
						enableReinitialize={true}
						validationSchema={UserSchema}
						onSubmit={(values, actions) => {
							setTimeout(() => {
								handleSignUp(values);
								actions.setSubmitting(false);
							}, 400);
						}}
					>
						{({ touched, errors, isSubmitting }) => (
							<Form className={classes.form}>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<Field
											className={classes.inputRoot}
											as={TextField}
											autoComplete="name"
											name="name"
											error={touched.name && Boolean(errors.name)}
											helperText={touched.name && errors.name}
											variant="outlined"
											fullWidth
											id="name"
											label={i18n.t("signup.form.name")}
											autoFocus
										/>
									</Grid>

									<Grid item xs={12}>
										<Field
											as={TextField}
											variant="outlined"
											fullWidth
											id="email"
											label={i18n.t("signup.form.email")}
											name="email"
											error={touched.email && Boolean(errors.email)}
											helperText={touched.email && errors.email}
											autoComplete="email"
										/>
									</Grid>
									<Grid item xs={12}>
										<Field
											as={TextField}
											variant="outlined"
											fullWidth
											name="password"
											id="password"
											autoComplete="current-password"
											error={touched.password && Boolean(errors.password)}
											helperText={touched.password && errors.password}
											label={i18n.t("signup.form.password")}
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
									</Grid>
								</Grid>
								<Button
									type="submit"
									fullWidth
									variant="contained"
									color="primary"
									className={classes.submit}
								>
									{i18n.t("signup.buttons.submit")}
								</Button>
								<Grid container justifyContent="flex-end">
									<Grid item>
										<Link
											href="#"
											variant="body2"
											component={RouterLink}
											to="/login"
										>
											{i18n.t("signup.buttons.login")}
										</Link>
									</Grid>
								</Grid>
							</Form>
						)}
					</Formik>
				</div>
			</Container>
		</div>
	);
};

export default SignUp;
