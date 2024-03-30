import { DrawerWrapperProps, OverlayProps } from '@/components/Drawer/Drawer';
import styled from 'styled-components';

export const DrawerWrapper = styled.div<DrawerWrapperProps>`
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  z-index: 5;
  background: white;
  transform: translateX(100%);
  transition: transform 250ms ease-in-out;
  ${props => props.open && `transform: translateX(0);`}
`;

export const Overlay = styled.div<OverlayProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 4;
  display: ${props => (props.open ? 'block' : 'none')};
`;

export const StyledDrawerContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // TODO use var
  background-color: #fff;
  position: relative;
`;
