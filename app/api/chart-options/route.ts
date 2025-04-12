import { NextResponse } from 'next/server';

const chartOptions = {
  columns: [
    { 
      value: 'revenue',
      label: 'Revenue'
    },
    { 
      value: 'industry',
      label: 'Industry',
    },
    { 
      value: 'users',
      label: 'Active Users',
    },
    { 
      value: 'growth',
      label: 'Growth Rate'
    }
  ],
  chartTypes: [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ],
  aggregationColumns: [
    { value: 'company', label: 'Company' },
    { value: 'county', label: 'County' },
    { value: 'region', label: 'Region' },
  ]
};

export async function GET() {
  console.log('Fetching chart options');
  return NextResponse.json(chartOptions);
} 