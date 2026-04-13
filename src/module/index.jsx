import React from 'react';
import { Navigate } from 'react-router';
import { Module } from 'asab_webui_components';

import { TableScreen } from './TableScreen.jsx';
import { DetailScreen } from './DetailScreen.jsx';

export default class TableApplicationModule extends Module {
	constructor(app, name) {
		super(app, 'TableApplicationModule');

		app.Router.addRoute({
			path: '/',
			component: () =>
				React.createElement(Navigate, { to: '/table', replace: true }),
		});

		app.Router.addRoute({
			path: '/table',
			name: 'Table',
			component: TableScreen,
		});

		app.Router.addRoute({
			path: '/table/:id',
			name: 'Detail',
			component: DetailScreen,
		});

		app.Navigation.addItem({
			name: 'Table',
			icon: 'bi bi-table',
			url: '/table',
		});
	}
}
