import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserRole, ViewScope } from '../types/finance';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  canViewScope: (scope: ViewScope) => boolean;
  canBuildDashboards: boolean;
  canViewApiConsole: boolean;
  defaultOffice: string;
}

const ROLE_STORAGE_KEY = 'exdash-user-role';

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function getStoredRole(): UserRole {
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    if (
      stored === 'MANAGEMENT_VIEWER' ||
      stored === 'CENTRAL_OFFICE_FINANCE' ||
      stored === 'REGIONAL_FINANCE_VIEWER' ||
      stored === 'DASHBOARD_DESIGNER' ||
      stored === 'SYSTEM_ADMINISTRATOR'
    ) {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'MANAGEMENT_VIEWER';
}

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const [role, setRoleState] = useState<UserRole>(getStoredRole);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // localStorage not available
    }
  }, [role]);

  const canViewScope = useCallback(
    (scope: ViewScope): boolean => {
      switch (role) {
        case 'MANAGEMENT_VIEWER':
          return true;
        case 'CENTRAL_OFFICE_FINANCE':
          return scope === 'ENTIRE_DSWD' || scope === 'CENTRAL_OFFICE_ONLY';
        case 'REGIONAL_FINANCE_VIEWER':
          return scope === 'SINGLE_REGIONAL';
        case 'DASHBOARD_DESIGNER':
          return true;
        case 'SYSTEM_ADMINISTRATOR':
          return true;
      }
    },
    [role]
  );

  const canBuildDashboards = role === 'DASHBOARD_DESIGNER' || role === 'SYSTEM_ADMINISTRATOR';
  const canViewApiConsole = role === 'SYSTEM_ADMINISTRATOR';

  const defaultOffice = (() => {
    switch (role) {
      case 'REGIONAL_FINANCE_VIEWER':
        return 'REGION_V';
      case 'CENTRAL_OFFICE_FINANCE':
        return 'CENTRAL_OFFICE';
      default:
        return 'ALL';
    }
  })();

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        canViewScope,
        canBuildDashboards,
        canViewApiConsole,
        defaultOffice,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
