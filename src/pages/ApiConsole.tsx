import React from 'react';
import { motion } from 'framer-motion';
import { ApiEndpointCard } from '../components/utility/ApiEndpointCard';
import { Terminal, Shield, Database, Zap } from 'lucide-react';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ApiConsole() {
  return (
    <div className="p-6">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Terminal size={24} className="text-red-500" /> API Console</h1>
          <p className="text-sm text-gray-500 mt-1">exDASH APIs — read-only EMPOWERX FSDS finance database reference</p>
        </motion.div>

        {/* Integration Notes */}
        <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-red-800 flex items-center gap-2 mb-3"><Shield size={18} /> EMPOWERX FSDS Data Integration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-red-700 mb-4">
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>exDASH backend owns the dashboard-facing API layer</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>exDASH reads and aggregates data from the EMPOWERX FSDS finance database</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>Dashboard clients never query the FSDS database directly</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>EMPOWERX auth token (Bearer)</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>Role-based access control (RBAC)</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>Office-level authorization before finance responses are returned</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>Audit logs & data lineage</span></div>
            <div className="flex items-start gap-2"><Zap size={14} className="mt-0.5 shrink-0" /><span>Read-only FSDS database queries for dashboard plotting</span></div>
          </div>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto">{`// Dashboard client -> exDASH API
headers: {
  Authorization: \`Bearer \${empowerxToken}\`,
  'X-Office-Code': officeCode,
  'X-Role': userRole,
  'X-Correlation-Id': correlationId
}

// exDASH service -> EMPOWERX FSDS database
FSDS_DB_DRIVER=postgres
FSDS_DB_HOST=fsds-db.internal
FSDS_DB_PORT=5432
FSDS_DB_DATABASE=empowerx_fsds
FSDS_DB_SCHEMA=public
FSDS_DB_USER=exdash_readonly`}</pre>
        </motion.div>

        {/* Health */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2"><Database size={14} /> System</h3>
          <ApiEndpointCard method="GET" path="/api/exdash/health" description="Returns service health status" sampleResponse={`{
  "status": "healthy | degraded",
  "service": "exDASH",
  "description": "EMPOWERX Dashboard and Analytics Services Hub",
  "dataSource": "EMPOWERX_FSDS_FINANCE_DATABASE",
  "dataAccessPattern": "exDASH reads and aggregates FSDS finance data for dashboard clients",
  "financeDataStoredInExdash": false,
  "fsdsConnection": {
    "mode": "FSDS_ONLY",
    "configured": true
  },
  "version": "1.0.0-prototype",
  "timestamp": "2025-05-21T09:00:00.000Z"
}`} />
        </motion.div>

        {/* Finance Endpoints */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2"><Database size={14} /> Finance Data</h3>
          <ApiEndpointCard method="GET" path="/api/exdash/finance/summary" description="Gets and aggregates finance records from the EMPOWERX FSDS database based on dashboard filters" sampleRequest="?scope=ENTIRE_DSWD&fiscalYear=2025&appropriationType=CURRENT" sampleResponse={`{
  "totalNetAllotment": 12345678901.23,
  "totalNetObligation": 10234567890.12,
  "actualBalance": 2111111011.11,
  "utilizationRate": 82.90,
  "disbursement": 9012345678.90,
  "unpaidObligations": 1222222211.22,
  "disbursementRate": 88.06
}`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/records" description="Gets filtered finance records from the EMPOWERX FSDS database with pagination" sampleRequest="?office=REGION_V&fiscalYear=2025&page=1&limit=10" sampleResponse={`{
  "data": [{ "id": "REGION_V-100000100001000-5010101000-2025", ... }],
  "total": 70, "page": 1, "limit": 10, "totalPages": 7
}`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/by-office" description="Gets FSDS finance data and groups it by office/region" sampleRequest="?fiscalYear=2025" sampleResponse={`[
  { "officeCode": "REGION_V", "officeName": "Region V - Bicol",
    "totalNetAllotment": 669423733.65, "utilizationRate": 82.59, ... }
]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/by-pap" description="Gets FSDS finance data and groups it by Program/Activity/Project" sampleResponse={`[
  { "papCode": "100000100001000", "papDescription": "General Management...",
    "totalNetAllotment": 12345678.90, ... }
]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/by-uacs" description="Gets FSDS finance data and groups it by UACS object code" sampleResponse={`[
  { "uacsCode": "5010101000", "uacsDescription": "Salaries and Wages",
    "totalNetAllotment": 6789012.34, ... }
]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/disbursements" description="Gets FSDS disbursement data grouped by office" sampleResponse={`[{ "officeCode": "NCR", "disbursement": 1234567890.12, ... }]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/finance/unpaid-obligations" description="Gets FSDS unpaid obligations grouped by office" sampleResponse={`[{
  "officeCode": "REGION_V", "unpaidObligations": 34302087.78,
  "aging": { "0-3 days": 13720835.11, "4-7 days": 8575521.95, ... }
}]`} />
        </motion.div>

        {/* Reference */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2"><Database size={14} /> Reference Data</h3>
          <ApiEndpointCard method="GET" path="/api/exdash/reference/offices" description="List of DSWD offices and regions" sampleResponse={`[
  { "code": "CENTRAL_OFFICE", "name": "Central Office", "type": "CENTRAL_OFFICE" },
  { "code": "REGION_V", "name": "Region V - Bicol", "type": "REGIONAL_OFFICE" }
]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/reference/paps" description="List of PAPs" sampleResponse={`[{ "code": "100000100001000", "description": "General Management..." }]`} />
          <ApiEndpointCard method="GET" path="/api/exdash/reference/uacs" description="List of UACS object codes" sampleResponse={`[{ "code": "5010101000", "description": "Salaries and Wages" }]`} />
        </motion.div>

        {/* Demo Dataset */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2"><Database size={14} /> Demo Dataset</h3>
          <ApiEndpointCard method="GET" path="/api/exdash/demo-dataset/status" description="Returns whether the demo sample dataset is currently loaded" sampleResponse={`{
  "loaded": true,
  "recordCount": 3780,
  "loadedAt": "2026-05-25T09:00:00.000Z",
  "sourceModule": "DEMO_SAMPLE_DATA"
}`} />
          <ApiEndpointCard method="POST" path="/api/exdash/demo-dataset/load" description="Loads the previous demo finance dataset for sample dashboard plotting" sampleResponse={`{
  "loaded": true,
  "recordCount": 3780,
  "sourceModule": "DEMO_SAMPLE_DATA"
}`} />
          <ApiEndpointCard method="DELETE" path="/api/exdash/demo-dataset" description="Clears demo data and returns finance endpoints to FSDS-only mode" sampleResponse={`{
  "loaded": false,
  "recordCount": 0,
  "loadedAt": null,
  "sourceModule": null
}`} />
        </motion.div>

        {/* Scenarios */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2"><Database size={14} /> Scenarios</h3>
          <ApiEndpointCard method="POST" path="/api/exdash/scenarios" description="Create a new financial scenario" sampleRequest={`{ "name": "Q4 Target", "baselineScope": "SINGLE_REGIONAL", "officeName": "REGION_V", "fiscalYear": 2025 }`} sampleResponse={`{ "id": "sc-abc123", "name": "Q4 Target", "assumptions": [], "projectedResults": null, "status": "DRAFT" }`} />
          <ApiEndpointCard method="GET" path="/api/exdash/scenarios" description="List all scenarios" sampleResponse={`[{ "id": "seed-region-v-95", "name": "Region V 95% Utilization Target", ... }]`} />
          <ApiEndpointCard method="POST" path="/api/exdash/scenarios/:id/assumptions" description="Add an assumption to a scenario" sampleRequest={`{ "type": "TARGET", "method": "TARGET_RATE", "value": 95, "targetMetric": "UTILIZATION" }`} sampleResponse={`{ "id": "sc-abc123", "assumptions": [{ ... }] }`} />
          <ApiEndpointCard method="POST" path="/api/exdash/scenarios/:id/compute" description="Compute projected results for a scenario" sampleResponse={`{ "projectedResults": { "projectedUtilizationRate": 95.00, "additionalObligationsNeeded": 83049186.11, ... } }`} />
          <ApiEndpointCard method="POST" path="/api/exdash/scenarios/compare" description="Compare multiple scenarios" sampleRequest={`{ "ids": ["sc-1", "sc-2"] }`} sampleResponse={`[{ "name": "Scenario A", "projectedResults": { ... } }, ...]`} />
        </motion.div>

        {/* Dashboards */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2"><Database size={14} /> Dashboards</h3>
          <ApiEndpointCard method="GET" path="/api/exdash/dashboard-templates" description="List pre-built dashboard templates" sampleResponse={`[{ "id": "tmpl-executive", "name": "Executive Overview", "widgets": [...] }]`} />
          <ApiEndpointCard method="POST" path="/api/exdash/dashboards" description="Save a custom dashboard" sampleRequest={`{ "name": "My Dashboard", "widgets": [...], "visibility": "PRIVATE" }`} sampleResponse={`{ "id": "db-xyz", "name": "My Dashboard", ... }`} />
          <ApiEndpointCard method="GET" path="/api/exdash/dashboards" description="List saved dashboards" sampleResponse={`[{ "id": "db-xyz", "name": "My Dashboard", ... }]`} />
          <ApiEndpointCard method="PUT" path="/api/exdash/dashboards/:id" description="Update a saved dashboard" sampleRequest={`{ "name": "Updated Dashboard", "widgets": [...] }`} sampleResponse={`{ "id": "db-xyz", "name": "Updated Dashboard", ... }`} />
          <ApiEndpointCard method="DELETE" path="/api/exdash/dashboards/:id" description="Delete a saved dashboard" sampleResponse={`{ "success": true }`} />
        </motion.div>
      </motion.div>
    </div>
  );
}
