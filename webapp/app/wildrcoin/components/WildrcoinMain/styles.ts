import { paragraph1Styles } from '@/app/globalStyles';
import { desktop, mobileLandscape, tablet } from '@/mediaQueries';
import Image from 'next/image';
import styled, { keyframes } from 'styled-components';

/* BACKGROUND */

const ripple = keyframes`
  0% { transform: scale(0); opacity: 0 }
  50% { opacity: 1 }
  100% { transform: scale(1); opacity: 1 }
`;

const coinMainDrop = keyframes`
  0% { box-shadow: -26px 34px 41px 1px rgba(76, 54, 0, 0.54); transform: skewY(10deg) }
  100% { box-shadow: none; transform: skewY(0deg); background: none }
`;

const coin1Drop = keyframes`
  0% { box-shadow: -26px 34px 41px 1px rgba(76, 54, 0, 0.54); transform: skewX(15deg) }
  100% { box-shadow: none; transform: skewX(0deg) rotate(-25deg); background: none }
`;

const coin2Drop = keyframes`
  0% { box-shadow: -26px 34px 41px 1px rgba(76, 54, 0, 0.54); transform: skewX(15deg) }
  100% { box-shadow: none; transform: skewX(0deg) rotate(-10deg); background: none }
`;

const coin3Drop = keyframes`
  0% { box-shadow: -26px 34px 41px 1px rgba(76, 54, 0, 0.54); transform: skewX(5deg) }
  100% { box-shadow: none; transform: skewX(0deg) rotate(95deg); background: none }
`;

const coin4Drop = keyframes`
  0% { box-shadow: -26px 34px 41px 1px rgba(76, 54, 0, 0.54); transform: skewX(15deg) }
  100% { box-shadow: none; transform: skewX(0deg) rotate(-75deg); background: none }
`;

export const MainBg = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 550px;
  background: linear-gradient(
    rgb(255, 252, 246) 0%,
    rgb(255, 252, 246) 35%,
    rgb(255, 255, 255) 70%,
    rgba(255, 255, 255, 1) 100%
  );
  z-index: -1;

  @media ${tablet} {
    height: 100vh;
  }
`;

export const MainCoin = styled(Image)`
  position: relative;
  width: 11.5rem;
  height: 11.5rem;
  margin: ${({ theme }) =>
    `${theme.spaces.space5} auto ${theme.spaces.space9}`};
  border-radius: 50%;
  background: rgba(240, 176, 22, 0.8);
  animation: ${coinMainDrop} 1s linear 1;
  animation-fill-mode: forwards;

  @media ${mobileLandscape} {
    margin: ${({ theme }) =>
      `${theme.spaces.space16} auto ${theme.spaces.space9}`};
  }

  @media ${tablet} {
    position: absolute;
    top: 24.25rem;
    right: 8.5rem;
    z-index: 5;
    margin: 0;
  }
`;

export const Coin1 = styled(Image)`
  display: none;
  position: absolute;
  top: 18rem;
  right: 30rem;
  z-index: 5;
  width: 3.75rem;
  height: 3.75rem;
  transform: rotate(-45deg);
  opacity: 0.7;
  border-radius: 50%;
  background: rgba(240, 176, 22, 0.8);
  animation: ${coin1Drop} 1s linear 1;
  animation-fill-mode: forwards;

  @media ${desktop} {
    display: block;
  }
`;

export const Coin2 = styled(Image)`
  display: none;
  position: absolute;
  top: 6rem;
  right: 38rem;
  z-index: 5;
  width: 3.75rem;
  height: 3.75rem;
  transform: rotate(-15deg);
  opacity: 0.2;
  border-radius: 50%;
  background: rgba(240, 176, 22, 0.8);
  animation: ${coin2Drop} 1s linear 1;
  animation-fill-mode: forwards;

  @media ${tablet} {
    display: block;
  }
`;

export const Coin3 = styled(Image)`
  display: none;
  position: absolute;
  top: 50rem;
  right: 10rem;
  z-index: 5;
  width: 3.75rem;
  height: 3.75rem;
  opacity: 0.65;
  border-radius: 50%;
  background: rgba(240, 176, 22, 0.8);
  animation: ${coin3Drop} 1s linear 1;
  animation-fill-mode: forwards;

  @media ${tablet} {
    display: block;
  }
`;

export const Coin4 = styled(Image)`
  display: none;
  position: absolute;
  top: 50rem;
  right: 40rem;
  z-index: 5;
  width: 3.75rem;
  height: 3.75rem;
  transform: rotate(45deg);
  opacity: 0.2;
  border-radius: 50%;
  background: rgba(240, 176, 22, 0.8);
  animation: ${coin4Drop} 1s linear 1;
  animation-fill-mode: forwards;

  @media ${tablet} {
    display: block;
  }
`;

export const Circle1 = styled.div`
  position: absolute;
  top: 12rem;
  right: calc(50vw - 21.25rem / 2);
  border-radius: 50%;
  background-color: rgba(255, 184, 0, 0.14);
  width: 21.25rem;
  height: 21.25rem;
  z-index: -1;
  opacity: 0;
  animation: ${ripple} 4s ease-out 4s;
  animation-delay: 1s, 2s;
  animation-fill-mode: forwards;

  @media ${tablet} {
    transform: translate(-50%, -50%);
    top: 19.125rem;
    right: 3.75rem;
    transform: unset;
  }
`;

export const Circle2 = styled.div`
  position: absolute;
  top: 5rem;
  right: calc(50vw - 35.5rem / 2);
  background-color: rgba(255, 184, 0, 0.11);
  border-radius: 50%;
  width: 35.5rem;
  height: 35.5rem;
  opacity: 0;
  z-index: -1;
  animation: ${ripple} 4s ease-out 3.5s;
  animation-delay: 0.2s, 1s;
  animation-fill-mode: forwards;

  @media ${tablet} {
    transform: translate(-50%, -50%);
    top: 11.75rem;
    right: -2.875rem;
    transform: unset;
  }
`;

export const Circle3 = styled.div`
  position: absolute;
  top: -3rem;
  right: calc(50vw - 51.125rem / 2);
  width: 51.125rem;
  height: 51.125rem;
  border-radius: 50%;
  background-color: rgba(255, 184, 0, 0.07);
  z-index: -1;
  opacity: 0;
  animation: ${ripple} 4s ease-out 3s;
  animation-delay: 1s, 0.5s;
  animation-fill-mode: forwards;

  @media ${tablet} {
    transform: translate(-50%, -50%);
    top: 4rem;
    right: -10.625rem;
    transform: unset;
  }
`;

/* CONTENT */

export const StyledMainWildrcoinContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 ${({ theme }) => theme.spaces.space4};
  z-index: 1;

  @media ${tablet} {
    display: grid;
    grid-template-columns: repeat(1, 342px);
    padding: 15rem 7.75rem 6.5rem;
  }

  @media ${desktop} {
    grid-template-columns: repeat(1, 680px);
  }

  h1 {
    margin-bottom: ${({ theme }) => theme.spaces.space2};
    text-align: center;

    @media ${desktop} {
      text-align: left;
    }
  }
`;

export const StyledWildrcoinDescription = styled.p`
  margin-bottom: ${({ theme }) => theme.spaces.space8};
  text-align: center;
  ${paragraph1Styles}

  @media ${desktop} {
    text-align: left;
  }

  span {
    font-size: inherit;
    line-height: inherit;
    font-weight: 700;
  }
`;
