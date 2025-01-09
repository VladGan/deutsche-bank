import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Star, StarOff, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const CountriesApp = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteCountries');
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Fetch countries data
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setCountries(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteCountries', JSON.stringify(favorites));
  }, [favorites]);

  // AG-Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'favorite',
      headerName: 'Favorite',
      width: 100,
      cellRenderer: (params) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(params.data.cca3);
          }}
        >
          {favorites.includes(params.data.cca3) ?
            <Star className="text-yellow-500" /> :
            <StarOff />
          }
        </Button>
      ),
      sortable: false,
      filter: false
    },
    {
      field: 'flag',
      headerName: 'Flag',
      width: 100,
      cellRenderer: (params) => (
        <img
          src={params.data.flags.svg}
          alt={`${params.data.name.common} flag`}
          className="w-8 h-6"
        />
      ),
      sortable: false,
      filter: false
    },
    {
      field: 'name.common',
      headerName: 'Name',
      sortable: true,
      filter: true
    },
    {
      field: 'population',
      headerName: 'Population',
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value.toLocaleString()
    },
    {
      field: 'languages',
      headerName: 'Languages',
      valueFormatter: (params) => {
        const langs = params.data.languages;
        return langs ? Object.values(langs).join(', ') : '';
      },
      sortable: true,
      filter: true
    },
    {
      field: 'currencies',
      headerName: 'Currencies',
      valueFormatter: (params) => {
        const curr = params.data.currencies;
        return curr ? Object.entries(curr).map(c => "test").join(', ') : '';
      },
      sortable: true,
      filter: true
    }
  ], [favorites]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return showOnlyFavorites ?
      countries.filter(c => favorites.includes(c.cca3)) :
      countries;

    return countries.filter(country => {
      if (showOnlyFavorites && !favorites.includes(country.cca3)) return false;

      switch (searchType) {
        case 'name':
          return country.name.common.toLowerCase().includes(searchTerm.toLowerCase());
        case 'language':
          return country.languages &&
            Object.values(country.languages)
              .some(lang => lang.toLowerCase().includes(searchTerm.toLowerCase()));
        case 'currency':
          return country.currencies &&
            Object.values(country.currencies)
              .some(curr => curr.name.toLowerCase().includes(searchTerm.toLowerCase()));
        default:
          return true;
      }
    });
  }, [countries, searchTerm, searchType, favorites, showOnlyFavorites]);

  const toggleFavorite = (countryCode) => {
    setFavorites(prev =>
      prev.includes(countryCode)
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Loading countries...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-red-500">Error: {error}</p>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Countries Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              value={searchType}
              onValueChange={setSearchType}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="language">Language</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showOnlyFavorites ? "secondary" : "outline"}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              <Star className="mr-2 h-4 w-4" />
              {showOnlyFavorites ? 'Show All' : 'Show Favorites'}
            </Button>
          </div>

          <div
            className="ag-theme-alpine w-full h-[600px]"
          >
            <AgGridReact
              rowData={filteredCountries}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              onRowClicked={(params) => setSelectedCountry(params.data)}
              defaultColDef={{
                flex: 1,
                minWidth: 100,
                resizable: true,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Country Details Dialog */}
      <Dialog
        open={!!selectedCountry}
        onOpenChange={() => setSelectedCountry(null)}
      >
        {selectedCountry && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-4">
                <img
                  src={selectedCountry.flags.svg}
                  alt={`${selectedCountry.name.common} flag`}
                  className="w-12 h-8"
                />
                {selectedCountry.name.common}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">General Information</h3>
                <p>Official Name: {selectedCountry.name.official}</p>
                <p>Capital: {selectedCountry.capital?.join(', ') || 'N/A'}</p>
                <p>Region: {selectedCountry.region}</p>
                <p>Subregion: {selectedCountry.subregion || 'N/A'}</p>
                <p>Population: {selectedCountry.population.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Additional Details</h3>
                <p>Area: {selectedCountry.area?.toLocaleString()} km²</p>
                <p>Languages: {selectedCountry.languages ?
                  Object.values(selectedCountry.languages).join(', ') :
                  'N/A'}</p>
                <p>Currencies: {selectedCountry.currencies ?
                  Object.values(selectedCountry.currencies)
                    .map(c => `${c.name} (${c.symbol})`)
                    .join(', ') :
                  'N/A'}</p>
                <p>Time Zones: {selectedCountry.timezones?.join(', ') || 'N/A'}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default CountriesApp;