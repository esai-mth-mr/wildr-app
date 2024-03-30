import React from 'react';
import { wildrcoinTranslations } from '../../data';
import {
  StyledMainWildrcoinContent,
  StyledWildrcoinDescription,
} from './styles';
import { WildrcoinAbsoluteBackground } from './WildrcoinAbsoluteBackground';
import { WildrcoinForm } from '../WildrcoinForm';
import { StyledHeading1 } from '@/app/globalStyles';

export const WildrcoinMain: React.FC = () => {
  return (
    <>
      <StyledMainWildrcoinContent>
        <WildrcoinAbsoluteBackground />
        <StyledHeading1>
          {wildrcoinTranslations.page_wildrcoin_title}
        </StyledHeading1>
        <StyledWildrcoinDescription>
          <span>{wildrcoinTranslations.page_wildrcoin_description1}</span>
          {wildrcoinTranslations.page_wildrcoin_description}
        </StyledWildrcoinDescription>
        <WildrcoinForm />
      </StyledMainWildrcoinContent>
    </>
  );
};
