'use client';
import {
  Avatar,
  ProfileContainer,
  StatItem,
  StatLabel,
  StatsContainer,
  StatValue,
  UserEmail,
  UserInfo,
  UserName,
  Title,
} from '@/app/components/UserData/UserDataComponents';
import { useState } from 'react';
import { getCookie } from 'cookies-next';
import { useQuery } from '@apollo/client';
import { GET_USER } from '@/graphql/queries';
import { AVATAR_PLACEHOLDER, USER_ID } from '@/app/utils/constants';
import { userDataTranslations } from '@/app/components/UserData/UserDataLanguages';
import { useAuth } from '@/app/context/AuthContext';

interface UserData {
  avatarImage: {
    uri: string;
  };
  name: string;
  email: string;
  stats: {
    followerCount: number;
    followingCount: number;
    innerCircleCount: number;
    joinedChallengesCount: number;
    postCount: number;
  };
}

const UserData = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { language } = useAuth();
  const { loading, error, data } = useQuery(GET_USER, {
    variables: {
      input: {
        id: getCookie(USER_ID),
      },
    },
    onCompleted: queryData => {
      setUserData(queryData.getUser.user);
    },
  });
  if (loading) {
    return (
      <ProfileContainer>
        <Title>{userDataTranslations[language].loading}</Title>
      </ProfileContainer>
    );
  }
  if (error) {
    return (
      <ProfileContainer>
        <Title>{userDataTranslations[language].error}</Title>
      </ProfileContainer>
    );
  }
  return (
    <ProfileContainer>
      <Title>{userDataTranslations[language].welcomeTitle}</Title>
      {userData?.avatarImage.uri ? (
        <Avatar src={userData?.avatarImage.uri} alt="User Avatar" />
      ) : (
        <Avatar src={AVATAR_PLACEHOLDER} alt="User Avatar Placeholder" />
      )}
      <UserInfo>
        <UserName>{userData?.name}</UserName>
        <UserEmail>{userData?.email}</UserEmail>
      </UserInfo>
      <StatsContainer>
        <StatItem>
          <StatLabel>{userDataTranslations[language].followersStats}</StatLabel>
          <StatValue>{userData?.stats.followerCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>{userDataTranslations[language].followingStats}</StatLabel>
          <StatValue>{userData?.stats.followingCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>
            {userDataTranslations[language].innerCircleStats}
          </StatLabel>
          <StatValue>{userData?.stats.innerCircleCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>
            {userDataTranslations[language].challengesStats}
          </StatLabel>
          <StatValue>{userData?.stats.joinedChallengesCount}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>{userDataTranslations[language].postsStats}</StatLabel>
          <StatValue>{userData?.stats.postCount}</StatValue>
        </StatItem>
      </StatsContainer>
    </ProfileContainer>
  );
};

export default UserData;
