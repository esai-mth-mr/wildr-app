SELECT datname,
  pid,
  count(*) AS unvacuumed_transactions
FROM pg_stat_activity
GROUP BY datname;
