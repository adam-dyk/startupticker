WITH selected_startups AS (
  SELECT * FROM swiss.companies
  {{COMPANIES_FILTER}}
)
SELECT
  EXTRACT(YEAR FROM d.date_of_the_funding_round) AS year,
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
  AND d.date_of_the_funding_round IS NOT NULL
  AND d.date_of_the_funding_round BETWEEN DATE '2015-01-01' AND DATE '2025-01-01'
  AND {{GROUP_BY_FIELD}} IS NOT NULL
  AND d.type != 'EXIT'
GROUP BY
  EXTRACT(YEAR FROM d.date_of_the_funding_round), {{GROUP_BY_FIELD}}, group_label
ORDER BY
  {{GROUP_BY_FIELD}}, group_label, year;
