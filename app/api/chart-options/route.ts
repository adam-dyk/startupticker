import { NextResponse } from 'next/server';

const chartOptions = {
  columns: [
    { 
      value: 'revenue',
      label: 'Revenue',
      type: 'number',
      prefix: '$',
      operators: ['>', '<', '=', '!='],
      aggregationMethods: ['sum', 'average', 'max', 'min']
    },
    { 
      value: 'industry',
      label: 'Industry',
      type: 'string',
      operators: ['=', '!=', 'contains', 'starts_with'],
      values: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing']
    },
    { 
      value: 'users',
      label: 'Active Users',
      type: 'number',
      operators: ['>', '<', '=', '!='],
      aggregationMethods: ['sum', 'average', 'max', 'min']
    },
    { 
      value: 'growth',
      label: 'Growth Rate',
      type: 'number',
      suffix: '%',
      operators: ['>', '<', '=', '!='],
      aggregationMethods: ['average', 'max', 'min']
    }
  ],
  timeRanges: [
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ],
  chartTypes: [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ],
  operators: [
    { value: '>', label: 'Greater than' },
    { value: '<', label: 'Less than' },
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts with' }
  ],
  aggregationMethods: [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'max', label: 'Maximum' },
    { value: 'min', label: 'Minimum' }
  ]
};

export async function GET() {
  console.log('Fetching chart options');
  return NextResponse.json(chartOptions);
} 