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

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: string;
}

interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface ChartOptions {
  columns: {
    value: string;
    label: string;
    type: string;
    prefix?: string;
    suffix?: string;
    operators: string[];
    aggregationMethods?: string[];
    values?: string[];
  }[];
  timeRanges: { value: string; label: string; }[];
  chartTypes: { value: string; label: string; icon: string; }[];
  operators: { value: string; label: string; }[];
  aggregationMethods: { value: string; label: string; }[];
}

const COLUMNS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'industry', label: 'Industry' },
  { value: 'users', label: 'Active Users' },
  { value: 'growth', label: 'Growth Rate' },
];

const OPERATORS = [
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
];

interface ChartConfig {
  filters: Filter[];
  displayField: string;
  timeRange: string;
  aggregationMethod: string;
  chartType: ChartType;
}

export default function Home() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [displayField, setDisplayField] = useState('revenue');
  const [timeRange, setTimeRange] = useState('monthly');
  const [aggregationMethod, setAggregationMethod] = useState('sum');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [newFilter, setNewFilter] = useState<Filter>({
    id: '',
    column: 'revenue',
    operator: '>',
    value: '',
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      setChartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchChartData({
      filters: [],
      displayField,
      timeRange,
      aggregationMethod,
      chartType,
    });
  }, []);

  useEffect(() => {
    // Fetch chart options
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/chart-options');
        if (!response.ok) {
          throw new Error('Failed to fetch chart options');
        }
        const options = await response.json();
        setChartOptions(options);
        
        // Set initial values based on first available options
        if (options.columns.length > 0) {
          setDisplayField(options.columns[0].value);
        }
        if (options.timeRanges.length > 0) {
          setTimeRange(options.timeRanges[0].value);
        }
        if (options.aggregationMethods.length > 0) {
          setAggregationMethod(options.aggregationMethods[0].value);
        }
      } catch (err) {
        console.error('Failed to fetch chart options:', err);
      }
    };

    fetchOptions();
  }, []);

  const handleUpdateChart = () => {
    fetchChartData({
      filters,
      displayField,
      timeRange,
      aggregationMethod,
      chartType,
    });
  };

  const handleAddFilter = () => {
    if (!newFilter.value.trim()) return;
    
    setFilters([
      ...filters,
      {
        ...newFilter,
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
    
    setNewFilter({
      id: '',
      column: 'revenue',
      operator: '>',
      value: '',
    });
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(filter => filter.id !== id));
  };

  const handleResetFilters = () => {
    setFilters([]);
    setNewFilter({
      id: '',
      column: 'revenue',
      operator: '>',
      value: '',
    });
  };

  const renderChart = () => {
    if (!chartData) return null;

    const ChartComponent = {
      line: Line,
      bar: Bar,
      pie: Pie
    }[chartType];

    return <ChartComponent data={chartData} />;
  };

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '$1.2M',
      change: '+12.5% from last month',
      icon: '$'
    },
    {
      title: 'Active Users',
      value: '45,678',
      change: '+8.3% from last month',
      icon: '👥'
    },
    {
      title: 'Growth Rate',
      value: '23.4%',
      change: '+2.1% from last month',
      icon: '📈'
    }
  ];

  if (error) return <div>Error: {error}</div>;
  if (!chartData) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <button 
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors duration-200"
            >
              Reset All
            </button>
          </div>

          {/* Filter Builder */}
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={newFilter.column}
              onChange={(e) => {
                const column = chartOptions?.columns.find(c => c.value === e.target.value);
                setNewFilter({
                  ...newFilter,
                  column: e.target.value,
                  operator: column?.operators[0] || '>'
                });
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {chartOptions?.columns.map((column) => (
                <option key={column.value} value={column.value}>
                  {column.label}
                </option>
              ))}
            </select>

            <select
              value={newFilter.operator}
              onChange={(e) => setNewFilter({ ...newFilter, operator: e.target.value })}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {chartOptions?.columns
                .find(c => c.value === newFilter.column)
                ?.operators.map(op => {
                  const operator = chartOptions.operators.find(o => o.value === op);
                  return (
                    <option key={op} value={op}>
                      {operator?.label || op}
                    </option>
                  );
                })}
            </select>

            {chartOptions?.columns.find(c => c.value === newFilter.column)?.values ? (
              <select
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a value</option>
                {chartOptions.columns
                  .find(c => c.value === newFilter.column)
                  ?.values?.map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                placeholder="Value"
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}

            <button
              onClick={handleAddFilter}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Filter
            </button>
          </div>

          {/* Active Filters */}
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className="group px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2 transition-all duration-200 hover:bg-blue-100"
              >
                <span className="font-medium">
                  {chartOptions?.columns.find(c => c.value === filter.column)?.label}{' '}
                  <span className="text-blue-500">
                    {chartOptions?.operators.find(o => o.value === filter.operator)?.label}{' '}
                  </span>
                  {filter.value}
                </span>
                <button
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="text-blue-400 hover:text-blue-600 transition-colors duration-200"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 transition-all duration-200 hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Chart Configuration</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Field</label>
              <select 
                value={displayField}
                onChange={(e) => setDisplayField(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {chartOptions?.columns.map((column) => (
                  <option key={column.value} value={column.value}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aggregate By</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {chartOptions?.timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
            <div className="flex gap-3">
              {chartOptions?.chartTypes.map((type) => (
                <button 
                  key={type.value}
                  onClick={() => setChartType(type.value as ChartType)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    chartType === type.value 
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleUpdateChart}
            disabled={loading}
            className={`
              w-full py-3 px-4 rounded-lg
              inline-flex items-center justify-center
              text-sm font-medium transition-all duration-200
              ${loading 
                ? 'bg-blue-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              } text-white
            `}
          >
            {loading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </>
            ) : (
              'Update Chart'
            )}
          </button>
        </div>

        {/* Chart Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 min-h-[400px] transition-all duration-200 hover:shadow-md">
          {renderChart()}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600 font-medium">{metric.title}</span>
                <span className="text-2xl bg-blue-50 text-blue-600 p-2 rounded-lg">{metric.icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-2">{metric.value}</div>
              <div className="text-sm text-green-600 font-medium">{metric.change}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
