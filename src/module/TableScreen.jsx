import React from 'react';
import { Container } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { DataTableCard2, DateTime } from 'asab_webui_components';

const DATA_URL = 'https://devtest.teskalabs.com/data';
const COLUMNS = [
  {
    title: 'Username',
    sort: 'username',
    render: ({ row }) => <span title={row.id}>{row.username}</span>,
  },
  {
    title: 'Email',
    sort: 'email',
    render: ({ row }) => <span>{row.email}</span>,
  },
  {
    title: 'Address',
    sort: 'address',
    render: ({ row }) => <span>{row.address}</span>,
  },
  {
    title: 'Created',
    sort: 'created',
    render: ({ row }) => <DateTime value={row.created} />,
  },
  {
    title: 'Last sign in',
    sort: 'last_sign_in',
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
  return (
    <Container className="h-100">
      <DataTableCard2 columns={COLUMNS} loader={loader} />
    </Container>
  );
}
