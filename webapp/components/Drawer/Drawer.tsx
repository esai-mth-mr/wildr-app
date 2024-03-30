import {
  DrawerWrapper,
  Overlay,
  StyledDrawerContainer,
} from '@/components/Drawer/styles';

type DrawerProps = {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

export type OverlayProps = {
  open: boolean;
  onClick: () => void;
};

export type DrawerWrapperProps = {
  open: boolean;
};

const Drawer = ({ open, children, onClose }: DrawerProps) => {
  return (
    <>
      <Overlay open={open} onClick={onClose} />
      <DrawerWrapper open={open}>
        <StyledDrawerContainer>{children}</StyledDrawerContainer>
      </DrawerWrapper>
    </>
  );
};

export default Drawer;
