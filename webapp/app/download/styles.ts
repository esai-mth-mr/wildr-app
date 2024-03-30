import { desktop, tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledDownloadContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  padding: ${({ theme }) => `${theme.spaces.space4} ${theme.spaces.space6}`};

  & > div {
    max-width: 614px;
  }

  @media ${tablet} {
    flex-direction: row;
  }
`;

export const StyledQRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.space4};
  background-color: ${({ theme }) => theme.colors.brandGreen};
  border-radius: 16px;
  margin-bottom: ${({ theme }) => theme.spaces.space4};

  @media ${tablet} {
    width: 294px;
    margin-left: ${({ theme }) => theme.spaces.space14};
    margin-bottom: 0;
  }

  svg {
    width: 150px;
    height: 150px;

    @media ${desktop} {
      width: 228px;
      height: 228px;
    }
  }

  p {
    color: ${({ theme }) => theme.colors.primary};
    margin-top: ${({ theme }) => theme.spaces.space2};
    white-space: nowrap;
  }
`;
