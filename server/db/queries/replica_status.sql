SELECT application_name,
  client_addr,
  state,
  sync_priority,
  sync_state
FROM pg_stat_replication;
