SELECT
  EXTRACT(YEAR FROM d.date_of_the_funding_round) AS year,
  c.industry,
  COUNT(*) AS num_financing_rounds
FROM
  swiss.deals d
JOIN
  swiss.companies c ON LOWER(TRIM(d.company)) = LOWER(TRIM(c.title))
WHERE
  d.date_of_the_funding_round IS NOT NULL
  AND c.industry IS NOT NULL
  AND d.date_of_the_funding_round >= DATE '2015-01-01'
  AND d.date_of_the_funding_round < DATE '2025-01-01'
  AND c.industry NOT IN ('Deep Tech', 'Interdisciplinary')
  AND d.type = 'VC'
GROUP BY
  EXTRACT(YEAR FROM d.date_of_the_funding_round), c.industry
ORDER BY
  c.industry, year;
