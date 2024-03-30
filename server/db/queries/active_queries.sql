SELECT query,
  state,
  count(*) AS count
FROM pg_stat_activity
WHERE state = 'active'
GROUP BY query,
  state
ORDER BY count DESC
LIMIT 10;
