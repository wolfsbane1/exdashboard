export type FilterOptionGroup = 'office' | 'fiscalYear' | 'appropriationType' | 'pap';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  description?: string;
}

export type FilterOptionState = Record<FilterOptionGroup, FilterOption[]>;

export const DEFAULT_FILTER_OPTIONS: FilterOptionState = {
  office: [
    { id: 'office-central-office', value: 'CENTRAL_OFFICE', label: 'Central Office' },
    { id: 'office-ncr', value: 'NCR', label: 'NCR' },
    { id: 'office-car', value: 'CAR', label: 'CAR' },
    { id: 'office-region-i', value: 'REGION_I', label: 'Region I - Ilocos' },
    { id: 'office-region-ii', value: 'REGION_II', label: 'Region II - Cagayan Valley' },
    { id: 'office-region-iii', value: 'REGION_III', label: 'Region III - Central Luzon' },
    { id: 'office-calabarzon', value: 'CALABARZON', label: 'CALABARZON' },
    { id: 'office-mimaropa', value: 'MIMAROPA', label: 'MIMAROPA' },
    { id: 'office-region-v', value: 'REGION_V', label: 'Region V - Bicol' },
    { id: 'office-region-vi', value: 'REGION_VI', label: 'Region VI - Western Visayas' },
    { id: 'office-region-vii', value: 'REGION_VII', label: 'Region VII - Central Visayas' },
    { id: 'office-region-viii', value: 'REGION_VIII', label: 'Region VIII - Eastern Visayas' },
    { id: 'office-region-ix', value: 'REGION_IX', label: 'Region IX - Zamboanga Peninsula' },
    { id: 'office-region-x', value: 'REGION_X', label: 'Region X - Northern Mindanao' },
    { id: 'office-region-xi', value: 'REGION_XI', label: 'Region XI - Davao' },
    { id: 'office-region-xii', value: 'REGION_XII', label: 'Region XII - SOCCSKSARGEN' },
    { id: 'office-caraga', value: 'CARAGA', label: 'Caraga' },
    { id: 'office-barmm', value: 'BARMM', label: 'BARMM' },
  ],
  fiscalYear: [
    { id: 'fy-2026', value: '2026', label: '2026' },
    { id: 'fy-2025', value: '2025', label: '2025' },
    { id: 'fy-2024', value: '2024', label: '2024' },
  ],
  appropriationType: [
    { id: 'appropriation-current', value: 'CURRENT', label: 'Current' },
    { id: 'appropriation-continuing', value: 'CONTINUING', label: 'Continuing' },
    { id: 'appropriation-trust-fund', value: 'TRUST_FUND', label: 'Trust Fund' },
  ],
  pap: [
    {
      id: 'pap-general-management',
      value: '100000100001000',
      label: 'General Management and Supervision',
    },
    {
      id: 'pap-protective-services',
      value: '100000100002000',
      label: 'Protective Services for Individuals and Families in Difficult Circumstances',
    },
    {
      id: 'pap-disaster-response',
      value: '100000100003000',
      label: 'Disaster Response and Rehabilitation Program',
    },
    {
      id: 'pap-4ps',
      value: '100000100004000',
      label: 'Pantawid Pamilyang Pilipino Program (4Ps)',
    },
    {
      id: 'pap-slp',
      value: '100000100005000',
      label: 'Sustainable Livelihood Program (SLP)',
    },
    {
      id: 'pap-admin-support',
      value: '100000100006000',
      label: 'Administrative Support Services',
    },
    {
      id: 'pap-social-pension',
      value: '100000100007000',
      label: 'Social Pension for Indigent Senior Citizens',
    },
  ],
};
