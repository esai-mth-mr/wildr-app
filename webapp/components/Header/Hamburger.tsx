import { StyledParagraph3 } from '@/app/globalStyles';
import Drawer from '@/components/Drawer/Drawer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import {
  ListElement,
  StyledHamburgerIcon,
  StyledModalBackdrop,
} from './styles';

interface Props {
  headerHeight?: number;
}

const links = [
  {
    name: 'Home',
    path: '/',
  },
  {
    name: 'Waitlist',
    path: '/wildrcoin',
  },
  {
    name: 'Team',
    path: '/team',
  },
  {
    name: 'Contact',
    path: '/contact',
  },
  {
    name: 'Get Wildr',
    path: '/download',
  },
];

export const Hamburger: React.FC<Props> = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const pathname = usePathname();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <>
      <StyledHamburgerIcon onClick={open}>
        <div />
        <div />
        <div />
      </StyledHamburgerIcon>
      <Drawer open={isOpen} onClose={close}>
        {links.map(({ name, path }) => (
          <ListElement active={pathname === path} key={path}>
            <Link href={path} onClick={close}>
              <StyledParagraph3>{name}</StyledParagraph3>
            </Link>
          </ListElement>
        ))}
      </Drawer>
      {isOpen && <StyledModalBackdrop isBlur={false} onClick={close} />}
    </>
  );
};
