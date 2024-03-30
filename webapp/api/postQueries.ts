import { gql } from '@apollo/client';

const GET_FEED = gql`
  query GetFeed {
    feed {
      id
    }
  }
`;

export { GET_FEED };
