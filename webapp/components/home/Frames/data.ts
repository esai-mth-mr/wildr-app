import { translations } from '@/app/homeData';
import {
  frame1,
  frame1Top,
  frame2,
  frame2Top,
  frame3,
  frame3Top,
  frame4,
  frame4Top,
  frame5,
  frame5Top,
} from '@/assets/images';

export const frames = [
  {
    img: frame1,
    title: translations.page_home_frame1_title,
    description: translations.page_home_frame1_description,
    icon: frame1Top,
  },
  {
    img: frame2,
    title: translations.page_home_frame2_title,
    description: translations.page_home_frame2_description,
    icon: frame2Top,
  },
  {
    img: frame3,
    title: translations.page_home_frame3_title,
    description: translations.page_home_frame3_description,
    icon: frame3Top,
  },
  {
    img: frame4,
    title: translations.page_home_frame4_title,
    description: translations.page_home_frame4_description,
    icon: frame4Top,
  },
  {
    img: frame5,
    title: translations.page_home_frame5_title,
    description: translations.page_home_frame5_description,
    wildrcoinCta: true,
    wildrcoinCtaText: translations.page_home_frame5_cta,
    icon: frame5Top,
  },
];
