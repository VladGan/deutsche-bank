import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CountriesApp from '../CountriesApp';

// Mock data
const mockCountriesData = [
  {
    name: { common: 'France', official: 'French Republic' },
    cca3: 'FRA',
    capital: ['Paris'],
    region: 'Europe',
    subregion: 'Western Europe',
    population: 67391582,
    area: 551695,
    languages: { fra: 'French' },
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    flags: { svg: 'france-flag.svg', alt: 'Flag of France' },
    timezones: ['UTC+01:00'],
    maps: { googleMaps: 'https://maps.google.com/france' }
  },
  {
    name: { common: 'Japan', official: 'Japan' },
    cca3: 'JPN',
    capital: ['Tokyo'],
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: 125836021,
    area: 377975,
    languages: { jpn: 'Japanese' },
    currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } },
    flags: { svg: 'japan-flag.svg', alt: 'Flag of Japan' },
    timezones: ['UTC+09:00'],
    maps: { googleMaps: 'https://maps.google.com/japan' }
  },
  {
    name: { common: 'Ukraine', official: 'Japan' },
    cca3: 'JPN',
    capital: ['Tokyo'],
    region: 'Asia',
    subregion: 'Eastern Asia',
    population: 125836021,
    area: 377975,
    languages: { jpn: 'Japanese' },
    currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } },
    flags: { svg: 'japan-flag.svg', alt: 'Flag of Japan' },
    timezones: ['UTC+09:00'],
    maps: { googleMaps: 'https://maps.google.com/japan' }
  }
];

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockCountriesData),
  })
) as jest.Mock;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CountriesApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });
  afterEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCountriesData),
      })
    ) as jest.Mock;
  });

  it('renders loading state initially', () => {
    render(<CountriesApp />);
    expect(screen.getByText(/loading countries/i)).toBeInTheDocument();
  });

  it('renders countries data after loading', async () => {
    render(<CountriesApp />);

    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('Japan')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<CountriesApp />);

    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search countries/i);
    await userEvent.type(searchInput, 'japan');

    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.queryByText('France')).not.toBeInTheDocument();
  });

  it('handles search type changes', async () => {
    render(<CountriesApp />);

    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
    });

    // Change search type to 'Name'
    const searchTypeSelect = screen.getAllByRole('combobox');
    await userEvent.click(searchTypeSelect[0]);
    const nameOption = screen.getByText('Name');
    await userEvent.click(nameOption);

    // Search for Ukraine
    const searchInput = screen.getByPlaceholderText(/search countries/i);
    await userEvent.type(searchInput, 'ukraine');

    expect(screen.getByText('Ukraine')).toBeInTheDocument();
  });

  it('handles API error state', async () => {
    // Mock API error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    ) as jest.Mock;

    render(<CountriesApp />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('handles sorting by population', async () => {
    render(<CountriesApp />);

    await waitFor(() => {
      expect(screen.getByText('France')).toBeInTheDocument();
    });

    // Click population header to sort
    const populationHeader = screen.getByRole('columnheader', { name: /population/i });
    await userEvent.click(populationHeader);

    const rows = screen.getAllByRole('row');
    const firstRowCells = within(rows[2]).getAllByRole('gridcell');
    expect(firstRowCells[2]).toContain(screen.getByText('Japan'));
  });
});