import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext';
import { RoleProvider } from './contexts/RoleContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppShell from './components/layout/AppShell';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import RegionalDashboard from './pages/RegionalDashboard';
import ConsolidatedView from './pages/ConsolidatedView';
import RegionalComparison from './pages/RegionalComparison';
import UacsAnalysis from './pages/UacsAnalysis';
import PapAnalysis from './pages/PapAnalysis';
import DisbursementMonitoring from './pages/DisbursementMonitoring';
import UnpaidObligations from './pages/UnpaidObligations';
import FinancialAssumptions from './pages/FinancialAssumptions';
import DashboardBuilder from './pages/DashboardBuilder';
import ApiConsole from './pages/ApiConsole';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <FilterProvider>
          <RoleProvider>
            <AppShell>
              <Routes>
                <Route path="/" element={<ExecutiveDashboard />} />
                <Route path="/regional" element={<RegionalDashboard />} />
                <Route path="/consolidated" element={<ConsolidatedView />} />
                <Route path="/comparison" element={<RegionalComparison />} />
                <Route path="/uacs" element={<UacsAnalysis />} />
                <Route path="/pap" element={<PapAnalysis />} />
                <Route path="/disbursement" element={<DisbursementMonitoring />} />
                <Route path="/unpaid" element={<UnpaidObligations />} />
                <Route path="/assumptions" element={<FinancialAssumptions />} />
                <Route path="/builder" element={<DashboardBuilder />} />
                <Route path="/api-console" element={<ApiConsole />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AppShell>
          </RoleProvider>
        </FilterProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
