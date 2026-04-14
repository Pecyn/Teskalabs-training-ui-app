import React, { use, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Card, CardHeader, CardBody, Row, Col } from 'reactstrap';
import { DateTime } from 'asab_webui_components';
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';

const DATA_URL = 'https://devtest.teskalabs.com/data';
const PAGE_SIZE = 50;
const INACTIVE_USERS_COUNT = 5;

async function fetchAllUsers() {
	// Fetch first page to get total count, then fetch remaining pages
	const first = await fetch(`${DATA_URL}?p=1&i=${PAGE_SIZE}`);
	if (!first.ok)
		throw new Error(`Data fetch failed with status: ${first.status}`);
	const json = await first.json();
	const total = json.count;
	let users = json.data;

	const totalPages = Math.ceil(total / PAGE_SIZE);
	for (let page = 2; page <= totalPages; page++) {
		const res = await fetch(`${DATA_URL}?p=${page}&i=${PAGE_SIZE}`);
		if (!res.ok)
			throw new Error(`Data fetch failed with status: ${res.status}`);
		const data = await res.json();
		users = users.concat(data.data);
	}
	return users;
}

function groupByMonth(users, field) {
	const counts = {};
	users.forEach((user) => {
		if (!user[field]) return;
		// Handle both ISO strings and numeric timestamps (seconds or ms)
		const ts =
			typeof user[field] === 'number'
				? new Date(user[field] < 1e12 ? user[field] * 1000 : user[field])
				: new Date(user[field]);
		const month = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
		counts[month] = (counts[month] || 0) + 1;
	});
	return Object.entries(counts)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([month, count]) => ({ month, count }));
}

function StatCard({ icon, label, value, sub = undefined, loading = false }) {
	return (
		<Card className="h-100">
			<CardBody className="d-flex align-items-center gap-3">
				<i className={`${icon} fs-2 text-primary`} />
				<div className="flex-fill">
					<div className="text-muted small">{label}</div>
					{loading ? (
						<>
							<span className="placeholder bg-secondary w-75 d-block mt-1" />
							<span className="placeholder bg-secondary w-50 d-block mt-1" />
						</>
					) : (
						<>
							<div className="fw-bold fs-5">{value}</div>
							{sub && <div className="text-muted small">{sub}</div>}
						</>
					)}
				</div>
			</CardBody>
		</Card>
	);
}

function ChartCard({ icon, title, children, loading = false }) {
	const [isOpen, setIsOpen] = useState(true);
	return (
		<Card className={isOpen ? 'h-100' : undefined}>
			<CardHeader
				className="d-flex justify-content-between align-items-center"
				style={{ cursor: 'pointer', userSelect: 'none' }}
				onClick={() => setIsOpen((o) => !o)}
			>
				<span className="fw-semibold">
					<i className={`${icon} me-2`} />
					{title}
				</span>
				<span className="btn btn-outline-secondary btn-sm">
					<i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} />
				</span>
			</CardHeader>
			{isOpen && (
				<CardBody>
					{loading ? (
						<span
							className="placeholder bg-secondary d-block rounded"
							style={{ height: 250 }}
						/>
					) : (
						children
					)}
				</CardBody>
			)}
		</Card>
	);
}

function InactiveUsersTable({ rows = [], loading = false }) {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(true);
	return (
		<Card>
			<CardHeader
				className="d-flex justify-content-between align-items-center"
				style={{ cursor: 'pointer', userSelect: 'none' }}
				onClick={() => setIsOpen((o) => !o)}
			>
				<span className="fw-semibold">
					<i className="bi bi-clock-history me-2" />
					{t('Training|Longest inactive users')}
				</span>
				<span className="btn btn-outline-secondary btn-sm">
					<i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} />
				</span>
			</CardHeader>
			{isOpen && (
				<CardBody className="p-0">
					<table className="table table-hover mb-0">
						<thead>
							<tr>
								<th>{t('Training|Username')}</th>
								<th>{t('Training|Last sign in')}</th>
							</tr>
						</thead>
						<tbody>
							{loading
								? Array.from({ length: INACTIVE_USERS_COUNT }, (_, i) => i).map(
										(i) => (
											<tr key={i}>
												<td>
													<span className="placeholder bg-secondary w-75" />
												</td>
												<td>
													<span className="placeholder bg-secondary w-50" />
												</td>
											</tr>
										),
									)
								: rows.map((user) => (
										<tr key={user.id}>
											<td>{user.username}</td>
											<td>
												<DateTime value={user.last_sign_in} />
											</td>
										</tr>
									))}
						</tbody>
					</table>
				</CardBody>
			)}
		</Card>
	);
}

