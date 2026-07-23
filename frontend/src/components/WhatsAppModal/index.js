import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	Button,
	DialogActions,
	CircularProgress,
	TextField,
	Switch,
	FormControlLabel,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	Divider,
	Typography,
	Grid,
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},

	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
	},

	btnWrapper: {
		position: "relative",
	},

	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},
}));

const SessionSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(50, "Too Long!")
		.required("Required"),
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
	const classes = useStyles();
	const initialState = {
		name: "",
		greetingMessage: "",
		farewellMessage: "",
		isDefault: false,
		gptEnabled: false,
		gptApiKey: "",
		gptModel: "gpt-4o-mini",
		gptPrompt: "",
		gptGuidelines: "",
		gptTemperature: 0.7,
		flowId: ""
	};
	const [whatsApp, setWhatsApp] = useState(initialState);
	const [selectedQueueIds, setSelectedQueueIds] = useState([]);
	const [chatFlows, setChatFlows] = useState([]);

	useEffect(() => {
		const fetchSession = async () => {
			if (!whatsAppId) return;

			try {
				const { data } = await api.get(`whatsapp/${whatsAppId}`);
				setWhatsApp({
					...initialState,
					...data,
					flowId: data.flowId || ""
				});

				const whatsQueueIds = data.queues?.map(queue => queue.id);
				setSelectedQueueIds(whatsQueueIds);
			} catch (err) {
				toastError(err);
			}
		};
		const fetchFlows = async () => {
			try {
				const { data } = await api.get("/chatflows");
				setChatFlows(data.filter(f => f.isActive));
			} catch (err) {
				toastError(err);
			}
		};
		fetchSession();
		fetchFlows();
	}, [whatsAppId]);

	const handleSaveWhatsApp = async values => {
		const whatsappData = { ...values, queueIds: selectedQueueIds };

		try {
			if (whatsAppId) {
				await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
			} else {
				await api.post("/whatsapp", whatsappData);
			}
			toast.success(i18n.t("whatsappModal.success"));
			handleClose();
		} catch (err) {
			toastError(err);
		}
	};

	const handleClose = () => {
		onClose();
		setWhatsApp(initialState);
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				scroll="paper"
			>
				<DialogTitle>
					{whatsAppId
						? i18n.t("whatsappModal.title.edit")
						: i18n.t("whatsappModal.title.add")}
				</DialogTitle>
				<Formik
					initialValues={whatsApp}
					enableReinitialize={true}
					validationSchema={SessionSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveWhatsApp(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ values, touched, errors, isSubmitting }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("whatsappModal.form.name")}
										autoFocus
										name="name"
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										className={classes.textField}
									/>
									<FormControlLabel
										control={
											<Field
												as={Switch}
												color="primary"
												name="isDefault"
												checked={values.isDefault}
											/>
										}
										label={i18n.t("whatsappModal.form.default")}
									/>
								</div>
								<div>
									<Field
										as={TextField}
										label={i18n.t("queueModal.form.greetingMessage")}
										type="greetingMessage"
										multiline
										rows={5}
										fullWidth
										name="greetingMessage"
										error={
											touched.greetingMessage && Boolean(errors.greetingMessage)
										}
										helperText={
											touched.greetingMessage && errors.greetingMessage
										}
										variant="outlined"
										margin="dense"
									/>
								</div>
								<div>
									<Field
										as={TextField}
										label={i18n.t("whatsappModal.form.farewellMessage")}
										type="farewellMessage"
										multiline
										rows={5}
										fullWidth
										name="farewellMessage"
										error={
											touched.farewellMessage && Boolean(errors.farewellMessage)
										}
										helperText={
											touched.farewellMessage && errors.farewellMessage
										}
										variant="outlined"
										margin="dense"
									/>
								</div>
								<QueueSelect
									selectedQueueIds={selectedQueueIds}
									onChange={selectedIds => setSelectedQueueIds(selectedIds)}
								/>

								<Divider style={{ margin: "20px 0 10px 0" }} />

								<Typography variant="subtitle1" gutterBottom style={{ fontWeight: "bold" }}>
									Chatbot (Fluxo de Conversa)
								</Typography>

								<div style={{ marginTop: 8, marginBottom: 12 }}>
									<FormControl variant="outlined" margin="dense" fullWidth>
										<InputLabel id="flow-selection-label">Fluxo de Conversa Padrão</InputLabel>
										<Field
											as={Select}
											labelId="flow-selection-label"
											id="flowId"
											name="flowId"
											label="Fluxo de Conversa Padrão"
										>
											<MenuItem value=""><em>Nenhum / Desativado</em></MenuItem>
											{chatFlows.map(f => (
												<MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
											))}
										</Field>
									</FormControl>
								</div>

								<Divider style={{ margin: "20px 0 10px 0" }} />
								
								<Typography variant="subtitle1" gutterBottom style={{ fontWeight: "bold" }}>
									Agente de Inteligência Artificial (ChatGPT)
								</Typography>

								<div style={{ marginBottom: 12 }}>
									<FormControlLabel
										control={
											<Field
												as={Switch}
												color="primary"
												name="gptEnabled"
												checked={values.gptEnabled}
											/>
										}
										label="Ativar Agente de IA para esta conexão"
									/>
								</div>

								{values.gptEnabled && (
									<Grid container spacing={2} style={{ marginTop: 8 }}>
										<Grid item xs={12}>
											<Field
												as={TextField}
												label="OpenAI API Key"
												name="gptApiKey"
												type="password"
												error={touched.gptApiKey && Boolean(errors.gptApiKey)}
												helperText={touched.gptApiKey && errors.gptApiKey}
												variant="outlined"
												margin="dense"
												fullWidth
											/>
										</Grid>
										<Grid item xs={12} sm={6}>
											<FormControl variant="outlined" margin="dense" fullWidth>
												<InputLabel id="gpt-model-label">Modelo</InputLabel>
												<Field
													as={Select}
													labelId="gpt-model-label"
													id="gptModel"
													name="gptModel"
													label="Modelo"
												>
													<MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
													<MenuItem value="gpt-4o">gpt-4o</MenuItem>
													<MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
												</Field>
											</FormControl>
										</Grid>
										<Grid item xs={12} sm={6}>
											<Field
												as={TextField}
												label="Temperatura (0 a 1)"
												name="gptTemperature"
												type="number"
												inputProps={{ min: 0, max: 1, step: 0.1 }}
												InputLabelProps={{ shrink: true }}
												error={touched.gptTemperature && Boolean(errors.gptTemperature)}
												helperText={touched.gptTemperature && errors.gptTemperature}
												variant="outlined"
												margin="dense"
												fullWidth
											/>
										</Grid>
										<Grid item xs={12}>
											<Field
												as={TextField}
												label="Comportamento / Persona do Agente de IA"
												placeholder="Ex: Você é um atendente simpático de suporte da loja..."
												multiline
												rows={4}
												fullWidth
												name="gptPrompt"
												error={touched.gptPrompt && Boolean(errors.gptPrompt)}
												helperText={touched.gptPrompt && errors.gptPrompt}
												variant="outlined"
												margin="dense"
											/>
										</Grid>
										<Grid item xs={12}>
											<Field
												as={TextField}
												label="Diretrizes Operacionais (Regras e Restrições)"
												placeholder="Ex: Nunca ofereça descontos maiores que 10%. Não informe dados de contato pessoal."
												multiline
												rows={4}
												fullWidth
												name="gptGuidelines"
												error={touched.gptGuidelines && Boolean(errors.gptGuidelines)}
												helperText={touched.gptGuidelines && errors.gptGuidelines}
												variant="outlined"
												margin="dense"
											/>
										</Grid>
									</Grid>
								)}
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("whatsappModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{whatsAppId
										? i18n.t("whatsappModal.buttons.okEdit")
										: i18n.t("whatsappModal.buttons.okAdd")}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default React.memo(WhatsAppModal);
