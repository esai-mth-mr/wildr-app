# Postgres Runbook

# Intro

## Monitoring and Dashboards

- [Primary Dashboard](https://app.datadoghq.com/dashboard/pgm-en9-4bg/wildr-server-db?from_ts=1677354511473&to_ts=1677527311473&live=true)
- [Monitors](https://app.datadoghq.com/monitors/manage?q=tag%3A%22server-db%22)

## PSQL

You will probably want to use qsql for database commands unless you are using
a GUI. Some useful psql commands are:

Connect to local db with:

```
psql \
   --host=localhost \
   --port=8081 \
   --username=wildr \
   --password \
   --dbname=wildr
```

- `\l`: Lists all databases
- `\c` <database_name>: Connects to a database
- `\d`: Lists all tables in the current database
- `\d` <table_name>: Describes the schema of a table
- `\q`: Quits the PostgreSQL command-line interface

To view the log file use:

```
tail -f /var/lib/pgsql/<version>/data/pg_log/postgresql-<date>.log
```

To view current activity of the database use:

```
SELECT * FROM pg_stat_activity;
```

To view stats for a specific database use:

```
SELECT * FROM pg_stat_database WHERE datname = '<database_name>';
```

To view the value of a configuration parameter use:

```
SELECT name, setting FROM pg_settings WHERE name = '<parameter_name>';
```

To alter a configuration parameter use:

```
ALTER SYSTEM SET <parameter_name> = <value>;
```

# Pager Duty & Debugging

## SSH Into into RDS Instance

```
ssh -i ~/.ssh/wildr-eb-dev-1.key ec2-user@<rds-ip>
  -NL 8081:db-wildr-dev-2.ccyevrfw548s.us-west-2.rds.amazonaws.com:5432
```

## General

When debugging issues with postgres, the most interesting tables to look at are:

- `pg_stat_activity`: A table with one entry per server process, showing details
  of the running query for each.
- `pg_locks`: Information on current locks held within the database by open
  transactions, with one row per lockable object.

and the most useful functions are:

- `pg_blocking_pids()`: A function that can find the process IDs (PIDs) of
  sessions that are blocking the PostgreSQL server process of a supplied PID.
- `pg_cancel_backend()`: Function that cancels the currently running query by
  sending a SIGINT to a process ID.
- `pg_terminate_backend()`: Terminate a backend process completely (the query
  and usually the connection) on the database (uses SIGTERM instead of SIGINT).

## Availability

Search postgres error logs
[here](https://cloud.community.humio.com/wildr-prod-1/search?live=false&query=engine%20%3D%20%22POSTGRES%22%20instanceID%20%3D%20%22db-wildr-prod-1%22&start=1d&tz=America%2FNew_York)
(full disk or other I/O errors will normally not cause Postgres to shut down and
may even allow read-only queries but will cause all read-write queries to
generate errors).

Check that you can connect to the database from a psql prompt.

```
psql -h localhost -U wildr -d wildr
```

Check that you can make a database modification. Run select txid_current() is
handy for this as it does require disk i/o to record the transaction. You could
also try creating and dropping a dummy table.

Using a pre-written query connected with psql:

```
\i server/db/queries/create_dummy_table.sql
```

## Load and Queue Depth

Database load is difficult to resolve from postgres as additional actions may
cause load to increase. You may be able to restart the server but fixes usually
need to be made from the client side via throttling.

## Active Connections

The [active connections high alert](https://app.datadoghq.com/monitors/110303327)
indicates that there are too many connections to the database. Run the following
command to get a readout of connections to a db.

```
\i server/db/queries/active_conn_ct.sql
```

Typeorm defaults to using 10 connections for its connection pool. Thus, the
connection count should be 10\* the number of server, worker, and admin
instances.

If the connection count does in fact look too high you might want to check the
number of idle connections to see if you can kill some of them. To get the
number of idle connections use:

```
\i server/db/queries/idle_conn_ct.sql
```

You can retrieve the process id of idle connections with

```
\i server/db/queries/get_idle_conn_pid.sql
```

This will give you process id's which you may want to try to end or kill with
`cancel_proc` and `kill_proc` scripts.

## Replication Lag and Latency

Replication lag is most commonly caused by long running or high numbers of
transactions, locks, or network issues. To see if network issues are the problem
check the ping of the db. To check for unresolved locks you can use:

```
\i server/db/queries/get_idle_conn_pid.sql
```

To check for out od date transactions you can use:

```
\i server/db/queries/long_running_tx.sql
```

This will give you process id's which you may want to try to end or kill with
`cancel_proc` and `kill_proc` scripts.

You might also want to check if there are large numbers of unvacummed
transactions. This can be done with

```
\i server/db/queries/unvacuumed_transactions.sql
```

See [here](https://wiki.postgresql.org/wiki/Lock_Monitoring) for more info on
locks.

## Errors

Check the database error logs
[here](https://cloud.community.humio.com/wildr-prod-1/search?live=false&query=engine%20%3D%20%22POSTGRES%22%20instanceID%20%3D%20%22db-wildr-prod-1%22&start=1d&tz=America%2FNew_York)
(full disk, out of memory, no more file descriptors, or other resource
starvation issues could cause all read-write transactions to fail while Postgres
limps along completing read-only transactions for example).

Check that the host in question is under normal load -- if the usage is
extremely low due to replication lag or network issues then this may be a false
positive.

Start with the [load and queue depth](#load-and-queue-depth) section and go from
there.
