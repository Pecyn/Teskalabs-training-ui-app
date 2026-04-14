import React, { use, Suspense, useState, useMemo } from 'react';
import {
	DndContext,
	DragOverlay,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
	SortableContext,
	useSortable,
	horizontalListSortingStrategy,
	arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { Container, Card, CardHeader, CardBody, Row } from 'reactstrap';
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

const CARD_CONFIG = {
	registrations: {
		icon: 'bi bi-bar-chart',
		titleKey: 'Training|Registrations per month',
	},
	activity: {
		icon: 'bi bi-graph-up',
		titleKey: 'Training|Last activity by month',
	},
	inactive: {
		icon: 'bi bi-clock-history',
		titleKey: 'Training|Longest inactive users',
	},
};

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
				<i className="bi bi-grip-vertical text-muted" />
			</CardBody>
		</Card>
	);
}
function DraggableCardHeader({
	icon,
	title,
	isOpen = true,
	isDragging = false,
	onClick = undefined,
	...rest
}) {
	return (
		<CardHeader
			className="d-flex justify-content-between align-items-center"
			style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
			onClick={onClick}
			{...rest}
		>
			<span className="fw-semibold">
				<i className={`${icon} me-2`} />
				{title}
			</span>
			<span className="d-flex align-items-center gap-2">
				<i className="bi bi-grip-vertical text-muted" />
				<span className="btn btn-outline-secondary btn-sm">
					<i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} />
				</span>
			</span>
		</CardHeader>
	);
}
function DraggableCard({
	id,
	icon,
	title,
	colClass = undefined,
	bodyClassName = undefined,
	children,
}) {
	const [isOpen, setIsOpen] = useState(true);
	const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
	return (
		<div
			ref={setNodeRef}
			className={colClass}
			style={{
				opacity: isDragging ? 0 : undefined,
			}}
		>
			<Card className={isOpen ? 'h-100' : undefined}>
				<DraggableCardHeader
					icon={icon}
					title={title}
					isOpen={isOpen}
					isDragging={isDragging}
					onClick={() => setIsOpen((o) => !o)}
					{...attributes}
					{...listeners}
				/>
				{isOpen && <CardBody className={bodyClassName}>{children}</CardBody>}
			</Card>
		</div>
	);
}

function SortableCol({ id, md, children }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });
	return (
		<div
			ref={setNodeRef}
			className={`col-md-${md}`}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.4 : undefined,
				cursor: isDragging ? 'grabbing' : 'grab',
			}}
			{...attributes}
			{...listeners}
		>
			{children}
		</div>
	);
}

