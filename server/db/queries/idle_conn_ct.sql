SELECT COUNT(*)
FROM pg_stat_activity
WHERE state = 'idle';
