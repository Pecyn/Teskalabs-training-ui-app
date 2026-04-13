import React from 'react';
import { Container } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DataTableCard2, DateTime } from 'asab_webui_components';
import './TableScreen.scss';

const DATA_URL = 'https://devtest.teskalabs.com/data';
const getColumns = (t) => [
	{
		title: t('Training|Username'),
		sort: 'username',
		colStyle: { width: '15%' },
		render: ({ row }) => (
			<Link title={row.id} to={`/table/${row.id}`} state={{ from: 'table' }}>
				{row.username}
			</Link>
		),
	},
	{
		title: t('Training|Email'),
		sort: 'email',
		colStyle: { width: '20%' },
		render: ({ row }) => <span>{row.email}</span>,
	},
	{
		title: t('Training|Address'),
		sort: 'address',
		colStyle: { width: '25%' },
		render: ({ row }) => <span className="address-cell">{row.address}</span>,
	},
	{
		title: t('Training|Created'),
		sort: 'created',
		colStyle: { width: '20%' },
		render: ({ row }) => <DateTime value={row.created} />,
	},
	{
		title: t('Training|Last sign in'),
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
				// rowHeight={38}
				loader={loader}
				header={
					<div>
						<h5 className="mb-0">
							<i className="bi bi-table me-2" />
							{t('Training|Users table')}
						</h5>
					</div>
				}
			/>
		</Container>
	);
}
