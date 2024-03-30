import { ReportData } from '../reportData';

export const reportDataFake = (overrides?: Partial<ReportData>): ReportData => {
  return {
    totalReports: 0,
    reportTypeCounter: new Map(),
    ...overrides,
  };
};
