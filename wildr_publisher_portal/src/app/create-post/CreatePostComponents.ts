'use client';
import styled from 'styled-components';
interface PostTypeTabProps {
  $activeTab?: boolean;
}

export const theme = {
  colors: {
    primary: '#888',
    active: '#45a049',
  },
  sizes: {
    small: '0.5rem',
    medium: '1rem',
    larger: '1.5rem',
  },
};
export const CreatePostContainer = styled.div`
  width: 100%;
  padding: ${theme.sizes.larger};
  border: 1px solid #ccc;
  border-radius: ${theme.sizes.medium};
  margin: ${theme.sizes.medium};
`;

export const Title = styled.h1`
  text-align: center;
  margin-bottom: ${theme.sizes.medium};
`;

export const CreatePostWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
`;

export const PostTypeWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${theme.sizes.medium};
  > * {
    &:first-child {
      margin-right: ${theme.sizes.small};
    }
    &:nth-child(2) {
      margin-left: ${theme.sizes.small};
    }
  }
`;

export const PostTypeTab = styled.span<PostTypeTabProps>`
  cursor: pointer;
  font-weight: normal;
  color: ${theme.colors.primary};
  transition: all 0.5s ease;

  ${props =>
    props.$activeTab &&
    `
    font-weight: bold;
    text-decoration: underline;
    color: ${theme.colors.active};
  `}
`;
