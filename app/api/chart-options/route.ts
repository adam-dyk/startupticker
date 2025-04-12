import { NextResponse } from 'next/server';

const chartOptions = {
  filterColumns: [
    { 
      value: 'title',
      label: 'Company Name'
    },
    { 
      value: 'canton',
      label: 'Canton',
    },
    { 
      value: 'city',
      label: 'City',
    },
    { 
      value: 'gender_ceo',
      label: 'Gender of CEO'
    },
    {
      value: 'industry',
      label: 'Sector'
    }
  ],
  chartTypes: [
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' }
  ],
  valueColumns: [
    { value: 'funds_raised', label: 'Funds Raised' },
    { value: 'total_monies', label: 'Total Monies' },
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