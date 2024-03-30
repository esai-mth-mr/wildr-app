import axios from 'axios';
import https from 'https';

// Disable SSL verification (open search only accepts ssl connections but we
// don't have a valid certificate for localhost)
const agent = new https.Agent({
  rejectUnauthorized: false,
});

const username = process.env.ES_MASTER || '';
if (!username) {
  throw new Error('ES_MASTER not set');
}
const password = process.env.ES_PASSWORD || '';
if (!password) {
  throw new Error('ES_PASSWORD not set');
}
const baseURL = process.env.ES_ENDPOINT;
if (!baseURL) {
  throw new Error('ES_ENDPOINT not set');
}

export const client = axios.create({
  baseURL,
  httpsAgent: agent,
  auth: {
    username,
    password,
  },
});

export function logAxiosError(e: any) {
  if (e.response) {
    console.error(e.response.data);
  } else {
    console.error(e);
  }
}

export async function createDocument(index: string, id: string, doc: any) {
  await client.post(`/${index}/_create/${id}`, doc);
}

export async function getDocument(index: string, id: string) {
  const response = await client.get(`/${index}/_doc/${id}`);
  return response.data;
}

export async function updateDocument(index: string, id: string, doc: any) {
  await client.post(`/${index}/_update/${id}`, { doc });
}

export async function deleteDocument(index: string, id: string) {
  await client.delete(`/${index}/_doc/${id}`);
}

export async function deleteOpenSearchMappings() {
  const mappingNames = await getOpenSearchMappings();
  const accessibleNames = mappingNames.filter(name => !name.startsWith('.'));
  await Promise.all(
    accessibleNames.map(async mappingName => client.delete(`/${mappingName}`))
  );
}

export async function deleteOpenSearchMapping(mappingName: string) {
  await client.delete(`/${mappingName}`);
}

export async function getOpenSearchMappings() {
  const { data } = await client.get('/_mappings');
  return Object.keys(data);
}
