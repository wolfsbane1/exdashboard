# Deploying exDASH with AWS-hosted EMPOWERX FSDS PostgreSQL

This deployment shape runs one exDASH service:

- Serves the compiled React dashboard UI.
- Serves the `/api/exdash/*` APIs from the same origin.
- Reads finance data from the EMPOWERX FSDS PostgreSQL database.
- Does not store standalone finance records in exDASH.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile` | Builds a deployable exDASH container. |
| `.dockerignore` | Keeps local datasets, env files, and local PostgreSQL files out of the image. |
| `deploy/aws/env.aws.example` | Runtime environment template for AWS. |
| `deploy/aws/ecs-task-definition.template.json` | ECS Fargate task definition template. |
| `deploy/sql/create-exdash-readonly-role.sql` | SQL template for a read-only FSDS database role. |
| `scripts/smoke-test.mjs` | Verifies deployed exDASH is reading from FSDS PostgreSQL. |
| `deploy/systemd/exdash.service` | Optional EC2/systemd service template. |

## Required AWS Setup

1. Deploy exDASH into the same VPC as the EMPOWERX FSDS PostgreSQL database, or into a peered/network-connected VPC.
2. Allow the exDASH task/security group to reach the FSDS PostgreSQL security group on TCP `5432`.
3. Store the FSDS database password in AWS Secrets Manager.
4. Use a read-only database user for exDASH. Start from `deploy/sql/create-exdash-readonly-role.sql`.
5. Enable TLS to PostgreSQL unless EMPOWERX policy explicitly requires otherwise.
6. Put the exDASH service behind an ALB, API Gateway, App Runner domain, or existing EMPOWERX reverse proxy.

## Environment

Use `deploy/aws/env.aws.example` as the starting point.

Important values:

```bash
VITE_EXDASH_API_URL=/api/exdash
FSDS_DB_DRIVER=postgres
FSDS_DB_HOST=<aws-rds-or-aurora-postgresql-endpoint>
FSDS_DB_PORT=5432
FSDS_DB_DATABASE=empowerx_fsds
FSDS_DB_SCHEMA=public
FSDS_DB_USER=exdash_readonly
FSDS_DB_SSL=true
FSDS_DB_SSL_REJECT_UNAUTHORIZED=true
FSDS_DB_AMOUNT_SCALE=100
```

Do not commit or bake `FSDS_DB_PASSWORD` into the image. Inject it from AWS Secrets Manager.

## Build Container

```bash
docker build \
  --build-arg VITE_EXDASH_API_URL=/api/exdash \
  -t exdash:latest .
```

Push the image to ECR and replace the placeholders in `deploy/aws/ecs-task-definition.template.json`.

## ECS Fargate Notes

- Container port: `4000`
- Health/readiness path: `/api/exdash/ready`
- Public health path: `/api/exdash/health`
- Recommended ALB target health check: `GET /api/exdash/ready`
- Task role: allow reading the Secrets Manager secret used for `FSDS_DB_PASSWORD`
- Execution role: standard ECS task execution role for pulling from ECR and writing CloudWatch logs

## Verification

After deployment, run:

```bash
EXDASH_BASE_URL=https://<exdash-host>/api/exdash npm run smoke:fsds
```

Expected result:

- `dataSource` is `EMPOWERX_FSDS_FINANCE_DATABASE`
- `demoMode` is `false`
- `/ready` returns HTTP `200`
- `/finance/summary` returns positive finance totals
- `/finance/records?limit=1` returns at least one FSDS row

You can also check these URLs directly:

```text
https://<exdash-host>/api/exdash
https://<exdash-host>/api/exdash/health
https://<exdash-host>/api/exdash/ready
https://<exdash-host>/api/exdash/finance/summary
```

The dashboard UI should be available at:

```text
https://<exdash-host>/
```

## Production Cautions

- The current prototype has no EMPOWERX authentication enforcement yet. Add EMPOWERX token validation before exposing beyond a trusted internal environment.
- Saved dashboard definitions and scenarios are still in memory/browser storage in this prototype. Move those to an approved persistence layer if they must survive container restarts.
- Keep `FSDS_DB_AMOUNT_SCALE=100` for the analyzed FSDS schema because amounts are stored as bigint centavos.
- Do not enable the demo dataset in production except for controlled demonstrations.
