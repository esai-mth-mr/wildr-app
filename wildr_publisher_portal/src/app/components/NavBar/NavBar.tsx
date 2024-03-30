'use client';
import Link from 'next/link';
import {
  theme,
  SideMenuContainer,
  Title,
  List,
  ListElement,
  NavLink,
} from '@/app/components/NavBar/NavBarComponents';
import { ThemeProvider } from 'styled-components';
import { Button } from '@/app/components/SignInForm/SignInFormComponents';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const NavBar = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const handleSignOut = () => {
    signOut();
    router.push('/sign-in');
  };
  return (
    <ThemeProvider theme={theme}>
      <SideMenuContainer>
        <Title>Menu</Title>
        <List>
          <ListElement>
            <Link href="/feed" passHref>
              <NavLink>All Feed</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Link href="/all-posts" passHref>
              <NavLink>All Posts</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Link href="/create-post" passHref>
              <NavLink>Create Post</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Link href="/comments" passHref>
              <NavLink>Comments</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Link href="/team" passHref>
              <NavLink>Team</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Link href="/settings" passHref>
              <NavLink>Settings</NavLink>
            </Link>
          </ListElement>
          <ListElement>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </ListElement>
        </List>
      </SideMenuContainer>
    </ThemeProvider>
  );
};

export default NavBar;
