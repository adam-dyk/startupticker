WITH selected_startups AS (
  SELECT * FROM swiss.companies
  {{COMPANIES_FILTER}}
),
selected AS (
  SELECT DISTINCT {{GROUP_BY_FIELD}}
  FROM swiss.deals d
  JOIN swiss.companies c ON LOWER(TRIM(d.company)) = LOWER(TRIM(c.title))
  JOIN selected_startups s ON c.title = s.title
  WHERE d.amount IS NOT NULL
    AND EXTRACT(YEAR FROM d.date_of_the_funding_round) = {{YEAR}}
    AND d.type != 'EXIT'
    AND {{GROUP_BY_FIELD}} IS NOT NULL
)
SELECT
  {{GROUP_BY_FIELD}} AS group_by_label,
  CASE
    WHEN s.title IS NOT NULL THEN '{{FILTER_VAULE}}'
    ELSE 'Other'
  END AS group_label,
  ROUND({{AGGREGATE_FUNCTION}}({{AGGREGATE_FIELD}})::numeric, 3) AS aggregate_label
FROM swiss.deals d
JOIN swiss.companies c ON LOWER(TRIM(d.company)) = LOWER(TRIM(c.title))
LEFT JOIN selected_startups s ON c.title = s.title
WHERE {{AGGREGATE_FIELD}} IS NOT NULL
  AND EXTRACT(YEAR FROM d.date_of_the_funding_round) = {{YEAR}}
  AND d.type != 'EXIT'
  AND {{GROUP_BY_FIELD}} IS NOT NULL
  AND {{GROUP_BY_FIELD}} IN (SELECT {{GROUP_BY_FIELD}} FROM selected)
GROUP BY {{GROUP_BY_FIELD}}, group_label
ORDER BY aggregate_label DESC;