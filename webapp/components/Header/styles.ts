import styled from 'styled-components';
import { convertHexToRGB } from '@/app/utility';
import { WildrQRCode } from '@/assets/images';
import { desktop, tablet } from '@/mediaQueries';

/* HEADER STYLES */

export const StyledHeader = styled.header`
  width: 100%;
  padding: ${({ theme }) => `${theme.spaces.space3} ${theme.spaces.space2}`};
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(217, 226, 255, 0.13);
  z-index: 2;

  @media ${tablet} {
    padding: ${({ theme }) => `${theme.spaces.space3} ${theme.spaces.space4}`};
  }

  img[alt='logo'] {
    width: 75px;
    height: auto;

    @media ${tablet} {
      width: 90px;
    }

    @media ${desktop} {
      width: 124px;
    }
  }
`;

export const StyledLogoLink = styled.a`
  svg {
    width: 64px;

    @media ${tablet} {
      width: 112px;
    }
  }
`;

export const Separator = styled.div`
  height: 30px;
  width: 1px;
  background-color: rgba(
    ${({ theme }) => convertHexToRGB(theme.colors.primaryText)},
    0.27
  );
`;

export const StyledContent = styled.div`
  display: flex;
  align-items: center;

  & > * {
    margin-right: ${({ theme }) => theme.spaces.space3};

    &:last-child {
      margin-right: 0;
    }
  }
`;

/* QR CODE STYLES */

export const StyledQRCode = styled(WildrQRCode)`
  width: 6vw;
  height: 6vh;
`;

export const StyledModal = styled.div<{ isOpened: boolean }>`
  position: fixed;
  background-color: transparent;
  top: 50%;
  left: 50%;
  transform: ${({ isOpened }) =>
    `translate(${isOpened ? '-50%, -50%' : '50vh, -50vw'})`};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: ${({ isOpened }) => (isOpened ? '999' : '-1')};
`;

export const StyledCloseIcon = styled.div<{ isOpened: boolean }>`
  cursor: pointer;
  display: ${({ isOpened }) => (isOpened ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.primaryText};
  background-color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spaces.space2};
  transition: display 1s linear;
`;

export const StyledQRContent = styled.div<{ isOpened: boolean }>`
  display: ${({ isOpened }) => (isOpened ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spaces.space4};
  background-color: ${({ theme }) => theme.colors.brandGreen};
  box-shadow: 3px 3px 16px rgba(0, 0, 0, 0.15);
  border-radius: ${({ theme }) => theme.spaces.space2};
  transition: display 1s linear;

  h3 {
    margin-bottom: ${({ theme }) => theme.spaces.space3};
    max-width: 256px;
    text-align: center;
    color: ${({ theme }) => theme.colors.primary};
  }

  img {
    width: 160px;
    height: 160px;
  }
`;

/* HAMBURGER STYLES */

export const StyledHamburgerIcon = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 100%;

  div {
    width: 16px;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primaryText};
    margin: 2px 0;
  }
`;

export const StyledHamburgerContent = styled.ul<{
  isOpened: boolean;
  headerHeight?: number;
}>`
  position: absolute;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  top: 0;
  left: 0;
  transform: ${({ isOpened, theme }) =>
    `translate(0, ${isOpened ? `${theme.spaces.space12}` : '-1500%'})`};
  z-index: ${({ isOpened }) => (isOpened ? '4' : '1')};
  transition: transform 0.5s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ListElement = styled.li<{ active: boolean }>`
  background: ${({ active, theme }) =>
    active ? 'linear-gradient(#e5e5e5, #e5e5e5)' : theme.colors.primary};
  list-style: none;
  border-bottom: 1px solid rgba(163, 166, 183, 0.3);
  width: 100%;

  a {
    display: block;
    padding: ${({ theme }) => `${theme.spaces.space2} ${theme.spaces.space4}`};
    height: 100%;
    width: 100%;
  }
`;

/* GENERAL */

export const StyledModalBackdrop = styled.div<{ isBlur?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  backdrop-filter: ${({ isBlur = true }) => `blur(${isBlur ? '6px' : '0'})`};
  z-index: 3;
`;
