import React, { useState, useEffect, useContext } from "react";
import openSocket from "../../services/socket-io";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { toast } from "react-toastify";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { getBackendUrl } from "../../config";
import { useThemeContext } from "../../context/DarkMode";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		alignItems: "center",
		padding: theme.spacing(4, 4, 3),
	},
	paper: {
		padding: theme.spacing(3),
		display: "flex",
		flexDirection: "column",
		marginBottom: theme.spacing(2),
		borderRadius: 12,
	},
	rowPaper: {
		padding: theme.spacing(2.5),
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.spacing(2),
		borderRadius: 12,
	},
	settingOption: {
		marginLeft: "auto",
	},
	previewImg: {
		maxHeight: 48,
		maxWidth: 160,
		objectFit: "contain",
		marginLeft: theme.spacing(2),
		borderRadius: 4,
	},
	previewBg: {
		maxHeight: 60,
		maxWidth: 120,
		objectFit: "cover",
		marginLeft: theme.spacing(2),
		borderRadius: 6,
		border: "1px solid #ccc",
	},
}));

const Settings = () => {
	const classes = useStyles();
	const [settings, setSettings] = useState([]);
	const { fetchThemeSettings } = useThemeContext();

	const fetchSession = async () => {
		try {
			const { data } = await api.get("/settings");
			setSettings(data);
		} catch (err) {
			toastError(err);
		}
	};

	useEffect(() => {
		fetchSession();
	}, []);

	useEffect(() => {
		const socket = openSocket();

		socket.on("settings", data => {
			if (data.action === "update") {
				setSettings(prevState => {
					const aux = [...prevState];
					const settingIndex = aux.findIndex(s => s.key === data.setting.key);
					if (settingIndex !== -1) {
						aux[settingIndex].value = data.setting.value;
					} else {
						aux.push(data.setting);
					}
					return aux;
				});
				if (fetchThemeSettings) fetchThemeSettings();
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [fetchThemeSettings]);

	const handleChangeSetting = async e => {
		const selectedValue = e.target.value;
		const settingKey = e.target.name;

		try {
			await api.put(`/settings/${settingKey}`, {
				value: selectedValue,
			});
			toast.success(i18n.t("settings.success"));
			if (fetchThemeSettings) fetchThemeSettings();
		} catch (err) {
			toastError(err);
		}
	};

	const handleUploadAsset = async (e, mode, label) => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];
		const formData = new FormData();
		formData.append("file", file);
		formData.append("mode", mode);

		try {
			await api.post("/settings/logo", formData, {
				headers: {
					"Content-Type": "multipart/form-data"
				}
			});
			toast.success(`${label} atualizado com sucesso!`);
			fetchSession();
			if (fetchThemeSettings) fetchThemeSettings();
		} catch (err) {
			toastError(err);
		}
	};

	const getSettingValue = key => {
		const setting = Array.isArray(settings) && settings.find(s => s.key === key);
		return setting ? setting.value : "";
	};

	const logoLight = getSettingValue("appLogoLight");
	const logoDark = getSettingValue("appLogoDark");
	const favicon = getSettingValue("appFavicon");
	const background = getSettingValue("appBackground");
	const backendUrl = getBackendUrl();

	return (
		<div className={classes.root}>
			<Container maxWidth="md">
				<Typography variant="h5" style={{ fontWeight: 600, marginBottom: 20 }}>
					{i18n.t("settings.title")}
				</Typography>

				<Paper className={classes.paper}>
					<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 15 }}>
						Configurações Gerais
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6}>
							<TextField
								id="appName-setting"
								label="Nome da Marca / Sistema"
								margin="dense"
								variant="outlined"
								name="appName"
								fullWidth
								value={getSettingValue("appName")}
								onChange={e => {
									const val = e.target.value;
									setSettings(prev => prev.map(s => s.key === "appName" ? { ...s, value: val } : s));
								}}
								onBlur={handleChangeSetting}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" height="100%">
								<Typography variant="body1" style={{ marginRight: 15 }}>
									{i18n.t("settings.settings.userCreation.name")}
								</Typography>
								<Select
									margin="dense"
									variant="outlined"
									native
									id="userCreation-setting"
									name="userCreation"
									value={getSettingValue("userCreation") || "enabled"}
									className={classes.settingOption}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.userCreation.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.userCreation.options.disabled")}
									</option>
								</Select>
							</Box>
						</Grid>
					</Grid>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 15 }}>
						Personalização Visual e Cores
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Cor Primária</Typography>
								<input
									type="color"
									id="primaryColor-setting"
									name="primaryColor"
									value={getSettingValue("primaryColor") || "#2576d2"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Cor Secundária</Typography>
								<input
									type="color"
									id="secondaryColor-setting"
									name="secondaryColor"
									value={getSettingValue("secondaryColor") || "#1565c0"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
					</Grid>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 15 }}>
						Logotipos, Favicon e Imagens da Marca
					</Typography>

					{/* Logo Modo Claro */}
					<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
						<Box display="flex" alignItems="center">
							<Typography variant="body1">Logo Modo Claro</Typography>
							{logoLight && (
								<img src={`${backendUrl}public/${logoLight}`} alt="Logo Light" className={classes.previewImg} />
							)}
						</Box>
						<Button variant="contained" component="label" color="primary">
							Upload Logo Claro
							<input type="file" accept="image/*" hidden onChange={e => handleUploadAsset(e, "light", "Logo Modo Claro")} />
						</Button>
					</Box>

					{/* Logo Modo Escuro */}
					<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
						<Box display="flex" alignItems="center">
							<Typography variant="body1">Logo Modo Escuro</Typography>
							{logoDark && (
								<img src={`${backendUrl}public/${logoDark}`} alt="Logo Dark" className={classes.previewImg} style={{ backgroundColor: "#1e1e2f", padding: 4 }} />
							)}
						</Box>
						<Button variant="contained" component="label" color="primary">
							Upload Logo Escuro
							<input type="file" accept="image/*" hidden onChange={e => handleUploadAsset(e, "dark", "Logo Modo Escuro")} />
						</Button>
					</Box>

					{/* Favicon */}
					<Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
						<Box display="flex" alignItems="center">
							<Typography variant="body1">Ícone do Navegador (Favicon)</Typography>
							{favicon && (
								<img src={`${backendUrl}public/${favicon}`} alt="Favicon" className={classes.previewImg} style={{ maxHeight: 32 }} />
							)}
						</Box>
						<Button variant="contained" component="label" color="primary">
							Upload Favicon
							<input type="file" accept="image/*" hidden onChange={e => handleUploadAsset(e, "favicon", "Favicon")} />
						</Button>
					</Box>

					{/* Imagem de Fundo (Background) */}
					<Box display="flex" alignItems="center" justifyContent="space-between">
						<Box display="flex" alignItems="center">
							<Typography variant="body1">Fundo Tela de Login / Cadastro</Typography>
							{background && (
								<img src={`${backendUrl}public/${background}`} alt="Background" className={classes.previewBg} />
							)}
						</Box>
						<Button variant="contained" component="label" color="secondary">
							Upload Imagem de Fundo
							<input type="file" accept="image/*" hidden onChange={e => handleUploadAsset(e, "background", "Imagem de Fundo")} />
						</Button>
					</Box>
				</Paper>

				<Paper className={classes.paper}>
					<TextField
						id="api-token-setting"
						InputProps={{ readOnly: true }}
						label="Token de Integração API"
						margin="dense"
						variant="outlined"
						fullWidth
						value={getSettingValue("apiToken") || getSettingValue("userApiToken")}
					/>
				</Paper>
			</Container>
		</div>
	);
};

export default Settings;
