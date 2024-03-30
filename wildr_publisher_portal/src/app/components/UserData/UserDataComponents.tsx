import styled from 'styled-components';

export const theme = {
  colors: {
    primary: '#888',
  },
  sizes: {
    small: '0.5rem',
    medium: '1rem',
    larger: '1.5rem',
  },
};

export const ProfileContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: ${theme.sizes.larger};
  border: 1px solid #ccc;
  border-radius: ${theme.sizes.medium};
  margin: ${theme.sizes.medium};
`;
export const Title = styled.h1`
  margin-bottom: ${theme.sizes.medium};
`;

export const Avatar = styled.img`
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  margin-bottom: ${theme.sizes.medium};
`;

export const UserInfo = styled.div`
  text-align: center;
  margin-bottom: ${theme.sizes.medium};
`;

export const UserName = styled.h2`
  margin-bottom: ${theme.sizes.small};
`;

export const UserEmail = styled.p`
  color: ${theme.colors.primary};
  margin-bottom: ${theme.sizes.medium};
`;

export const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
`;

export const StatItem = styled.div`
  text-align: center;
`;

export const StatLabel = styled.p`
  margin-bottom: ${theme.sizes.small};
  color: ${theme.colors.primary};
`;

export const StatValue = styled.h3`
  margin-bottom: ${theme.sizes.small};
`;
