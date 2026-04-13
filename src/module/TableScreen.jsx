import React from 'react';
import { Container, UncontrolledTooltip } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DataTableCard2, DateTime } from 'asab_webui_components';
import './TableScreen.scss';

const DATA_URL = 'https://devtest.teskalabs.com/data';
const getColumns = (t) => [
	{
		title: (
			<span>
				<i className="bi bi-person me-1" />
				{t('Training|Username')}
			</span>
		),
		sort: 'username',
		colStyle: { width: '15%' },
		render: ({ row }) => (
			<>
				<Link
					id={`user-${row.id}`}
					to={`/table/${row.id}`}
					state={{ from: 'table' }}
				>
					{row.username}
				</Link>
				<UncontrolledTooltip target={`user-${row.id}`}>
					{row.id}
				</UncontrolledTooltip>
			</>
		),
	},
	{
		title: (
			<span>
				<i className="bi bi-envelope me-1" />
				{t('Training|Email')}
			</span>
		),
		sort: 'email',
		colStyle: { width: '20%' },
		render: ({ row }) => <span>{row.email}</span>,
	},
	{
		title: (
			<span>
				<i className="bi bi-geo-alt me-1" />
				{t('Training|Address')}
			</span>
		),
		sort: 'address',
		colStyle: { width: '25%' },
		render: ({ row }) => <span className="address-cell">{row.address}</span>,
	},
	{
		title: (
			<span>
				<i className="bi bi-calendar-plus me-1" />
				{t('Training|Created')}
			</span>
		),
		sort: 'created',
		colStyle: { width: '20%' },
		render: ({ row }) => <DateTime value={row.created} />,
	},
	{
		title: (
			<span>
				<i className="bi bi-box-arrow-in-right me-1" />
				{t('Training|Last sign in')}
			</span>
		),
		sort: 'last_sign_in',
		colStyle: { width: '20%' },
		render: ({ row }) => <DateTime value={row.last_sign_in} />,
	},
];

const loader = async ({ params }) => {
	const response = await fetch(`${DATA_URL}?${new URLSearchParams(params)}`);
	if (!response.ok) {
		throw new Error(`Data fetch failed with status ${response.status}`);
	}
	const json = await response.json();
	return { count: json.count, rows: json.data };
};

export function TableScreen(props) {
	const { t } = useTranslation();
	const columns = getColumns(t);
	return (
		<Container className="h-100">
			<DataTableCard2
				columns={columns}
				initialLimit={20}
				loader={loader}
				header={
					<div>
						<h5 className="mb-0">
							<i className="bi bi-table me-2" />
							{t('Training|Users')}
						</h5>
					</div>
				}
			/>
		</Container>
	);
}
