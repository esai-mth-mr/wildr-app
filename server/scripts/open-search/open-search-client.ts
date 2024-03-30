import axios from 'axios';
import https from 'https';

// Disable SSL verification (open search only accepts ssl connections but we
// don't have a valid certificate for localhost)
const agent = new https.Agent({
  rejectUnauthorized: false,
});

export const client = axios.create({
  baseURL: 'https://localhost:9200/',
  httpsAgent: agent,
  auth: {
    username: 'admin',
    password: 'admin',
  },
});

export function logAxiosError(e: any) {
  if (e.response) {
    console.error(e.response.data.error);
    console.error(e.response.data.error.root_cause);
  } else {
    console.error(e);
  }
}

export async function createDocument(index: string, id: string, doc: any) {
  try {
    await client.post(`/${index}/_create/${id}`, doc);
  } catch (e: any) {
    logAxiosError(e);
  }
}

export async function getDocument(index: string, id: string) {
  try {
    const response = await client.get(`/${index}/_doc/${id}`);
    return response.data;
  } catch (e: any) {
    logAxiosError(e);
  }
}

export async function updateDocument(index: string, id: string, doc: any) {
  try {
    await client.post(`/${index}/_update/${id}`, { doc });
  } catch (e: any) {
    logAxiosError(e);
  }
}

export async function deleteDocument(index: string, id: string) {
  try {
    await client.delete(`/${index}/_doc/${id}`);
  } catch (e: any) {
    logAxiosError(e);
  }
}