export function DashboardView({ users = null, loading = false }) {
	const { t } = useTranslation();

	const totalUsers = loading ? null : users.length;
	const sortedByCreated = loading
		? []
		: [...users].sort((a, b) => b.created - a.created);
	const sortedByActivity = loading
		? []
		: [...users].sort((a, b) => b.last_sign_in - a.last_sign_in);
	const newestUser = sortedByCreated[0] ?? null;
	const mostRecentActive = sortedByActivity[0] ?? null;
	const leastRecentActive = sortedByActivity
		.slice(-INACTIVE_USERS_COUNT)
		.reverse();
	const registrationsPerMonth = loading ? [] : groupByMonth(users, 'created');
	const lastActivityPerMonth = loading
		? []
		: groupByMonth(users, 'last_sign_in');

	return (
		<div className={loading ? 'placeholder-glow' : undefined}>
			{/* Stat cards */}
			<Row className="g-3 mb-4">
				<Col md={4}>
					<StatCard
						icon="bi bi-people"
						label={t('Training|Total users')}
						value={totalUsers}
						loading={loading}
					/>
				</Col>
				<Col md={4}>
					<StatCard
						icon="bi bi-person-plus"
						label={t('Training|Newest user')}
						value={newestUser?.username}
						sub={loading ? undefined : <DateTime value={newestUser?.created} />}
						loading={loading}
					/>
				</Col>
				<Col md={4}>
					<StatCard
						icon="bi bi-activity"
						label={t('Training|Most recently active')}
						value={mostRecentActive?.username}
						sub={
							loading ? undefined : (
								<DateTime value={mostRecentActive?.last_sign_in} />
							)
						}
						loading={loading}
					/>
				</Col>
			</Row>

			{/* Charts */}
			<Row className="g-3 mb-4">
				<Col md={6}>
					<ChartCard
						icon="bi bi-bar-chart"
						title={t('Training|Registrations per month')}
						loading={loading}
					>
						{!loading && (
							<ResponsiveContainer width="100%" height={250}>
								<BarChart data={registrationsPerMonth}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" tick={{ fontSize: 11 }} />
									<YAxis allowDecimals={false} />
									<Tooltip />
									<Bar
										dataKey="count"
										name={t('Training|Registrations')}
										fill="var(--bs-primary)"
										radius={[3, 3, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						)}
					</ChartCard>
				</Col>
				<Col md={6}>
					<ChartCard
						icon="bi bi-graph-up"
						title={t('Training|Last activity by month')}
						loading={loading}
					>
						{!loading && (
							<ResponsiveContainer width="100%" height={250}>
								<LineChart data={lastActivityPerMonth}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" tick={{ fontSize: 11 }} />
									<YAxis allowDecimals={false} />
									<Tooltip />
									<Legend />
									<Line
										type="monotone"
										dataKey="count"
										name={t('Training|Users last active')}
										stroke="var(--bs-primary)"
										strokeWidth={2}
										dot={{ r: 4 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						)}
					</ChartCard>
				</Col>
			</Row>

			{/* Inactive users table */}
			<InactiveUsersTable rows={leastRecentActive} loading={loading} />
		</div>
	);
}

function DashboardContent({ usersPromise }) {
	const users = use(usersPromise);
	return <DashboardView users={users} />;
}

export function DashboardScreen() {
	const [usersPromise] = useState(() => fetchAllUsers());

	return (
		<Container className="mt-3">
			<h5 className="mb-3">
				<i className="bi bi-speedometer2 me-2" />
				{'Dashboard'}
			</h5>
			<Suspense fallback={<DashboardView loading />}>
				<DashboardContent usersPromise={usersPromise} />
			</Suspense>
		</Container>
	);
}
