import styled from 'styled-components';

export const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.primary};
`;

export const StyledHomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const StyledHomeElementWrapper = styled.div`
  padding: ${({ theme }) => theme.spaces.space9} 0;
  margin: 0 ${({ theme }) => theme.spaces.space6};
`;
