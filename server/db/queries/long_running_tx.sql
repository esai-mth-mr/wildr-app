SELECT pid,
  age(clock_timestamp(), xact_start) AS xact_age,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND age(clock_timestamp(), xact_start) > interval '5 minutes'
ORDER BY xact_age DESC;
