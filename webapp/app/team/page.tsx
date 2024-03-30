'use client';

import React from 'react';
import {
  StyledAchievements,
  StyledBio,
  StyledTeamContainer,
  StyledMember,
  StyledName,
  StyledTeam,
  StyledTitle,
} from './styles';
import { team, translations } from './data';
import Image from 'next/image';
import { StyledHeading2, StyledParagraph2 } from '../globalStyles';

const Team = () => (
  <StyledTeamContainer>
    <StyledHeading2>{translations.page_team_title}</StyledHeading2>
    <StyledParagraph2>{translations.page_team_desc}</StyledParagraph2>
    <StyledTeam>
      {team.map(member => (
        <StyledMember key={member.name}>
          <Image src={member.img} alt="member" />
          <div>
            <StyledName>{translations[member.name]}</StyledName>
            <StyledTitle>{translations[member.title]}</StyledTitle>
            <StyledAchievements>
              {translations[member.achievements]}
            </StyledAchievements>
            <StyledBio>{translations[member.bio]}</StyledBio>
          </div>
        </StyledMember>
      ))}
    </StyledTeam>
  </StyledTeamContainer>
);

export default Team;
