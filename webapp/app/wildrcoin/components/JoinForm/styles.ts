import { StyledParagraph2 } from '@/app/globalStyles';
import { join_bg } from '@/assets/images';
import { desktop } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledJoinForm = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 1080px;
  width: 100%;
  padding: ${({ theme }) => theme.spaces.space7} 0;
  background: url(${join_bg.src}) no-repeat center/cover;

  @media ${desktop} {
    flex-direction: row;
    margin-bottom: ${({ theme }) => theme.spaces.space16};
  }
`;

export const StyledFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  padding: ${({ theme }) => theme.spaces.space6};

  h2 {
    margin-bottom: ${({ theme }) => theme.spaces.space1};
    text-align: inherit;
  }

  @media ${desktop} {
    max-width: 508px;
    margin-right: ${({ theme }) => theme.spaces.space10};
    align-items: flex-start;
    padding: 0;
    text-align: left;
  }
`;

export const StyledJoinDescription = styled(StyledParagraph2)`
  margin-bottom: ${({ theme }) => theme.spaces.space2};
  text-align: inherit;
`;

export const StyledJoinQR = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spaces.space5};
  border-radius: 0.5rem;
  box-shadow: 2px 2px 16px 0px #00000029;

  svg {
    width: 168px;
    height: 168px;
  }

  div {
    position: absolute;
    bottom: calc((-1rem - 1.5rem) / 2);
    left: 50%;
    transform: translateX(-50%);
    background-color: ${({ theme }) => theme.colors.primaryText};
    padding: ${({ theme }) => `${theme.spaces.space1} ${theme.spaces.space2}`};
    border-radius: 0.375rem;

    p {
      color: ${({ theme }) => theme.colors.primary};
      white-space: nowrap;
    }
  }
`;

export const StyledJoinLinks = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  grid-row-gap: ${({ theme }) => theme.spaces.space2};

  a {
    height: fit-content;

    & > img {
      width: 168px;
      height: 50px;
    }
  }
`;
