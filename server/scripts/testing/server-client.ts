import axios from 'axios';

let baseURL = 'http://localhost:4000';
if (process.env.NODE_ENV === 'development') {
  baseURL = 'http://wildr-dev-2.us-west-2.elasticbeanstalk.com';
} else if (process.env.NODE_ENV === 'production') {
  baseURL = 'http://wildr-prod-1.us-west-2.elasticbeanstalk.com';
}

export const client = axios.create({
  baseURL,
});
