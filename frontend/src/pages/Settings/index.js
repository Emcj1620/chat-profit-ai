import React, { useState, useEffect } from "react";
import openSocket from "../../services/socket-io";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { toast } from "react-toastify";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		alignItems: "center",
		padding: theme.spacing(8, 8, 3),
	},

	paper: {
		padding: theme.spacing(2),
		display: "flex",
		alignItems: "center",
		marginBottom: 12,

	},

	settingOption: {
		marginLeft: "auto",
	},
	margin: {
		margin: theme.spacing(1),
	},

}));

const Settings = () => {
	const classes = useStyles();

	const [settings, setSettings] = useState([]);

	useEffect(() => {
		const fetchSession = async () => {
			try {
				const { data } = await api.get("/settings");
				setSettings(data);
			} catch (err) {
				toastError(err);
			}
		};
		fetchSession();
	}, []);

	useEffect(() => {
		const socket = openSocket();

		socket.on("settings", data => {
			if (data.action === "update") {
				setSettings(prevState => {
					const aux = [...prevState];
					const settingIndex = aux.findIndex(s => s.key === data.setting.key);
					aux[settingIndex].value = data.setting.value;
					return aux;
				});
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const handleChangeSetting = async e => {
		const selectedValue = e.target.value;
		const settingKey = e.target.name;

		try {
			await api.put(`/settings/${settingKey}`, {
				value: selectedValue,
			});
			toast.success(i18n.t("settings.success"));
		} catch (err) {
			toastError(err);
		}
	};

	const handleUploadLogo = async e => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];
		const formData = new FormData();
		formData.append("file", file);
		formData.append("mode", "light");

		try {
			await api.post("/settings/logo", formData, {
				headers: {
					"Content-Type": "multipart/form-data"
				}
			});
			toast.success("Logo atualizado com sucesso!");
		} catch (err) {
			toastError(err);
		}
	};

	const handleUploadFavicon = async e => {
		if (!e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];
		const formData = new FormData();
		formData.append("file", file);
		formData.append("mode", "favicon");

		try {
			await api.post("/settings/logo", formData, {
				headers: {
					"Content-Type": "multipart/form-data"
				}
			});
			toast.success("Favicon atualizado com sucesso!");
		} catch (err) {
			toastError(err);
		}
	};

	const getSettingValue = key => {
		const { value } = settings.find(s => s.key === key);
		return value;
	};

	return (
		<div className={classes.root}>
			<Container className={classes.container} maxWidth="sm">
				<Typography variant="body2" gutterBottom>
					{i18n.t("settings.title")}
				</Typography>
				<Paper className={classes.paper}>
					<Typography variant="body1">
						{i18n.t("settings.settings.userCreation.name")}
					</Typography>
					<Select
						margin="dense"
						variant="outlined"
						native
						id="userCreation-setting"
						name="userCreation"
						value={
							settings && settings.length > 0 && getSettingValue("userCreation")
						}
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

				</Paper>

				<Paper className={classes.paper}>
					<TextField
						id="api-token-setting"
						readonly
						label="Token Api"
						margin="dense"
						variant="outlined"
						fullWidth
						value={settings && settings.length > 0 && getSettingValue("userApiToken")}
					/>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="body1">
						Cor Primária
					</Typography>
					<input
						type="color"
						id="primaryColor-setting"
						name="primaryColor"
						value={
							(settings && settings.length > 0 && getSettingValue("primaryColor")) || "#2576d2"
						}
						className={classes.settingOption}
						onChange={handleChangeSetting}
						style={{ cursor: "pointer", border: "none", width: 40, height: 40, borderRadius: 4 }}
					/>
				</Paper>

				<Paper className={classes.paper}>
					<Typography variant="body1">
						Cor Secundária
					</Typography>
					<input
						type="color"
						id="secondaryColor-setting"
						name="secondaryColor"
						value={
							(settings && settings.length > 0 && getSettingValue("secondaryColor")) || "#1565c0"
						}
						className={classes.settingOption}
						onChange={handleChangeSetting}
						style={{ cursor: "pointer", border: "none", width: 40, height: 40, borderRadius: 4 }}
					/>
				</Paper>

				{settings && settings.length > 0 && (
					<Paper className={classes.paper}>
						<TextField
							id="appName-setting"
							label="Nome da Marca / Sistema"
							margin="dense"
							variant="outlined"
							name="appName"
							fullWidth
							defaultValue={getSettingValue("appName")}
							onBlur={handleChangeSetting}
						/>
					</Paper>
				)}

				<Paper className={classes.paper} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<Typography variant="body1">
						Logotipo da Marca (SVG/PNG)
					</Typography>
					<Button
						variant="contained"
						component="label"
						color="primary"
					>
						Escolher Logo
						<input
							type="file"
							accept="image/*"
							hidden
							onChange={handleUploadLogo}
						/>
					</Button>
				</Paper>

				<Paper className={classes.paper} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
					<Typography variant="body1">
						Ícone do Navegador (Favicon)
					</Typography>
					<Button
						variant="contained"
						component="label"
						color="primary"
					>
						Escolher Ícone
						<input
							type="file"
							accept="image/*"
							hidden
							onChange={handleUploadFavicon}
						/>
					</Button>
				</Paper>

			</Container>
		</div>
	);
};

export default Settings;
