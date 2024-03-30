import {
  engage_video,
  great_content,
  user_male,
  way1,
  way1_bg,
  way3,
  way3_bg,
  way4_bg,
  way_engage,
} from '@/assets/images';

export const WILDRCOIN_AVAILABLE = true;

export const wildrcoinTranslations = {
  page_wildrcoin_title: 'Start earning cash on Wildr',
  page_wildrcoin_description1: 'WildrCoin —',
  page_wildrcoin_description: ' everyone gets paid',
  page_wildrcoin_btn: 'Join waitlist',
  page_wildrcoin_input_placeholder: 'Email address',
  page_wildrcoin_link_desc: 'By clicking Join waitlist, you are accepting our ',
  page_wildrcoin_link: 'Terms and Conditions',
  page_wildrcoin_ways_title: 'Ways you can earn on the Wildr app',
  page_wildrcoin_ways_content_title: 'Create and share great content',
  page_wildrcoin_ways_content_description: 'Get rewarded for what you create',
  page_wildrcoin_ways_friends_title: 'Invite your friends',
  page_wildrcoin_ways_friends_description:
    'Get paid to have your friends join Wildr. (Fun fact: they earn too!)',
  page_wildrcoin_ways_ads_title: 'Engage to earn',
  page_wildrcoin_ways_ads_description: 'Get paid when you are active on Wildr',
  page_wildrcoin_form_error_general:
    'Sorry, we are having some trouble. Please try joining again',
  page_wildrcoin_form_error_email: 'Please enter a valid email address',
  page_wildrcoin_success:
    'Congrats, you are on the waitlist! We will email an invitation once WildrCoin is available for you.',
  page_wildrcoin_join_title: 'Join the waitlist! ',
  page_wildrcoin_join_description:
    'Get a head start and download the app now to join.',
  page_wildrcoin_join_scan: 'Scan to get started',
};

export enum WILDRCOIN_FORM_ERROR {
  GENERAL = 'page_wildrcoin_form_error_general',
  EMAIL = 'page_wildrcoin_form_error_email',
}

export const waysToEarn = [
  {
    title: wildrcoinTranslations.page_wildrcoin_ways_content_title,
    description: wildrcoinTranslations.page_wildrcoin_ways_content_description,
    icon: great_content,
    img: way1,
    bg: way1_bg,
  },
  {
    title: wildrcoinTranslations.page_wildrcoin_ways_ads_title,
    description: wildrcoinTranslations.page_wildrcoin_ways_ads_description,
    icon: engage_video,
    img: way_engage,
    bg: way4_bg,
  },
  {
    title: wildrcoinTranslations.page_wildrcoin_ways_friends_title,
    description: wildrcoinTranslations.page_wildrcoin_ways_friends_description,
    icon: user_male,
    img: way3,
    bg: way3_bg,
  },
];
