# exDASH — EMPOWERX Dashboard and Analytics Services Hub

> A customizable finance dashboard web app for the Department of Social Welfare and Development (DSWD). Part of the EMPOWERX ecosystem.

## What is exDASH?

exDASH is a dashboard and analytics service that serves as the **visualization and financial decision-support layer** for the EMPOWERX Finance System. exDASH does not keep standalone finance data; its APIs get finance data from the **EMPOWERX FSDS finance system database** and plot that data in the dashboards. It provides:

- **DSWD-wide consolidated finance dashboards**
- **Region-specific dashboards** for all 18 DSWD offices
- **Regional comparison** with ranking and benchmarking
- **Financial Assumptions Builder** for scenario simulation
- **Custom Dashboard Builder** for tailored views
- **20+ exDASH API endpoints** designed to serve FSDS-backed finance analytics

## ⚠️ Prototype Notice

This is a **prototype version** with the following limitations:
- Finance endpoints require a read-only EMPOWERX FSDS database connection
- No authentication — mock role selector only
- Dashboards saved to `localStorage` persist in the browser only
- Scenario definitions saved to server memory only; scenario baselines are fetched from FSDS

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS v3 | Styling |
| Recharts | Charts & visualizations |
| Lucide React | Icons |
| Framer Motion | Animations |
| Express.js | Prototype exDASH backend API |
| Axios | HTTP client |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation
```bash
cd exdash-prototype
npm install
```

### Running the App
```bash
# Run both frontend and backend together
npm run dev

# Or run separately:
npm run client   # Vite frontend on port 5173
npm run server   # Express API on port 4000
```

The app will be available at **http://localhost:5173**

### Build for Production
```bash
npm run build
npm run start
```

For AWS deployment with the EMPOWERX FSDS PostgreSQL database, see `DEPLOYMENT_AWS.md`.

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Executive Dashboard | `/` | DSWD-wide KPIs and charts |
| Regional Dashboard | `/regional` | Single region deep-dive |
| Consolidated View | `/consolidated` | CO vs RO comparison |
| Regional Comparison | `/comparison` | All offices side-by-side |
| UACS Analysis | `/uacs` | Object code breakdown |
| PAP Analysis | `/pap` | Program-level analysis |
| Disbursement Monitoring | `/disbursement` | Disbursement tracking |
| Unpaid Obligations | `/unpaid` | Unpaid obligations & aging |
| Financial Assumptions | `/assumptions` | Scenario simulation |
| Dashboard Builder | `/builder` | Custom dashboard creation |
| API Console | `/api-console` | API documentation |
| Settings | `/settings` | Role & app configuration |

## exDASH API Endpoints

Base URL: `http://localhost:4000/api/exdash`

The browser calls exDASH endpoints only. The exDASH backend is responsible for reading, filtering, aggregating, and authorizing finance data from the EMPOWERX FSDS database. Dashboard clients must not connect to the FSDS database directly.

### Finance
- `GET /finance/summary` — Aggregated summary
- `GET /finance/records` — Filtered records (paginated)
- `GET /finance/by-office` — Grouped by office
- `GET /finance/by-pap` — Grouped by PAP
- `GET /finance/by-uacs` — Grouped by UACS
- `GET /finance/disbursements` — Disbursement data
- `GET /finance/unpaid-obligations` — Unpaid obligations

### Reference
- `GET /reference/offices` — Office list
- `GET /reference/paps` — PAP list
- `GET /reference/uacs` — UACS list

### Demo Dataset
- `GET /demo-dataset/status` — Demo sample dataset status
- `POST /demo-dataset/load` — Load the previous demo dataset for dashboard plotting
- `DELETE /demo-dataset` — Clear demo data and return to FSDS-only mode

### Scenarios
- `POST /scenarios` — Create scenario
- `GET /scenarios` — List scenarios
- `GET /scenarios/:id` — Get scenario
- `POST /scenarios/:id/assumptions` — Add assumption
- `POST /scenarios/:id/compute` — Compute projections
- `POST /scenarios/compare` — Compare scenarios

### Dashboards
- `GET /dashboard-templates` — Templates
- `POST /dashboards` — Save dashboard
- `GET /dashboards` — List dashboards
- `PUT /dashboards/:id` — Update dashboard
- `DELETE /dashboards/:id` — Delete dashboard

## EMPOWERX FSDS Data Source

To connect exDASH to the EMPOWERX FSDS finance database:

1. **Point the frontend to the deployed exDASH service** in `.env`:
   ```
   VITE_EXDASH_API_URL=https://empowerx.dswd.gov.ph/api/exdash
   ```

2. **Configure the exDASH backend FSDS connector**:
   ```
   FSDS_DB_DRIVER=postgres
   FSDS_DB_HOST=fsds-db.internal
   FSDS_DB_PORT=5432
   FSDS_DB_DATABASE=empowerx_fsds
   FSDS_DB_SCHEMA=public
   FSDS_DB_USER=exdash_readonly
   FSDS_DB_PASSWORD=<read-only-password>
   FSDS_DB_SSL=false
   FSDS_DB_AMOUNT_SCALE=100
   ```
   A copy-ready template is available in `.env.fsds.example`.

3. **Enable authentication** in `src/services/exdashApi.ts`:
   ```typescript
   api.interceptors.request.use((config) => {
     const empowerxToken = getEmpowerxAuthToken();
     config.headers.Authorization = `Bearer ${empowerxToken}`;
     config.headers['X-Office-Code'] = currentOfficeCode;
     return config;
   });
   ```

4. **Use the PostgreSQL FSDS adapter** — `server/dataSources/fsdsDataSource.ts` is the only finance-data boundary. It executes read-only PostgreSQL queries against the EMPOWERX FSDS schema and returns normalized finance records to the exDASH API layer.

## Finance Data Policy

- exDASH does not own or persist finance records.
- Finance data is fetched from EMPOWERX FSDS through the exDASH backend.
- exDASH may aggregate, filter, and format FSDS data for dashboards.
- Dashboard definitions and scenario assumptions can be stored by exDASH because they are dashboard metadata, not FSDS finance records.
- The Settings page can temporarily load a demo sample dataset for presentations. Clearing it returns finance endpoints to FSDS-only mode.

## License

Internal use — DSWD / EMPOWERX Project

## Run Docker 
docker run --rm --network empowerx-net-local --env-file .env -p 4000:4000 --name exdash exdash:local