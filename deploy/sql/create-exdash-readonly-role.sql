-- Run this on the EMPOWERX FSDS PostgreSQL database as a database administrator.
-- Replace the password before running, or create the role/password through AWS Secrets Manager/IAM workflows.

CREATE ROLE exdash_readonly LOGIN PASSWORD 'CHANGE_ME_USE_A_SECRET';

GRANT CONNECT ON DATABASE empowerx_fsds TO exdash_readonly;
GRANT USAGE ON SCHEMA public TO exdash_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO exdash_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO exdash_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO exdash_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO exdash_readonly;