export function DashboardView({ users = null, loading = false }) {
	const { t } = useTranslation();

	const {
		totalUsers,
		newestUser,
		mostRecentActive,
		leastRecentActive,
		registrationsPerMonth,
		lastActivityPerMonth,
	} = useMemo(() => {
		if (loading)
			return {
				totalUsers: null,
				newestUser: null,
				mostRecentActive: null,
				leastRecentActive: [],
				registrationsPerMonth: [],
				lastActivityPerMonth: [],
			};
		const sortedByCreated = [...users].sort((a, b) => b.created - a.created);
		const sortedByActivity = [...users].sort(
			(a, b) => b.last_sign_in - a.last_sign_in,
		);
		return {
			totalUsers: users.length,
			newestUser: sortedByCreated[0] ?? null,
			mostRecentActive: sortedByActivity[0] ?? null,
			leastRecentActive: sortedByActivity
				.slice(-INACTIVE_USERS_COUNT)
				.reverse(),
			registrationsPerMonth: groupByMonth(users, 'created'),
			lastActivityPerMonth: groupByMonth(users, 'last_sign_in'),
		};
	}, [users, loading]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);
	const [statOrder, setStatOrder] = useState(['total', 'newest', 'active']);
	const [activeDragId, setActiveDragId] = useState(null);
	const [layout, setLayout] = useState({
		top: ['registrations', 'activity'],
		bottom: ['inactive'],
	});

	const statCards = {
		total: (
			<StatCard
				icon="bi bi-people"
				label={t('Training|Total users')}
				value={totalUsers}
				loading={loading}
			/>
		),
		newest: (
			<StatCard
				icon="bi bi-person-plus"
				label={t('Training|Newest user')}
				value={newestUser?.username}
				sub={loading ? undefined : <DateTime value={newestUser?.created} />}
				loading={loading}
			/>
		),
		active: (
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
		),
	};

	const cardMeta = Object.fromEntries(
		Object.entries(CARD_CONFIG).map(([id, { icon, titleKey }]) => [
			id,
			{ icon, title: t(titleKey) },
		]),
	);

	const onStatDragEnd = ({ active, over }) => {
		if (over && active.id !== over.id)
			setStatOrder((o) =>
				arrayMove(o, o.indexOf(active.id), o.indexOf(over.id)),
			);
	};
	const onDragEnd = ({ active, over }) => {
		if (!over || active.id === over.id) return;
		setLayout((l) => {
			const activeInTop = l.top.includes(active.id);
			const overInTop = l.top.includes(over.id);
			if (activeInTop && overInTop)
				return {
					...l,
					top: arrayMove(
						l.top,
						l.top.indexOf(active.id),
						l.top.indexOf(over.id),
					),
				};
			return {
				top: l.top.map((id) =>
					id === active.id ? over.id : id === over.id ? active.id : id,
				),
				bottom: l.bottom.map((id) =>
					id === active.id ? over.id : id === over.id ? active.id : id,
				),
			};
		});
	};

	const cards = {
		registrations: (
			<DraggableCard
				id="registrations"
				icon={cardMeta.registrations.icon}
				title={cardMeta.registrations.title}
			>
				{loading ? (
					<span
						className="placeholder bg-secondary d-block rounded"
						style={{ height: 250 }}
					/>
				) : (
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
			</DraggableCard>
		),
		activity: (
			<DraggableCard
				id="activity"
				icon={cardMeta.activity.icon}
				title={cardMeta.activity.title}
			>
				{loading ? (
					<span
						className="placeholder bg-secondary d-block rounded"
						style={{ height: 250 }}
					/>
				) : (
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
			</DraggableCard>
		),
		inactive: (
			<DraggableCard
				id="inactive"
				icon={cardMeta.inactive.icon}
				title={cardMeta.inactive.title}
				bodyClassName="p-0"
			>
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
							: leastRecentActive.map((user) => (
									<tr key={user.id}>
										<td>{user.username}</td>
										<td>
											<DateTime value={user.last_sign_in} />
										</td>
									</tr>
								))}
					</tbody>
				</table>
			</DraggableCard>
		),
	};

	return (
		<div className={loading ? 'placeholder-glow' : undefined}>
			{/* Stat cards */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToWindowEdges]}
				onDragEnd={onStatDragEnd}
			>
				<SortableContext
					items={statOrder}
					strategy={horizontalListSortingStrategy}
				>
					<Row className="g-3 mb-4">
						{statOrder.map((id) => (
							<SortableCol key={id} id={id} md={4}>
								{statCards[id]}
							</SortableCol>
						))}
					</Row>
				</SortableContext>
			</DndContext>

			{/* Charts + Inactive users */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToWindowEdges]}
				onDragStart={({ active }) => setActiveDragId(active.id)}
				onDragEnd={(event) => {
					onDragEnd(event);
					setActiveDragId(null);
				}}
				onDragCancel={() => setActiveDragId(null)}
			>
				<SortableContext items={[...layout.top, ...layout.bottom]}>
					<Row className="g-3 mb-4">
						{layout.top.map((id) =>
							React.cloneElement(cards[id], { key: id, colClass: 'col-md-6' }),
						)}
					</Row>
					<Row className="g-3">
						{layout.bottom.map((id) =>
							React.cloneElement(cards[id], { key: id, colClass: 'col-12' }),
						)}
					</Row>
				</SortableContext>
				<DragOverlay>
					{activeDragId ? (
						<Card>
							<DraggableCardHeader
								icon={cardMeta[activeDragId].icon}
								title={cardMeta[activeDragId].title}
								isDragging
							/>
						</Card>
					) : null}
				</DragOverlay>
			</DndContext>
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
