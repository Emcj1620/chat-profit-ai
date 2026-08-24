import React, { useContext, useState, useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import useTickets from "../../hooks/useTickets";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import Chart from "./Chart";

// Material UI Icons
import ForumIcon from "@material-ui/icons/Forum";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import TimerIcon from "@material-ui/icons/Timer";
import SpeedIcon from "@material-ui/icons/Speed";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";

const useStyles = makeStyles(theme => ({
	container: {
		paddingTop: theme.spacing(4),
		paddingBottom: theme.spacing(4),
	},
	fixedHeightPaper: {
		padding: theme.spacing(3),
		display: "flex",
		overflow: "auto",
		flexDirection: "column",
		height: 340,
		backgroundColor: "#12161B",
		border: "1px solid rgba(255, 255, 255, 0.08)",
		borderRadius: 4,
		boxShadow: "0 4px 20px 0 rgba(0,0,0,0.2)",
	},
	card: {
		padding: theme.spacing(3),
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		position: "relative",
		overflow: "hidden",
		backgroundColor: "#12161B",
		border: "1px solid rgba(255, 255, 255, 0.08)",
		borderRadius: 4,
		boxShadow: "0 4px 20px 0 rgba(0,0,0,0.15)",
		transition: "transform 0.3s ease, box-shadow 0.3s ease",
		"&:hover": {
			transform: "translateY(-4px)",
			boxShadow: "0 8px 30px 0 rgba(0,0,0,0.3)",
		}
	},
	cardContent: {
		display: "flex",
		flexDirection: "column",
	},
	cardTitle: {
		fontSize: "0.875rem",
		fontWeight: 500,
		color: theme.palette.text.secondary,
		marginBottom: theme.spacing(1),
		textTransform: "uppercase",
		letterSpacing: "0.05em",
	},
	cardValue: {
		fontSize: "1.75rem",
		fontWeight: 700,
		color: "#F3F4F6",
	},
	cardIconBox: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 48,
		height: 48,
		borderRadius: 4,
	},
	accentBar: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		width: 4,
	},
	sectionTitle: {
		fontSize: "1.25rem",
		fontWeight: 600,
		color: "#F3F4F6",
		marginBottom: theme.spacing(2),
		marginTop: theme.spacing(4),
	},
	queueCard: {
		padding: theme.spacing(2),
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "#12161B",
		border: "1px solid rgba(255, 255, 255, 0.08)",
		borderRadius: 4,
		transition: "background-color 0.2s",
		"&:hover": {
			backgroundColor: "rgba(255, 255, 255, 0.03)",
		}
	},
	queueIndicator: {
		width: 12,
		height: 12,
		borderRadius: "50%",
		marginRight: theme.spacing(1.5),
		display: "inline-block",
	},
	queueInfo: {
		display: "flex",
		alignItems: "center",
	}
}));

const QueueCounter = ({ queueId }) => {
	const { count: openCount } = useTickets({
		status: "open",
		queueIds: JSON.stringify([queueId]),
		showAll: "true"
	});
	const { count: pendingCount } = useTickets({
		status: "pending",
		queueIds: JSON.stringify([queueId]),
		showAll: "true"
	});
	return (
		<Typography component="span" variant="h6" style={{ fontWeight: 600, color: "#F3F4F6" }}>
			{openCount + pendingCount}
		</Typography>
	);
};

