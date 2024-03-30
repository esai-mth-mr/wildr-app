import { StyledHomeElementWrapper } from '@/app/styles';
import { tablet } from '@/mediaQueries';
import styled from 'styled-components';

export const StyledFrameContainer = styled(StyledHomeElementWrapper)`
  display: flex;
  flex-direction: column;
  max-width: 1200px;
`;

export const StyledFrame = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column-reverse;
  width: 100%;
  grid-column-gap: ${({ theme }) => theme.spaces.space18};
  grid-row-gap: ${({ theme }) => theme.spaces.space3};
  padding: ${({ theme }) => `${theme.spaces.space9} 0`};

  @media ${tablet} {
    flex-direction: row;

    &:nth-child(odd) {
      flex-direction: row-reverse;
    }

    & > * {
      max-width: 50%;
    }
  }

  h2 {
    margin-bottom: ${({ theme }) => theme.spaces.space2};
  }

  button {
    background-color: #fec34f;
    border-radius: 0.5rem;
    padding: ${({ theme }) => `${theme.spaces.space2} ${theme.spaces.space3}`};
    margin-top: ${({ theme }) => theme.spaces.space2};
    border: none;
  }
`;

export const StyledImageWrapper = styled.div`
  position: relative;
  width: 100%;

  @media ${tablet} {
    width: 50%;
  }

  img[alt='frame_img'] {
    width: 100%;
    height: fit-content;
  }

  img[alt='icon'] {
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(50%, -50%);
    width: 7.5rem;
    height: 7.5rem;
  }
`;
