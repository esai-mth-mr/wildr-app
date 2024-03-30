import axios from 'axios';

let baseURL = 'http://localhost:6000/admin';
if (process.env.NODE_ENV === 'production') {
  baseURL = 'http://wildr-prod-1.admin.int.wildr.com/admin';
} else if (process.env.NODE_ENV === 'development') {
  baseURL = 'http://wildr-dev-2.admin.int.wildr.com/admin/';
}

export const adminClient = axios.create({
  baseURL,
});
