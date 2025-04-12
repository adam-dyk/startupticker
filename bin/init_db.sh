#!/bin/bash

set -euo pipefail

# CONFIGURATION
DB_CONTAINER_NAME="ticker-postgres"
DB_NAME="ticker"
DB_USER="ticker"
DB_PASSWORD="password"
TICKER_XLSX_URL="https://github.com/user-attachments/files/19537050/Data-startupticker.xlsx"
TICKER_XLSX_FILE="startup_ticker.xlsx"
CRUNCHBASE_XLSX_URL="https://github.com/user-attachments/files/19537056/Data-crunchbase.xlsx"
CRUNCHBASE_XLSX_FILE="crunchbase.xlsx"
DICT_CSV_FILE="./data/crunchbase_dict.csv"

# Ensure Postgres is running
echo "🔍 Ensuring Postgres is running..."
if [ "$(docker ps -q -f name=$DB_CONTAINER_NAME)" == "" ]; then
    if [ "$(docker ps -aq -f name=$DB_CONTAINER_NAME)" != "" ]; then
        docker start $DB_CONTAINER_NAME
    else
        docker run --name $DB_CONTAINER_NAME \
            -e POSTGRES_USER=$DB_USER \
            -e POSTGRES_PASSWORD=$DB_PASSWORD \
            -e POSTGRES_DB=$DB_NAME \
            -p 5432:5432 \
            -d postgres
    fi
fi

# Wait for DB to become ready
echo "⏳ Waiting for DB..."
until docker exec $DB_CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do sleep 1; done

# Download Excel files
curl -L "$TICKER_XLSX_URL" -o "$TICKER_XLSX_FILE"
curl -L "$CRUNCHBASE_XLSX_URL" -o "$CRUNCHBASE_XLSX_FILE"

# Install Python dependencies
pip3 show pandas openpyxl psycopg2-binary > /dev/null 2>&1 || pip3 install pandas openpyxl psycopg2-binary 

# Run embedded Python to extract sheet-wise CSVs and generate SQL
python3 - <<EOF
import pandas as pd
import os
import keyword
import re
import psycopg2
from psycopg2 import sql

conn = psycopg2.connect(dbname="$DB_NAME", user="$DB_USER", password="$DB_PASSWORD", host="localhost")
conn.autocommit = True
cur = conn.cursor()

# Helper to normalize column names
def sanitize_column(name):
    name = str(name).strip().lower()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", "_", name)
    if name == "" or name in keyword.kwlist:
        name = f"col_{abs(hash(name)) % 10**8}"
    return name

def infer_type(series):
    try:
        if pd.api.types.is_integer_dtype(series.dropna()):
            return "INTEGER"
        if pd.api.types.is_float_dtype(series.dropna()):
            return "FLOAT"
        if pd.api.types.is_bool_dtype(series.dropna()):
            return "BOOLEAN"
        pd.to_datetime(series.dropna(), errors='raise')
        return "TIMESTAMP"
    except:
        return "TEXT"

def process_file(xlsx_file, schema):
    print(f"📄 Processing {xlsx_file} -> schema: {schema}")
    cur.execute(sql.SQL("CREATE SCHEMA IF NOT EXISTS {};").format(sql.Identifier(schema)))
    xls = pd.ExcelFile(xlsx_file)

    for sheet in xls.sheet_names:
        print(f"  📃 Sheet: {sheet}")
        df = xls.parse(sheet)
        df.columns = [sanitize_column(c) for c in df.columns]
        df = df.loc[:, df.columns.notna() & (df.columns != "")]

        table = sheet.strip().lower().replace(" ", "_")
        full_table = f"{schema}.{table}"

        col_defs = []
        for col in df.columns:
            col_type = infer_type(df[col])
            col_defs.append(f'"{col}" {col_type}')

        column_definitions = ",\n  ".join(col_defs)
        create_sql = f"""
DROP TABLE IF EXISTS {full_table} CASCADE;
CREATE TABLE {full_table} (
  {column_definitions}
);
"""
        cur.execute(create_sql)

        csv_path = f"/tmp/{schema}_{table}.csv"
        df.to_csv(csv_path, index=False, na_rep='')

        os.system(f"docker cp {csv_path} ticker-postgres:{csv_path}")
        copy_sql = f"COPY {full_table} FROM '{csv_path}' WITH (FORMAT csv, HEADER true, QUOTE '\"');"
        cur.execute(copy_sql)

# Process both files
process_file("$CRUNCHBASE_XLSX_FILE", "crunchbase")
process_file("$TICKER_XLSX_FILE", "swiss")

# Create and load crunchbase.crunchbase_dict
print("📥 Loading crunchbase_dict...")
df_dict = pd.read_csv("$DICT_CSV_FILE")
df_dict.to_csv("/tmp/crunchbase_dict.csv", index=False, quoting=1)
os.system(f"docker cp /tmp/crunchbase_dict.csv ticker-postgres:/tmp/crunchbase_dict.csv")
cur.execute("""
DROP TABLE IF EXISTS crunchbase.crunchbase_dict;
CREATE TABLE crunchbase.crunchbase_dict (
    id SERIAL PRIMARY KEY,
    name TEXT,
    data_field TEXT,
    data_entity TEXT,
    description TEXT,
    api_or_csv TEXT,
    example_value TEXT,
    notes TEXT
);
COPY crunchbase.crunchbase_dict(name, data_field, data_entity, description, api_or_csv, example_value, notes)
FROM '/tmp/crunchbase_dict.csv' WITH (FORMAT csv, HEADER true, QUOTE '"');
""")
cur.close()
conn.close()
EOF

echo "✅ All sheets loaded, schemas created, and data ingested."

rm crunchbase.xlsx startup_ticker.xlsx