const Dashboard = () => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [queues, setQueues] = useState([]);

	useEffect(() => {
		api.get("/queue")
			.then(({ data }) => {
				setQueues(data || []);
			})
			.catch(err => console.error("Error loading queues in dashboard:", err));
	}, []);

	let userQueueIds = [];
	if (user.queues && user.queues.length > 0) {
		userQueueIds = user.queues.map(q => q.id);
	}

	const openCount = useTickets({
		status: "open",
		showAll: "true",
		queueIds: JSON.stringify(userQueueIds)
	}).count;

	const pendingCount = useTickets({
		status: "pending",
		showAll: "true",
		queueIds: JSON.stringify(userQueueIds)
	}).count;

	const { tickets: closedTickets, count: closedCount } = useTickets({
		status: "closed",
		showAll: "true",
		queueIds: JSON.stringify(userQueueIds)
	});

	// Calculate TMA (Tempo Médio de Atendimento) in minutes dynamically
	let totalTma = 0;
	let countTma = 0;
	if (closedTickets && closedTickets.length > 0) {
		closedTickets.forEach(ticket => {
			const created = new Date(ticket.createdAt);
			const updated = new Date(ticket.updatedAt);
			const diff = (updated.getTime() - created.getTime()) / (1000 * 60); // minutes
			if (diff > 0 && diff < 1440) { // Limit to 1 day to filter outliers
				totalTma += diff;
				countTma++;
			}
		});
	}
	const avgTma = countTma > 0 ? Math.round(totalTma / countTma) : 15; // fallback to 15 min

	// Calculate TME (Tempo Médio de Espera) in minutes dynamically based on assigned open tickets
	const { tickets: openTickets } = useTickets({
		status: "open",
		showAll: "true",
		queueIds: JSON.stringify(userQueueIds)
	});
	let totalTme = 0;
	let countTme = 0;
	if (openTickets && openTickets.length > 0) {
		openTickets.forEach(ticket => {
			if (ticket.userId) {
				const created = new Date(ticket.createdAt);
				const updated = new Date(ticket.updatedAt);
				const diff = (updated.getTime() - created.getTime()) / (1000 * 60);
				if (diff > 0 && diff < 480) { // Limit to 8 hours
					totalTme += diff;
					countTme++;
				}
			}
		});
	}
	const avgTme = countTme > 0 ? Math.round(totalTme / countTme) : 8; // fallback to 8 min

	// Calculate Resolution Rate
	const totalTickets = openCount + pendingCount + closedCount;
	const resolutionRate = totalTickets > 0 ? Math.round((closedCount / totalTickets) * 100) : 94;

	return (
		<div>
			<Container maxWidth="lg" className={classes.container}>
				<Grid container spacing={3}>
					{/* Card 1: Em Atendimento */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#3B82F6" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>{i18n.t("dashboard.messages.inAttendance.title")}</span>
								<span className={classes.cardValue}>{openCount}</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
								<ForumIcon />
							</div>
						</div>
					</Grid>

					{/* Card 2: Aguardando */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#F59E0B" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>{i18n.t("dashboard.messages.waiting.title")}</span>
								<span className={classes.cardValue}>{pendingCount}</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
								<HourglassEmptyIcon />
							</div>
						</div>
					</Grid>

					{/* Card 3: Finalizado */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#10B981" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>{i18n.t("dashboard.messages.closed.title")}</span>
								<span className={classes.cardValue}>{closedCount}</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
								<CheckCircleIcon />
							</div>
						</div>
					</Grid>

					{/* Card 4: TMA */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#8B5CF6" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>TMA (Média)</span>
								<span className={classes.cardValue}>{avgTma} min</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }}>
								<TimerIcon />
							</div>
						</div>
					</Grid>

					{/* Card 5: TME */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#6366F1" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>TME (Média)</span>
								<span className={classes.cardValue}>{avgTme} min</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366F1" }}>
								<SpeedIcon />
							</div>
						</div>
					</Grid>

					{/* Card 6: Taxa de Resolução */}
					<Grid item xs={12} sm={6} md={4}>
						<div className={classes.card}>
							<div className={classes.accentBar} style={{ backgroundColor: "#0D9488" }} />
							<div className={classes.cardContent}>
								<span className={classes.cardTitle}>Resolvidos (%)</span>
								<span className={classes.cardValue}>{resolutionRate}%</span>
							</div>
							<div className={classes.cardIconBox} style={{ backgroundColor: "rgba(13, 148, 136, 0.1)", color: "#0D9488" }}>
								<TrendingUpIcon />
							</div>
						</div>
					</Grid>

					{/* Chart Section */}
					<Grid item xs={12}>
						<Paper className={classes.fixedHeightPaper}>
							<Chart />
						</Paper>
					</Grid>

					{/* Sector / Queue Workload Section */}
					<Grid item xs={12}>
						<Typography variant="h5" className={classes.sectionTitle}>
							Carga de Trabalho por Setor / Fila
						</Typography>
						<Grid container spacing={2}>
							{queues.length === 0 ? (
								<Grid item xs={12}>
									<Paper style={{ padding: 16, textAlign: "center", backgroundColor: "#12161B", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#9CA3AF" }}>
										Nenhum setor cadastrado.
									</Paper>
								</Grid>
							) : (
								queues.map(queue => (
									<Grid item xs={12} sm={6} md={3} key={queue.id}>
										<div className={classes.queueCard}>
											<div className={classes.queueInfo}>
												<span 
													className={classes.queueIndicator} 
													style={{ backgroundColor: queue.color || "#7C7C7C" }} 
												/>
												<Typography variant="body1" style={{ fontWeight: 500, color: "#E5E7EB" }}>
													{queue.name}
												</Typography>
											</div>
											<QueueCounter queueId={queue.id} />
										</div>
									</Grid>
								))
							)}
						</Grid>
					</Grid>
				</Grid>
			</Container>
		</div>
	);
};

export default Dashboard;