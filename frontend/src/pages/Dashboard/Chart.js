import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@material-ui/core/styles";
import {
	AreaChart,
	Area,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { startOfHour, parseISO, format } from "date-fns";

import { i18n } from "../../translate/i18n";

import Title from "./Title";
import useTickets from "../../hooks/useTickets";

const Chart = () => {
	const theme = useTheme();

	const date = useRef(new Date().toISOString());
	const { tickets } = useTickets({ date: date.current });

	const [chartData, setChartData] = useState([
		{ time: "08:00", amount: 0 },
		{ time: "09:00", amount: 0 },
		{ time: "10:00", amount: 0 },
		{ time: "11:00", amount: 0 },
		{ time: "12:00", amount: 0 },
		{ time: "13:00", amount: 0 },
		{ time: "14:00", amount: 0 },
		{ time: "15:00", amount: 0 },
		{ time: "16:00", amount: 0 },
		{ time: "17:00", amount: 0 },
		{ time: "18:00", amount: 0 },
		{ time: "19:00", amount: 0 },
	]);

	useEffect(() => {
		setChartData(prevState => {
			let aux = prevState.map(d => ({ ...d, amount: 0 }));

			tickets.forEach(ticket => {
				const ticketTime = format(startOfHour(parseISO(ticket.createdAt)), "HH:mm");
				const found = aux.find(a => a.time === ticketTime);
				if (found) {
					found.amount++;
				}
			});

			return aux;
		});
	}, [tickets]);

	return (
		<React.Fragment>
			<Title>{`${i18n.t("dashboard.charts.perDay.title")}${tickets.length}`}</Title>
			<ResponsiveContainer>
				<AreaChart
					data={chartData}
					margin={{
						top: 16,
						right: 16,
						bottom: 0,
						left: 0,
					}}
				>
					<defs>
						<linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
							<stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
					<XAxis 
						dataKey="time" 
						stroke={theme.palette.text.secondary} 
						tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
					/>
					<YAxis
						type="number"
						allowDecimals={false}
						stroke={theme.palette.text.secondary}
						tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "#12161B",
							border: "1px solid rgba(255, 255, 255, 0.08)",
							borderRadius: 4,
							color: "#F3F4F6"
						}}
					/>
					<Area
						type="monotone"
						dataKey="amount"
						stroke={theme.palette.primary.main}
						strokeWidth={3}
						fillOpacity={1}
						fill="url(#colorAmount)"
					/>
				</AreaChart>
			</ResponsiveContainer>
		</React.Fragment>
	);
};

export default Chart;
