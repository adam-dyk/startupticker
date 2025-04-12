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
  valueColumn: string;
  aggregationColumn: string;
}

interface FilterParams {
  filterSQL: string;
  aggregateFn: 'SUM' | 'AVG' | 'MAX' | 'MIN';
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
  const { column, values } = filters[0];
  return `WHERE ${column} in (${values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')})`;
}

function parseAggregateFn(fn: string | undefined): 'SUM' | 'AVG' {
  const upper = (fn || '').toUpperCase();
  return upper === 'AVG' ? 'AVG' : 'SUM';
}

function getRandomColor(): string {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgb(${r}, ${g}, ${b})`;
}

export async function generateChartData({
  filterSQL,
  aggregateFn
}: FilterParams): Promise<ChartData> {
  const rawSql = readFileSync('./queries/invested_capital_by_sector.sql', 'utf-8');
  const finalSql = rawSql
    .replace('{{COMPANIES_FILTER}}', filterSQL)
    .replace('{{AGGREGATE_FUNCTION}}', aggregateFn);

  const result = await pool.query(finalSql);

  const grouped: Record<string, { [year: string]: number }> = {};
  const yearSet: Set<string> = new Set();

  for (const row of result.rows) {
    const year = row.year.toString();
    const label = `${row.industry} (${row.group_label})`;
    yearSet.add(year);
    grouped[label] ??= {};
    grouped[label][year] = Number(row.total_invested_chf);
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
    let config: ChartConfig;

    // Attempt to parse body; fallback to default config if it fails or is empty
    try {
      const body = await request.json();
      config = {
        filters: body.filters?.length ? body.filters : [{
          column: 'gender_ceo',
          values: ['Female']
        }],
        valueColumn: body.valueColumn || 'amount',
        aggregationColumn: (body.aggregationColumn || 'SUM').toUpperCase()
      };
    } catch {
      // Handle completely missing or malformed body
      config = {
        filters: [{
          column: 'gender_ceo',
          values: ['Female']
        }],
        valueColumn: 'amount',
        aggregationColumn: 'SUM'
      };
    }

    const filterSQL = buildFilterSQL(config.filters);
    const aggregateFn = parseAggregateFn(config.aggregationColumn);

    const data = await generateChartData({ filterSQL, aggregateFn });
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
    valueColumn: 'amount',
    aggregationColumn: 'SUM'
  };

  const filterSQL = buildFilterSQL(config.filters);
  const aggregateFn = defaultConfig.aggregationColumn.toUpperCase() as 'SUM' | 'AVG';

  const data = await generateChartData({ filterSQL, aggregateFn });
  return NextResponse.json(data);
}
