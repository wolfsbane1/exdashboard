# Local Setup

This project runs exDASH as a full-stack app with two separate data sources:

- FSDS database: external finance data owned by the FSDS system.
- exDASH metadata database: dashboard templates, saved dashboards, financial scenarios, and assumptions owned by exDASH.

## Architecture

```text
Browser
  -> exDASH React UI
  -> exDASH Express API
  -> FSDS PostgreSQL database for finance records
  -> exDASH PostgreSQL database for templates/scenarios/dashboard metadata
```

## Required Local Services

You need:

- Local FSDS PostgreSQL container from the FSDS project.
- Local exDASH metadata PostgreSQL container from this repo.
- exDASH app container from this repo.

All containers must share the same Docker network:

```text
empowerx-net-local
```

Create it once:

```bash
docker network create empowerx-net-local
```

If it already exists, Docker will show an error. That is fine.

## FSDS Local Database

Your FSDS local database should expose these values inside Docker:

```env
POSTGRES_HOST=empowerx-fsds-db-local
POSTGRES_PORT=5432
POSTGRES_DB=empowerx_fsds
POSTGRES_USER=empowerx_local
POSTGRES_PASSWORD=supersecretpassword
POSTGRES_SSL=false
```

Important:

- From your host machine, the FSDS DB may be reachable at `localhost:15432`.
- From the exDASH container, use `empowerx-fsds-db-local:5432`.
- Do not use `localhost` inside exDASH for FSDS DB. Inside a container, `localhost` means the exDASH container itself.

Make sure the FSDS DB service is attached to `empowerx-net-local`.

Example FSDS Compose network section:

```yaml
networks:
  empowerx-net-local:
    external: true
```

Example FSDS DB service network:

```yaml
services:
  empowerx-fsds-db-local:
    networks:
      - empowerx-net-local
```

Start FSDS from the FSDS project:

```bash
docker compose up -d
```

## exDASH Environment

This repo uses `.env` for Docker runtime configuration.

The important FSDS settings are:

```env
FSDS_DB_DRIVER=postgres
FSDS_DB_HOST=empowerx-fsds-db-local
FSDS_DB_PORT=5432
FSDS_DB_DATABASE=empowerx_fsds
FSDS_DB_SCHEMA=public
FSDS_DB_USER=empowerx_local
FSDS_DB_PASSWORD=supersecretpassword
FSDS_DB_SSL=false
FSDS_DB_SSL_REJECT_UNAUTHORIZED=true
FSDS_DB_AMOUNT_SCALE=100
```

The important exDASH metadata DB settings are:

```env
EXDASH_DB_HOST=exdash-db-local
EXDASH_DB_PORT=5432
EXDASH_DB_DATABASE=exdash_metadata
EXDASH_DB_USER=exdash
EXDASH_DB_PASSWORD=exdash_dev
EXDASH_DB_SSL=false
EXDASH_DB_SSL_REJECT_UNAUTHORIZED=true
EXDASH_DB_POOL_MAX=10
```

The frontend/backend setting should stay relative for Docker production mode:

```env
VITE_EXDASH_API_URL=/api/exdash
```

Do not set `NODE_ENV=production` in `.env`. The Dockerfile sets production mode for the container. Setting `NODE_ENV` in `.env` causes Vite build warnings.

## Run exDASH Locally With Docker Compose

From this repo:

```bash
docker compose -f docker-compose.local.yml up --build
```

This starts:

- `exdash-db-local`: PostgreSQL metadata DB on host port `15433`.
- `exdash-db-admin-local`: Adminer for the exDASH metadata DB on host port `8082`.
- `exdash`: exDASH app on host port `4000`.

The exDASH container runs metadata DB migrations before starting the server:

```bash
npm run db:migrate && npm run start
```

Open the app:

```text
http://localhost:4000
```

## Test Endpoints

Check readiness:

```text
http://localhost:4000/api/exdash/ready
```

Expected when both DBs are reachable:

```json
{
  "status": "ready",
  "dataSource": "EMPOWERX_FSDS_FINANCE_DATABASE",
  "demoMode": false
}
```

Check health:

