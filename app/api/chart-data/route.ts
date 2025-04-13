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
  chartType: string;
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
  groupByField,
  chartType
}: FilterParams): Promise<ChartData> {
  const chartQueryMap: Record<string, string> = {
    pie: './queries/pie_chart.sql',
    line: './queries/line_chart.sql',
    bar: './queries/line_chart.sql',
  };

  const rawSql = readFileSync(chartQueryMap[chartType] || chartQueryMap.line, 'utf-8');
  const selectedYear = '2024';

  const finalSql = rawSql
    .replaceAll('{{COMPANIES_FILTER}}', filterSQL)
    .replaceAll('{{AGGREGATE_FUNCTION}}', aggregationFn)
    .replaceAll('{{AGGREGATE_FIELD}}', aggregateField)
    .replaceAll('{{GROUP_BY_FIELD}}', groupByField)
    .replaceAll('{{FILTER_VAULE}}', filterValue)
    .replaceAll('{{YEAR}}', selectedYear);

  console.log(finalSql);

  const result = await pool.query(finalSql);

  if (chartType === 'pie') {
    const labels: string[] = [];
    const data: number[] = [];

    for (const row of result.rows) {
      const label = row.group_label
        ? `${row.group_by_label} (${row.group_label})`
        : `${row.group_by_label}`;

      labels.push(label);
      data.push(Number(row.aggregate_label));
    }

    return {
      labels,
      datasets: [
        {
          label: '',
          data,
          backgroundColor: labels.map(() => getRandomColor()),
          borderColor: labels.map(() => 'rgba(255, 255, 255, 1)'),
          borderWidth: 1
        }
      ]
    };
  }

  // Time series format (line/bar)
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
    data: labels.map(year => yearlyData[year] ?? 0),
    borderColor: getRandomColor(),
    backgroundColor: getRandomColor().replace('rgb', 'rgba').replace(')', ', 0.2)'),
    tension: 0.3,
    fill: true
  }));

  return { labels, datasets };
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
    const chartType = body.chartType
    console.log("aggregationFn", aggregationFn);

    const data = await generateChartData({ filterValue, filterSQL, aggregationFn, aggregateField, groupByField, chartType });
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
    groupByField: 'c.industry',
    chartType: 'line_chart'
  };

  const filterSQL = buildFilterSQL(config.filters);
  const filterValue = buildValueString(config.filters);
  const groupByField = config.groupByField.toString() 
  const chartType  = config.chartType
  const aggregateField = config.aggregationField
  const aggregationFn = config.aggregationFn;

  const data = await generateChartData({ filterValue, filterSQL, aggregationFn, aggregateField, groupByField, chartType });
  return NextResponse.json(data);
}
