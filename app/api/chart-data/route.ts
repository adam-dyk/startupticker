import { NextResponse } from 'next/server';

export interface Filter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

export interface ChartConfig {
  filters: Filter[];
  valueColumn: string;
  aggregationColumn: string;
}

// Mock data generator based on configuration
function generateChartData(config: ChartConfig) {
  const fetchDatasets = (config: ChartConfig): { labels: string[]; datasets: { label: string; data: number[] }[] } => {
    // TODO AXEL: Fetch data from database
    // labels = ["2001", "2002", "2003", "2004", "2005"]
    // label = "Biotech"
    // data = [100000, 200000, 300000, 400000, 500000]

    const labels = ["2001", "2002", "2003", "2004", "2005"];
    return {labels: labels, datasets: [
      {
        label: "Biotech",
        data: labels.map(() => Math.floor(Math.random() * 1000000) + 500000)
      },
      {
        label: "Cleantech",
        data: labels.map(() => Math.floor(Math.random() * 1000000) + 500000)
      },
      {
        label: "Healthcare",
        data: labels.map(() => Math.floor(Math.random() * 1000000) + 500000)
      }
    ]
  };
}

  const data = fetchDatasets(config);

  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return {
    labels: data.labels,
    datasets: data.datasets.map(dataset => {
      const color = getRandomColor();
      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.3,
      };
    })
  };
}

export async function POST(request: Request) {
  try {
    const config: ChartConfig = await request.json();
    
    // Log detailed chart configuration
    console.log('=== Chart Configuration ===');
    console.log('Value Column:', config.valueColumn);
    console.log('Aggregation Column:', config.aggregationColumn);
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
    valueColumn: 'revenue',
    aggregationColumn: 'sum',
  };

  // Log default configuration
  console.log('=== Default Chart Configuration ===');
  console.log('Value Column:', defaultConfig.valueColumn);
  console.log('Aggregation Column:', defaultConfig.aggregationColumn);
  console.log('Filters:', JSON.stringify(defaultConfig.filters, null, 2));
  console.log('================================');

  const data = generateChartData(defaultConfig);
  return NextResponse.json(data);
} 