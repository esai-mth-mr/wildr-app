'use client';

import React, { useState } from 'react';
import {
  StyledCloseIcon,
  StyledModal,
  StyledModalBackdrop,
  StyledQRCode,
  StyledQRContent,
} from './styles';
import { createPortal } from 'react-dom';
import { CloseIcon, WildrQRCode } from '@/assets/images';
import { useTheme } from 'styled-components';
import { StyledHeading3 } from '@/app/globalStyles';

export const QRCode: React.FC = () => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const theme = useTheme();

  const openModal = () => setIsHovered(true);
  const closeModal = () => setIsHovered(false);

  const modal = createPortal(
    <>
      <StyledModal isOpened={isHovered}>
        <StyledCloseIcon onClick={closeModal} isOpened={isHovered}>
          <CloseIcon />
        </StyledCloseIcon>
        <StyledQRContent isOpened={isHovered}>
          <StyledHeading3>Scan to get Wildr</StyledHeading3>
          <WildrQRCode color={theme.colors.primary} />
        </StyledQRContent>
      </StyledModal>
      {isHovered && <StyledModalBackdrop />}
    </>,
    document.body
  );

  return (
    <>
      <StyledQRCode onMouseOver={openModal} />
      {modal}
    </>
  );
};
