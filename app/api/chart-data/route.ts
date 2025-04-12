import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://ticker:password@localhost:5432/ticker'
});

export interface Filter {
  column: string;
  values: string[];
}

export interface ChartConfig {
  filters: Filter[];
  aggregateField: string;
  aggregationFn: string;
  groupByField: string;
}

interface FilterParams {
  filterSQL: string;
  aggregationFn: 'SUM' | 'AVG' | 'MAX' | 'MIN';
}

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

// === Helpers ===
function buildFilterSQL(filters: Filter[]): string {
  if (!filters || filters.length === 0) return '';

  let filterSQL = '';

  filters.forEach((filter, index) => {
    const clause = `${filter.column} IN (${filter.values
      .map(v => `'${v.replace(/'/g, "''")}'`)
      .join(', ')})`;

    filterSQL += index === 0 ? `WHERE ${clause} ` : `AND ${clause} `;
  });

  return filterSQL.trim();
}
// === Helpers ===
function buildValueString(filters: Filter[]): string {
  if (!filters || filters.length === 0) return '';

  const filterString = filters
    .map(filter => `${filter.values.join('')}`)
    .join(' - ');

  return filterString.trim();
}

function getRandomColor(): string {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

export async function generateChartData({
  filterValue,
  filterSQL,
  aggregationFn,
  aggregateField,
  groupByField
}: FilterParams): Promise<ChartData> {
  // const rawSql = readFileSync('./queries/invested_capital_by_sector.sql', 'utf-8');
  const rawSql = readFileSync('./queries/general.sql', 'utf-8');
  const finalSql = rawSql
    .replaceAll('{{FILTER_VAULE}}', filterValue)
    .replaceAll('{{COMPANIES_FILTER}}', filterSQL)
    .replaceAll('{{AGGREGATE_FUNCTION}}', aggregationFn)
    .replaceAll('{{AGGREGATE_FIELD}}', aggregateField)
    .replaceAll('{{GROUP_BY_FIELD}}', groupByField);

  console.log(finalSql);

  const result = await pool.query(finalSql);

  const grouped: Record<string, { [year: string]: number }> = {};
  const yearSet: Set<string> = new Set();

  for (const row of result.rows) {
    const year = row.year.toString();
    const label = row.group_label
      ? `${row.group_by_label} (${row.group_label})`
      : `${row.group_by_label}`;
    yearSet.add(year);
    grouped[label] ??= {};
    grouped[label][year] = Number(row.aggregate_label);
  }

  const labels = [...yearSet].sort();
  const datasets = Object.entries(grouped).map(([label, yearlyData]) => ({
    label,
    data: labels.map(year => yearlyData[year] ?? 0)
  }));

  return {
    labels,
    datasets: datasets.map(ds => {
      const color = getRandomColor();
      return {
        ...ds,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.3
      };
    })
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("body", body);

    const filterSQL = buildFilterSQL(body.filters);
    const aggregationFn = body.aggregationFn;
    const filterValue = buildValueString(body.filters);
    const aggregateField = body.aggregationField
    const groupByField = body.groupByField.toString()
    console.log("aggregationFn", aggregationFn);

    const data = await generateChartData({ filterValue, filterSQL, aggregationFn, aggregateField, groupByField });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/chart-data:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
}

export async function GET() {
  const defaultConfig: ChartConfig = {
    filters: [
      {
        column: 'gender_ceo',
        values: ['Female']
      }
    ],
    aggregateField: 'd.amount',
    aggregationFn: 'SUM',
    groupByField: 'c.industry'
  };

  const filterSQL = buildFilterSQL(config.filters);
  const filterValue = buildValueString(config.filters);
  const groupByField = config.groupByField.toString() 
  const aggregateField = config.aggregationField
  const aggregationFn = config.aggregationFn;

  const data = await generateChartData({ filterValue, filterSQL, aggregationFn, aggregateField, groupByField });
  return NextResponse.json(data);
}
