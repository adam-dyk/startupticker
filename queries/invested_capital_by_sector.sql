WITH selected_startups AS (
  SELECT * FROM swiss.companies
  {{COMPANIES_FILTER}}
),
selected_industries AS (
  SELECT DISTINCT c.industry
  FROM swiss.deals d
  JOIN swiss.companies c ON LOWER(TRIM(d.company)) = LOWER(TRIM(c.title))
  JOIN selected_startups s ON c.title = s.title
  WHERE d.amount IS NOT NULL
    AND d.date_of_the_funding_round BETWEEN DATE '2015-01-01' AND DATE '2025-01-01'
    AND d.type != 'EXIT'
    AND c.industry IS NOT NULL
)
SELECT
  EXTRACT(YEAR FROM d.date_of_the_funding_round) AS year,
  c.industry,
  CASE
    WHEN s.title IS NOT NULL THEN 'selected'
    ELSE 'other'
  END AS group_label,
  ROUND({{AGGREGATE_FUNCTION}}(d.amount)::numeric, 3) AS total_invested_chf
FROM swiss.deals d
JOIN swiss.companies c ON LOWER(TRIM(d.company)) = LOWER(TRIM(c.title))
LEFT JOIN selected_startups s ON c.title = s.title
WHERE d.amount IS NOT NULL
  AND d.date_of_the_funding_round IS NOT NULL
  AND d.date_of_the_funding_round BETWEEN DATE '2015-01-01' AND DATE '2025-01-01'
  AND c.industry IS NOT NULL
  AND d.type != 'EXIT'
  AND c.industry IN (SELECT industry FROM selected_industries)
GROUP BY
  EXTRACT(YEAR FROM d.date_of_the_funding_round), c.industry, group_label
ORDER BY
  c.industry, group_label, year;