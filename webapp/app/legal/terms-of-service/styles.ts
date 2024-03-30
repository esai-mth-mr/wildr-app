import styled from 'styled-components';

export const StyledTermsIntro = styled.div`
  margin-bottom: ${({ theme }) => theme.spaces.space4};

  a {
    color: ${({ theme }) => theme.colors.brandGreen};
    text-decoration: underline;
  }
`;
