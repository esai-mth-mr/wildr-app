import axios from 'axios';

export const client = axios.create({
  baseURL: `http://localhost:${process.env.SERVER_HTTP_PORT || 4000}`,
});
