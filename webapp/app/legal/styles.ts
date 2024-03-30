import styled from 'styled-components';
import { paragraph2Styles } from '../globalStyles';

export const StyledLegalHeader = styled.div`
  padding: 12vh 0 8vh;
  border-bottom: 2px solid ${({ theme }) => theme.colors.brandGreen};
  text-align: center;

  h2 {
    margin-bottom: ${({ theme }) => theme.spaces.space3};
  }
`;

export const StyledLegalContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  -webkit-scroll-behavior: smooth;
`;

export const StyledLegalBody = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1248px;
  margin: 0 auto;
  padding: ${({ theme }) =>
    `${theme.spaces.space8} ${theme.spaces.space6} ${theme.spaces.space8}`};

  & > div > div {
    & > * {
      margin-bottom: ${({ theme }) => theme.spaces.space2};

      &:last-child {
        margin-bottom: 0;
      }
    }

    ul {
      list-style-type: lower-alpha;
      padding-left: ${({ theme }) => theme.spaces.space5};
      ${paragraph2Styles}
    }

    a {
      text-decoration: underline;
      color: ${({ theme }) => theme.colors.brandGreen};
    }
  }
`;

export const StyledTopic = styled.div`
  margin-bottom: ${({ theme }) => theme.spaces.space5};

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    text-transform: uppercase;
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    text-align: left;
  }

  & > div {
    ${paragraph2Styles}

    & > p, span, strong, h3, h4, h5, h6, div, li {
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
    }
  }
`;
