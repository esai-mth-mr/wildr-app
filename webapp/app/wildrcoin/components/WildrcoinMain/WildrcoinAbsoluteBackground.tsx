import React from 'react';
import {
  Circle1,
  Circle2,
  Circle3,
  Coin1,
  Coin2,
  Coin3,
  Coin4,
  MainBg,
  MainCoin,
} from './styles';
import { coin } from '@/assets/images';

export const WildrcoinAbsoluteBackground: React.FC = () => {
  return (
    <>
      <MainBg />
      <MainCoin src={coin} alt="main coin" priority={true} />
      <Coin1 src={coin} alt="coin" priority={true} />
      <Coin2 src={coin} alt="coin" priority={true} />
      <Coin3 src={coin} alt="coin" priority={true} />
      <Coin4 src={coin} alt="coin" priority={true} />
      <Circle1 />
      <Circle2 />
      <Circle3 />
    </>
  );
};
