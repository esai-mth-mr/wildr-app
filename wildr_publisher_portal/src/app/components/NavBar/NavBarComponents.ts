import styled from 'styled-components';
export const theme = {
  colors: {
    background: '#333',
    text: '#fff',
    linkBackground: '#444',
    linkHoverBackground: '#555',
  },
  fonts: {
    size: '1.5rem',
    margin: '1.25rem',
    padding: '1rem',
  },
};

export const SideMenuContainer = styled.div`
  background-color: ${theme.colors.background};
  padding: ${theme.fonts.padding};
  width: 15rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Title = styled.h2`
  color: ${theme.colors.text};
  font-size: ${theme.fonts.size};
  margin-bottom: ${theme.fonts.margin};
`;

export const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const ListElement = styled.li`
  margin-bottom: ${theme.fonts.margin};
`;

export const NavLink = styled.span`
  text-decoration: none;
  color: ${theme.colors.text};
  display: block;
  padding: ${theme.fonts.padding};
  background-color: ${theme.colors.linkBackground};
  border-radius: 0.3125rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${theme.colors.linkHoverBackground};
  }
`;
