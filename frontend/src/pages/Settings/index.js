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
						Configuração de Pagamento (SaaS Asaas)
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<TextField
								id="asaasToken-setting"
								label="Token de Acesso do Asaas (Sandbox ou Produção)"
								margin="dense"
								variant="outlined"
								name="asaasToken"
								fullWidth
								type="password"
								value={getSettingValue("asaasToken")}
								onChange={e => {
									const val = e.target.value;
									setSettings(prev => {
										if (!Array.isArray(prev)) return [];
										const idx = prev.findIndex(s => s.key === "asaasToken");
										if (idx !== -1) {
											const updated = [...prev];
											updated[idx] = { ...updated[idx], value: val };
											return updated;
										} else {
											return [...prev, { key: "asaasToken", value: val }];
										}
									});
								}}
								onBlur={handleChangeSetting}
							/>
						</Grid>
					</Grid>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 10 }}>
						Paleta de Cores Oficial Chat Profit AI
					</Typography>
					<Typography variant="body2" color="textSecondary" style={{ marginBottom: 15 }}>
						Clique em qualquer tema pré-definido para aplicar instantaneamente a combinação oficial:
					</Typography>
					<Grid container spacing={2} style={{ marginBottom: 20 }}>
						{[
							{
								name: "Chat Profit AI (Oficial)",
								primary: "#28C76F",
								sec: "#0084FF",
								bg: "#0B0F14",
								header: "#1F2937",
								sidebarBg: "#0B0F14",
								sidebarText: "#FFFFFF",
							},
							{
								name: "Cyber Limão & Roxo",
								primary: "#A8FF33",
								sec: "#8A2BE2",
								bg: "#0B0F14",
								header: "#1F2937",
								sidebarBg: "#0B0F14",
								sidebarText: "#A8FF33",
							},
							{
								name: "Ocean Teal & Azul Escuro",
								primary: "#00C5BB",
								sec: "#2D5BFF",
								bg: "#1F2937",
								header: "#0B0F14",
								sidebarBg: "#1F2937",
								sidebarText: "#00C5BB",
							},
							{
								name: "Neon Gold & Verde",
								primary: "#CCFF00",
								sec: "#28C76F",
								bg: "#0B0F14",
								header: "#1F2937",
								sidebarBg: "#0B0F14",
								sidebarText: "#CCFF00",
							}
						].map((themeObj, index) => (
							<Grid item xs={12} sm={6} key={index}>
								<Button
									variant="outlined"
									fullWidth
									onClick={async () => {
										try {
											const themeColors = {
												primaryColor: themeObj.primary,
												secondaryColor: themeObj.sec,
												darkModeBgColor: themeObj.bg,
												headerBgColor: themeObj.header,
												sidebarBgColor: themeObj.sidebarBg,
												sidebarTextColor: themeObj.sidebarText,
											};
											for (const [k, v] of Object.entries(themeColors)) {
												await api.put(`/settings/${k}`, { value: v });
											}
											toast.success(`Tema "${themeObj.name}" aplicado!`);
											fetchSession();
											if (fetchThemeSettings) fetchThemeSettings();
										} catch (err) {
											toastError(err);
										}
									}}
									style={{
										justifyContent: "flex-start",
										padding: "10px 14px",
										borderRadius: 10,
										textTransform: "none",
										borderColor: "#444"
									}}
								>
									<Box display="flex" alignItems="center" width="100%">
										<Box display="flex" style={{ marginRight: 12 }}>
											<span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: themeObj.primary, display: "inline-block", marginRight: 4 }} />
											<span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: themeObj.sec, display: "inline-block", marginRight: 4 }} />
											<span style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: themeObj.bg, border: "1px solid #777", display: "inline-block" }} />
										</Box>
										<Typography variant="body2" style={{ fontWeight: 600 }}>
											{themeObj.name}
										</Typography>
									</Box>
								</Button>
							</Grid>
						))}
					</Grid>

					<Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: 8 }}>
						Amostras da Paleta de Cores da Marca:
					</Typography>
					<Box display="flex" flexWrap="wrap" gridGap={10} mb={2}>
						{[
							{ name: "Verde Limão", hex: "#A8FF33" },
							{ name: "Verde Principal", hex: "#28C76F" },
							{ name: "Verde Água", hex: "#00C5BB" },
							{ name: "Azul", hex: "#0084FF" },
							{ name: "Azul Escuro", hex: "#2D5BFF" },
							{ name: "Roxo", hex: "#8A2BE2" },
							{ name: "Branco", hex: "#FFFFFF" },
							{ name: "Cinza Claro", hex: "#E6E8EB" },
							{ name: "Cinza Médio", hex: "#6B7280" },
							{ name: "Cinza Escuro", hex: "#1F2937" },
							{ name: "Preto", hex: "#0B0F14" },
							{ name: "Amarelo Esverdeado", hex: "#CCFF00" },
							{ name: "Roxo Destaque", hex: "#7D3CF4" },
						].map((colorItem, i) => (
							<Box
								key={i}
								display="flex"
								alignItems="center"
								style={{
									backgroundColor: "rgba(255,255,255,0.05)",
									padding: "4px 10px",
									borderRadius: 20,
									border: "1px solid rgba(255,255,255,0.1)",
									cursor: "pointer"
								}}
								onClick={() => {
									navigator.clipboard.writeText(colorItem.hex);
									toast.info(`Hex ${colorItem.hex} (${colorItem.name}) copiado!`);
								}}
								title={`Clique para copiar ${colorItem.hex}`}
							>
								<span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: colorItem.hex, display: "inline-block", marginRight: 8, border: "1px solid rgba(0,0,0,0.2)" }} />
								<Typography variant="caption" style={{ fontWeight: 500 }}>
									{colorItem.name} ({colorItem.hex})
								</Typography>
							</Box>
						))}
					</Box>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: 15 }}>
						Personalização Fina de Cores
					</Typography>
					<Grid container spacing={3}>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Cor Primária</Typography>
								<input
									type="color"
									id="primaryColor-setting"
									name="primaryColor"
									value={getSettingValue("primaryColor") || "#28C76F"}
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
									value={getSettingValue("secondaryColor") || "#0084FF"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Fundo no Modo Escuro</Typography>
								<input
									type="color"
									id="darkModeBgColor-setting"
									name="darkModeBgColor"
									value={getSettingValue("darkModeBgColor") || "#0B0F14"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Barra Superior (Header)</Typography>
								<input
									type="color"
									id="headerBgColor-setting"
									name="headerBgColor"
									value={getSettingValue("headerBgColor") || "#1F2937"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Fundo do Menu Lateral</Typography>
								<input
									type="color"
									id="sidebarBgColor-setting"
									name="sidebarBgColor"
									value={getSettingValue("sidebarBgColor") || "#0B0F14"}
									onChange={handleChangeSetting}
									style={{ cursor: "pointer", border: "none", width: 44, height: 44, borderRadius: 8 }}
								/>
							</Box>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Box display="flex" alignItems="center" justifyContent="space-between">
								<Typography variant="body1">Texto & Ícones do Menu</Typography>
								<input
									type="color"
									id="sidebarTextColor-setting"
									name="sidebarTextColor"
									value={getSettingValue("sidebarTextColor") || "#FFFFFF"}
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
