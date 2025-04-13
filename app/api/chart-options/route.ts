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
      { value: 'd.amount', label: 'Capital Invested (CHF)' },
    ],
    aggregationFields: [
      { value: 'd.amount', label: 'Capital Invested (CHF)' },
      { value: 'd.valuation', label: 'Valuation (CHF)' },
      { value: 'd.date_of_the_funding_round', label: 'Funding Rounds' },
    ],
    aggregationFns: [
      { value: 'SUM', label: 'Sum' },
      { value: 'AVG', label: 'Average' },
      { value: 'COUNT', label: 'Count' },
      { value: 'MAX', label: 'Maximum' },
      { value: 'MIN', label: 'Minimum' },
    ],
    groupByFields: [
      { value: 'c.industry', label: 'Industry' },
      { value: 'd.phase', label: 'Phase' },
      { value: 'c.gender_ceo', label: 'CEO Gender' },
    ]
  };

  for (const filter of chartOptions.filterColumns) {
    const result = await pool.query(`SELECT DISTINCT ${filter.value} as column_value FROM swiss.companies WHERE ${filter.value} IS NOT NULL ORDER BY ${filter.value}`);
    filter.options = result.rows.map(row => row.column_value);
  }

  return NextResponse.json(chartOptions);
} 