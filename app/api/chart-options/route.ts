import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://ticker:password@localhost:5432/ticker'
});


export async function GET() {
  console.log('Fetching chart options');
  
  const chartOptions = {
    filterColumns: [
      { 
        value: 'title',
        label: 'Company Name',
        options: []
      },
      { 
        value: 'canton',
        label: 'Canton',
        options: []
      },
      { 
        value: 'city',
        label: 'City',
        options: []
      },
      { 
        value: 'gender_ceo',
        label: 'Gender of CEO',
        options: []
      },
      {
        value: 'industry',
        label: 'Sector',
        options: []
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

  for (const filter of chartOptions.filterColumns) {
    const result = await pool.query(`SELECT DISTINCT ${filter.value} as column_value FROM swiss.companies WHERE ${filter.value} IS NOT NULL ORDER BY ${filter.value}`);
    filter.options = result.rows.map(row => row.column_value);
  }

  return NextResponse.json(chartOptions);
} 