```text
http://localhost:4000/api/exdash/health
```

Test FSDS finance data:

```text
http://localhost:4000/api/exdash/finance/summary
http://localhost:4000/api/exdash/finance/records?limit=1
http://localhost:4000/api/exdash/reference/offices
```

Test exDASH metadata data:

```text
http://localhost:4000/api/exdash/dashboard-templates
http://localhost:4000/api/exdash/dashboards
http://localhost:4000/api/exdash/scenarios
```

The database tables are created by Drizzle migrations. The first call to `/dashboard-templates` only seeds default dashboard template rows if they do not already exist.

## Drizzle Commands

The exDASH metadata DB schema is defined in:

```text
server/db/schema.ts
```

Drizzle config is in:

```text
drizzle.config.ts
```

Generate a migration after editing `server/db/schema.ts`:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

When using `docker-compose.local.yml`, migrations are applied automatically before the exDASH server starts.

If you want to run migrations from your host machine instead of inside Docker, temporarily point the metadata DB host/port to the published local port:

```bash
$env:EXDASH_DB_HOST="localhost"
$env:EXDASH_DB_PORT="15433"
$env:EXDASH_DB_DATABASE="exdash_metadata"
$env:EXDASH_DB_USER="exdash"
$env:EXDASH_DB_PASSWORD="exdash_dev"
$env:EXDASH_DB_SSL="false"
npm run db:migrate
```

Open Drizzle Studio:

```bash
npm run db:studio
```

For Drizzle Studio from your host, use the same host env override above because `exdash-db-local` only resolves inside Docker.

## Direct DB Tests

Test FSDS DB from the shared Docker network:

```bash
docker run --rm -it --network empowerx-net-local postgres:16 psql "postgresql://empowerx_local:supersecretpassword@empowerx-fsds-db-local:5432/empowerx_fsds"
```

Test exDASH metadata DB from the shared Docker network:

```bash
docker run --rm -it --network empowerx-net-local postgres:16 psql "postgresql://exdash:exdash_dev@exdash-db-local:5432/exdash_metadata"
```

Test exDASH metadata DB from your host machine:

```bash
docker run --rm -it postgres:16 psql "postgresql://exdash:exdash_dev@host.docker.internal:15433/exdash_metadata"
```

## Browser Adminer For exDASH Metadata DB

Open:

```text
http://localhost:8082
```

Login with:

```text
System: PostgreSQL
Server: exdash-db-local
Username: exdash
Password: exdash_dev
Database: exdash_metadata
```

Use this exDASH Adminer, not the FSDS Adminer on `localhost:8080`. The FSDS Adminer may not be attached to the exDASH metadata DB container network, so it may not resolve `exdash-db-local`.

## Common Errors

`getaddrinfo ENOTFOUND empowerx-fsds-db-local`

The exDASH container is not on the same Docker network as the FSDS DB container, or the FSDS DB container/service name is different.

`ECONNREFUSED`

The host is reachable, but PostgreSQL is not listening on the configured port.

`password authentication failed`

The username/password/database combination is wrong for the PostgreSQL server being reached.

`relation does not exist`

The DB connection works, but the expected FSDS tables are missing or the schema does not match what exDASH expects.

`Metadata database unavailable`

The exDASH metadata DB is not running, not on the same network, or the `EXDASH_DB_*` values are wrong.

## Reset exDASH Metadata DB

This deletes saved dashboard/scenario/template metadata:

```bash
docker compose -f docker-compose.local.yml down -v
```

Then start again:

```bash
docker compose -f docker-compose.local.yml up --build
```


## SQL for creating exdash account read only
CREATE USER exdash_readonly WITH PASSWORD 'YourStrongPassword';

GRANT CONNECT ON DATABASE empowerx_fsds TO exdash_readonly;

GRANT USAGE ON SCHEMA public TO exdash_readonly;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO exdash_readonly;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON ALL TABLES IN SCHEMA public
FROM exdash_readonly;

## SQL for Dropping user
REASSIGN OWNED BY exdash_readonly TO postgres;
DROP OWNED BY exdash_readonly;
DROP USER exdash_readonly;