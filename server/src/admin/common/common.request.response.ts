export interface GenericResponse {
  status: 'OK' | 'ERROR';
  errorMessage?: string;
  message?: string;
  data?: any;
}
