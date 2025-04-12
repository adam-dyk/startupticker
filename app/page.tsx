"use client";

import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useState, useEffect } from 'react';
import { ChartConfig, Filter } from './api/chart-data/route';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
  }[];
}

type ChartType = 'line' | 'bar' | 'pie';

interface ChartOptions {
  filterColumns: {
    value: string;
    label: string;
    options: string[];
  }[];
  chartTypes: { value: string; label: string; icon: string; }[];
  valueColumns: { value: string; label: string; }[];
  aggregationColumns: { value: string; label: string; }[];
}

export default function Home() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [valueColumn, setValueColumn] = useState('revenue');
  const [aggregationColumn, setAggregationColumn] = useState('sum');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [newFilter, setNewFilter] = useState<Filter>({
    column: 'revenue',
    values: [],
  });
  const [chartOptions, setChartOptions] = useState<ChartOptions | null>(null);

  const fetchChartData = async (config: ChartConfig) => {
    try {
      setLoading(true);
      const response = await fetch('/api/chart-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData({ filters: [], valueColumn, aggregationColumn });
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/chart-options');
        if (!response.ok) throw new Error('Failed to fetch chart options');
        const options = await response.json();
        setChartOptions(options);

        
        // Set initial values based on first available options
        if (options.filterColumns.length > 0) {
          setValueColumn(options.filterColumns[0].value);
        }
        if (options.aggregationColumns.length > 0) {
          setAggregationColumn(options.aggregationColumns[0].value);
        }
      } catch (err) {
        console.error('Failed to fetch chart options:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleUpdateChart = () => {
    fetchChartData({ filters, valueColumn, aggregationColumn });
  };

  const handleAddFilter = () => {
    if (newFilter.values.length === 0) return;
    setFilters([...filters, newFilter]);
    setNewFilter({ column: 'revenue', values: [] });
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleResetFilters = () => {
    setFilters([]);
    setNewFilter({ column: 'revenue', values: [] });
  };

  const chartOptionsConfig = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Capital Invested Over Time', // ← your chart title
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#111827', // Tailwind's gray-900
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      legend: {
        position: 'right',
        labels: {
          color: '#374151', // Tailwind's gray-700
          font: {
            size: 12,
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#374151',
        },
        ticks: {
          color: '#4B5563',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Capital Invested (CHF)',
          font: {
            size: 14,
            weight: 'bold',
          },
          color: '#374151',
        },
        ticks: {
          color: '#4B5563',
        },
      },
    },
  };

  const COLOR_PALETTE = [
    '#3281d1', // ZH (blue)
    '#ffeb54', // VD (yellow)
    '#7ac93a', // GE (green)
    '#e88d2c', // ZG (orange-brown)
    '#997c4c', // BS (brown)
    '#c1c0b4', // Other (light gray)
    '#8bbdef', // Light blue
    '#7c5a1d', // Dark brown
  ];

  const coloredData = chartData
    ? {
        ...chartData,
        datasets: chartData.datasets.map((dataset, index) => {
          const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
          return {
            ...dataset,
            backgroundColor: color + 'CC', // ~80% opacity
            borderColor: color,
            fill: true,
            tension: 0.3,
          };
        }),
      }
    : null;

  const renderChart = () => {
    if (!coloredData) return null;

    const ChartComponent = {
      line: Line,
      bar: Bar,
      pie: Pie,
    }[chartType];

    return <ChartComponent data={coloredData} options={chartOptionsConfig} />;
  };

  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <img
        src="/logo.png"
        alt="Your Logo"
        className="h-42 w-auto"
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <section className="border border-gray-200 rounded-sm bg-white p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-800">Filters</h2>
            <button onClick={handleResetFilters} className="px-3 py-1 border border-gray-300 rounded-sm text-sm text-gray-700 bg-white hover:bg-gray-50">Reset All</button>
          </div>

          {/* Filter Builder */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={newFilter.column}
              onChange={(e) => setNewFilter({ ...newFilter, column: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-sm text-sm text-gray-700"
            >
              {chartOptions?.filterColumns.map((column) => (
                <option key={column.value} value={column.value}>
                  {column.label}
                </option>

              ))}
            </select>

            <div className="flex-1 flex flex-wrap gap-2">
              {newFilter.values.map((value, index) => (
                <div key={index} className="flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                  <span className="text-sm text-red-700 font-medium">{value}</span>
                  <button
                    onClick={() => setNewFilter({ ...newFilter, values: newFilter.values.filter((_, i) => i !== index) })}
                    className="text-red-400 hover:text-red-600"
                  >×</button>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add value..."
                className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setNewFilter({ ...newFilter, values: [...newFilter.values, e.currentTarget.value.trim()] });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>

            <button onClick={handleAddFilter} className="px-4 py-2 bg-red-600 text-white text-sm rounded-sm hover:bg-red-700 transition">Add Filter</button>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
                <span className="text-sm text-red-700">
                  <span className="font-medium">{chartOptions?.filterColumns.find(c => c.value === filter.column)?.label}</span>
                  <span className="text-red-500 mx-1">:</span>

                  <span className="font-medium">{filter.values.join(', ')}</span>
                </span>
                <button onClick={() => handleRemoveFilter(index)} className="text-red-400 hover:text-red-600">×</button>
              </div>
            ))}
          </div>
        </section>

        {/* Chart Configuration */}
        <section className="border border-gray-200 rounded-sm bg-white p-5 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Chart Configuration</h2>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Field</label>
              <select
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm text-sm text-gray-700"
              >
                {chartOptions?.valueColumns.map((column) => (
                  <option key={column.value} value={column.value}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aggregate By</label>
              <select
                value={aggregationColumn}
                onChange={(e) => setAggregationColumn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm text-sm text-gray-700"
              >
                {chartOptions?.aggregationColumns.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
            <div className="flex gap-3">
              {chartOptions?.chartTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setChartType(type.value as ChartType)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-sm border transition-all duration-150 ${chartType === type.value ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                >
                  <span>{type.icon}</span>{type.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleUpdateChart}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-sm text-sm font-medium text-white transition-all duration-200 ${loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              'Update Chart'
            )}
          </button>
        </section>

        {/* Chart Area */}
        <section className="border border-gray-200 rounded-sm bg-white p-5 shadow-sm min-h-[400px]">
          {renderChart()}
        </section>
      </main>
    </div>
  );
}
