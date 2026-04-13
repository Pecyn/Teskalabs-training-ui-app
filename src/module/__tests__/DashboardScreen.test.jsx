import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { DashboardScreen, DashboardView } from '../DashboardScreen';

// Module mocks
jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('asab_webui_components', () => ({
	DateTime: ({ value }) => <span>{String(value)}</span>,
}));

jest.mock('recharts', () => ({
	BarChart: ({ children }) => <div>{children}</div>,
	Bar: () => null,
	LineChart: ({ children }) => <div>{children}</div>,
	Line: () => null,
	XAxis: () => null,
	YAxis: () => null,
	CartesianGrid: () => null,
	Tooltip: () => null,
	Legend: () => null,
	ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

jest.mock('reactstrap', () => ({
	Container: ({ children }) => <div>{children}</div>,
	Row: ({ children }) => <div>{children}</div>,
	Col: ({ children }) => <div>{children}</div>,
	Card: ({ children, ...p }) => <div {...p}>{children}</div>,
	CardHeader: ({ children }) => <div>{children}</div>,
	CardBody: ({ children, ...p }) => <div {...p}>{children}</div>,
}));

// Test data
const mockUsers = [
	{ id: '1', username: 'alice', created: 1700000000, last_sign_in: 1702000000 },
	{ id: '2', username: 'bob', created: 1690000000, last_sign_in: 1699000000 },
];

beforeEach(() => {
	jest.clearAllMocks();
});

// DashboardSkeleton unit tests
describe('DashboardView', () => {
	test('shows placeholder-glow and all card titles when loading', () => {
		const { container } = render(<DashboardView loading />);

		expect(container.querySelector('.placeholder-glow')).toBeInTheDocument();
		expect(screen.getByText('Training|Total users')).toBeInTheDocument();
		expect(screen.getByText('Training|Newest user')).toBeInTheDocument();
		expect(
			screen.getByText('Training|Most recently active'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Registrations per month'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Last activity by month'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Longest inactive users'),
		).toBeInTheDocument();
	});

	test('shows placeholder spans but no real user data when loading', () => {
		const { container } = render(<DashboardView loading />);

		expect(
			container.querySelector('.placeholder.bg-secondary'),
		).toBeInTheDocument();
		expect(screen.queryByText('alice')).not.toBeInTheDocument();
	});

	test('renders real data and no placeholder-glow when users are provided', () => {
		const { container } = render(<DashboardView users={mockUsers} />);

		expect(
			container.querySelector('.placeholder-glow'),
		).not.toBeInTheDocument();
		// Total users count
		expect(screen.getByText('2')).toBeInTheDocument();
		// alice: highest created (newest) + highest last_sign_in (most recent active)
		expect(screen.getAllByText('alice')).not.toHaveLength(0);
		// bob: in the inactive users table (least recent active)
		expect(screen.getByText('bob')).toBeInTheDocument();
	});

	test('shows all six card titles with real data', () => {
		render(<DashboardView users={mockUsers} />);

		expect(screen.getByText('Training|Total users')).toBeInTheDocument();
		expect(screen.getByText('Training|Newest user')).toBeInTheDocument();
		expect(
			screen.getByText('Training|Most recently active'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Registrations per month'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Last activity by month'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Training|Longest inactive users'),
		).toBeInTheDocument();
	});
});

// DashboardScreen integration tests
// React 19 + Suspense emits a console.error about un-awaited act() when a
// promise never resolves. The behaviour under test is correct; suppress the noise.
describe('DashboardScreen', () => {
	let consoleErrorSpy;
	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
			if (typeof args[0] === 'string' && args[0].includes('`act` scope')) return;
			console.error(...args);
		});
	});
	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	test('shows loading skeleton (Suspense fallback) while fetch is pending', () => {
		global.fetch = jest.fn(() => new Promise(() => {})); // never resolves

		const { container } = render(<DashboardScreen />);

		expect(container.querySelector('.placeholder-glow')).toBeInTheDocument();
		// Card titles are always visible — even in the fallback
		expect(screen.getByText('Training|Total users')).toBeInTheDocument();
		expect(
			screen.getByText('Training|Longest inactive users'),
		).toBeInTheDocument();
	});

	test('calls the API with page 1 on mount', () => {
		global.fetch = jest.fn(() => new Promise(() => {}));

		render(<DashboardScreen />);

		expect(global.fetch).toHaveBeenCalledTimes(1);
		expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('p=1'));
	});
});
