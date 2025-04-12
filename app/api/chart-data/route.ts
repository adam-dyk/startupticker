import { NextResponse } from 'next/server';

interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface ChartConfig {
  filters: Filter[];
  displayField: string;
  timeRange: string;
  aggregationMethod: string;
  chartType: string;
}

// Mock data generator based on configuration
function generateChartData(config: ChartConfig) {
  const timeRangeLabels = {
    daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    yearly: ['2020', '2021', '2022', '2023', '2024'],
  };

  const labels = timeRangeLabels[config.timeRange as keyof typeof timeRangeLabels] || timeRangeLabels.monthly;

  // Generate mock data based on display field
  const generateDataset = (field: string) => {
    switch (field) {
      case 'revenue':
        return labels.map(() => Math.floor(Math.random() * 1000000) + 500000);
      case 'users':
        return labels.map(() => Math.floor(Math.random() * 20000) + 30000);
      case 'growth':
        return labels.map(() => Math.floor(Math.random() * 30) + 10);
      default:
        return labels.map(() => Math.floor(Math.random() * 100));
    }
  };

  // Apply filters (mock implementation)
  const applyFilters = (data: number[]) => {
    return data.map(value => {
      let filtered = value;
      config.filters.forEach(filter => {
        if (filter.column === config.displayField) {
          const filterValue = parseFloat(filter.value);
          if (!isNaN(filterValue)) {
            switch (filter.operator) {
              case '>':
                filtered = value > filterValue ? value : 0;
                break;
              case '<':
                filtered = value < filterValue ? value : 0;
                break;
              case '=':
                filtered = value === filterValue ? value : 0;
                break;
              case '!=':
                filtered = value !== filterValue ? value : 0;
                break;
            }
          }
        }
      });
      return filtered;
    });
  };

  const data = generateDataset(config.displayField);
  const filteredData = applyFilters(data);

  return {
    labels,
    datasets: [
      {
        label: config.displayField.charAt(0).toUpperCase() + config.displayField.slice(1),
        data: filteredData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
      }
    ],
  };
}

export async function POST(request: Request) {
  try {
    const config: ChartConfig = await request.json();
    
    // Log detailed chart configuration
    console.log('=== Chart Configuration ===');
    console.log('Display Field:', config.displayField);
    console.log('Time Range:', config.timeRange);
    console.log('Aggregation Method:', config.aggregationMethod);
    console.log('Chart Type:', config.chartType);
    console.log('Filters:', JSON.stringify(config.filters, null, 2));
    console.log('========================');

    const data = generateChartData(config);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing chart configuration:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 400 }
    );
  }
}

// Keep the GET method for initial data
export async function GET() {
  const defaultConfig: ChartConfig = {
    filters: [],
    displayField: 'revenue',
    timeRange: 'monthly',
    aggregationMethod: 'sum',
    chartType: 'line',
  };

  // Log default configuration
  console.log('=== Default Chart Configuration ===');
  console.log('Display Field:', defaultConfig.displayField);
  console.log('Time Range:', defaultConfig.timeRange);
  console.log('Aggregation Method:', defaultConfig.aggregationMethod);
  console.log('Chart Type:', defaultConfig.chartType);
  console.log('Filters:', JSON.stringify(defaultConfig.filters, null, 2));
  console.log('================================');

  const data = generateChartData(defaultConfig);
  return NextResponse.json(data);
} 