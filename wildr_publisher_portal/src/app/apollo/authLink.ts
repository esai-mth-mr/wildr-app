import { setContext } from '@apollo/client/link/context';
import { getCookie } from 'cookies-next';
import { JWT_TOKEN } from '@/app/utils/constants';

export const authLink = setContext((_, { headers }) => {
  const token = getCookie(JWT_TOKEN);
  if (token) {
    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }
  return {
    headers: {
      ...headers,
    },
  };
});
