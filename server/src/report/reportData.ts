import { ReportType } from '../graphql';

export interface ReportData {
  totalReports: number;
  reportTypeCounter: Map<ReportType, number>;
}
