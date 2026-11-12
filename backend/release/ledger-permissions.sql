-- Run with psql -X -v ON_ERROR_STOP=1 as the reviewed migration owner.
-- Set ALL variables explicitly. This file neither creates roles nor connects anywhere.
-- Never use app credentials, REASSIGN OWNED, broad revokes, or default-privilege grants here.
\set ON_ERROR_STOP on
\if :{?ledger_schema}
\else
  \echo 'ledger_schema required'
  \quit 1
\endif
\if :{?expected_database}
\else
  \echo 'expected_database required'
  \quit 1
\endif
\if :{?expected_oid}
\else
  \echo 'expected_oid required'
  \quit 1
\endif
\if :{?expected_address}
\else
  \echo 'expected_address required'
  \quit 1
\endif
\if :{?expected_port}
\else
  \echo 'expected_port required'
  \quit 1
\endif
\if :{?migration_owner}
\else
  \echo 'migration_owner required'
  \quit 1
\endif
\if :{?runtime_role}
\else
  \echo 'runtime_role required'
  \quit 1
\endif
\if :{?application_role}
\else
  \echo 'application_role required'
  \quit 1
\endif
BEGIN;
SET LOCAL search_path = :'ledger_schema', pg_catalog, public;
SELECT set_config('ledger_release.schema', :'ledger_schema', true),
       set_config('ledger_release.database', :'expected_database', true),
       set_config('ledger_release.oid', :'expected_oid', true),
       set_config('ledger_release.address', :'expected_address', true),
       set_config('ledger_release.port', :'expected_port', true),
       set_config('ledger_release.owner', :'migration_owner', true),
       set_config('ledger_release.runtime', :'runtime_role', true),
       set_config('ledger_release.application', :'application_role', true);
DO $$
DECLARE
  owner_name text := current_setting('ledger_release.owner');
  runtime_name text := current_setting('ledger_release.runtime');
  application_name text := current_setting('ledger_release.application');
BEGIN
  IF current_setting('ledger_release.schema') <> 'activity_ledger'
     OR current_schema() <> current_setting('ledger_release.schema') OR current_database() <> current_setting('ledger_release.database')
     OR (SELECT oid::text FROM pg_database WHERE datname=current_database()) <> current_setting('ledger_release.oid')
     OR host(inet_server_addr()) IS DISTINCT FROM current_setting('ledger_release.address')
     OR inet_server_port()::text IS DISTINCT FROM current_setting('ledger_release.port')
     OR current_user <> owner_name OR owner_name = runtime_name OR pg_is_in_recovery() THEN
    RAISE EXCEPTION 'Release target/role mismatch';
  END IF;
  IF (SELECT count(*) FROM pg_roles WHERE rolname IN (owner_name,runtime_name,application_name)) <> 3
     OR EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN (owner_name,runtime_name,application_name)
       AND (rolsuper OR rolcreaterole OR rolcreatedb OR rolreplication OR rolbypassrls)) THEN
    RAISE EXCEPTION 'Unsafe or missing release roles';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('activity_ledger.activity_events'::regclass,'activity_ledger.activity_access_sessions'::regclass)
             AND relowner <> (SELECT oid FROM pg_roles WHERE rolname=owner_name))
     OR (SELECT proowner FROM pg_proc WHERE oid='activity_ledger.reject_activity_event_mutation()'::regprocedure)
        <> (SELECT oid FROM pg_roles WHERE rolname=owner_name) THEN
    RAISE EXCEPTION 'Migration role must own ledger objects';
  END IF;
  IF pg_has_role(runtime_name,owner_name,'MEMBER')
     OR pg_has_role(runtime_name,(SELECT datdba FROM pg_database WHERE datname=current_database()),'MEMBER')
     OR has_schema_privilege(runtime_name,'public','CREATE') THEN
    RAISE EXCEPTION 'Runtime can assume owner or create in public; separate DBA remediation required';
  END IF;
  IF has_schema_privilege(application_name, current_setting('ledger_release.schema'), 'USAGE,CREATE')
     OR has_table_privilege(application_name, 'activity_ledger.activity_events', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege(application_name, 'activity_ledger.activity_access_sessions', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
     OR has_table_privilege(application_name, 'activity_ledger.activity_log_viewers', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    RAISE EXCEPTION 'Existing application role must not access activity ledger objects';
  END IF;
END $$;
-- Only ledger-local ACLs are adjusted. Existing application ACLs are preserved.
REVOKE ALL ON activity_ledger.activity_events, activity_ledger.activity_access_sessions FROM PUBLIC;
REVOKE ALL ON activity_ledger.activity_log_viewers FROM PUBLIC;
REVOKE ALL ON FUNCTION activity_ledger.reject_activity_event_mutation() FROM PUBLIC;
REVOKE ALL ON activity_ledger.activity_events, activity_ledger.activity_access_sessions FROM :"runtime_role";
REVOKE ALL ON activity_ledger.activity_log_viewers FROM :"runtime_role";
REVOKE ALL ON FUNCTION activity_ledger.reject_activity_event_mutation() FROM :"runtime_role";
GRANT SELECT, INSERT ON activity_ledger.activity_events TO :"runtime_role";
GRANT SELECT, INSERT, UPDATE ON activity_ledger.activity_access_sessions TO :"runtime_role";
-- The application provisions/revokes grants only after the platform-admin check.
GRANT SELECT, INSERT, DELETE ON activity_ledger.activity_log_viewers TO :"runtime_role";
-- Legacy AuditLogsRepository.create performs INSERT followed by a nodes UPDATE.
GRANT UPDATE ON public.auditlogs TO :"runtime_role";
DO $$
DECLARE
  runtime_name text := current_setting('ledger_release.runtime');
  r record;
BEGIN
  -- MEMBER covers roles the runtime could SET ROLE to, even with NOINHERIT.
  FOR r IN SELECT * FROM pg_roles WHERE pg_has_role(runtime_name,oid,'MEMBER') LOOP
    IF r.rolsuper OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication OR r.rolbypassrls
       OR r.rolname IN ('pg_write_server_files','pg_execute_server_program','pg_read_server_files')
       OR has_schema_privilege(r.oid,'public','CREATE')
       OR has_table_privilege(r.oid,'activity_ledger.activity_events','UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
       OR has_any_column_privilege(r.oid,'activity_ledger.activity_events','UPDATE,REFERENCES')
       OR has_table_privilege(r.oid,'activity_ledger.activity_access_sessions','DELETE,TRUNCATE,TRIGGER,REFERENCES') THEN
      RAISE EXCEPTION 'Runtime has effective or assumable dangerous privileges; transaction rolled back';
    END IF;
  END LOOP;
  IF NOT has_table_privilege(runtime_name,'activity_ledger.activity_events','SELECT')
     OR NOT has_table_privilege(runtime_name,'activity_ledger.activity_events','INSERT')
     OR NOT has_table_privilege(runtime_name,'activity_ledger.activity_access_sessions','SELECT')
     OR NOT has_table_privilege(runtime_name,'activity_ledger.activity_access_sessions','INSERT')
     OR NOT has_table_privilege(runtime_name,'activity_ledger.activity_access_sessions','UPDATE')
     OR NOT has_table_privilege(runtime_name,'activity_ledger.activity_log_viewers','SELECT,INSERT,DELETE')
     OR NOT has_table_privilege(runtime_name,'public.auditlogs','UPDATE') THEN
    RAISE EXCEPTION 'Required runtime privileges missing';
  END IF;
END $$;
COMMIT;
