import { heading1Styles } from '@/app/globalStyles';
import { StyledHomeElementWrapper } from '@/app/styles';
import styled from 'styled-components';

export const Container = styled(StyledHomeElementWrapper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 900px;

  h1 {
    ${heading1Styles}
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    text-align: center;
    white-space: nowrap;

    span {
      font-size: inherit;
      line-height: inherit;
      color: ${({ theme }) => theme.colors.brandGreen};
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    margin: ${({ theme }) => theme.spaces.space9} auto;
  }

  p {
    text-align: center;
  }
`;

export const BottomContent = styled.div`
  padding: ${({ theme }) => `${theme.spaces.space6} ${theme.spaces.space10}`};
  background-color: ${({ theme }) => theme.colors.brandGreen};
  border-radius: 1.5rem;

  p {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
