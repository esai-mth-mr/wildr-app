SELECT pid,
  usename,
  application_name,
  client_addr,
  backend_start,
  state_change
FROM pg_stat_activity
WHERE state = 'idle';
