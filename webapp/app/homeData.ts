import { melissa, robinSingh } from '@/assets/images';
import { StaticImageData } from 'next/image';

export const translations: { [key: string]: string } = {
  page_home_quote_1_text:
    '“The current model of monetization and online advertising is so ancient that it belongs in a museum. We are fundamentally changing the way content creators connect with their audience, get noticed, and get paid.”',
  page_home_quote_1_author: 'Melissa Ravi, COO & Co-founder',
  page_home_quote_1_position: '(ex PayPal, Visa, Deutsche Bank)',
  page_home_quote_2_text:
    '“Wildr and its troll-free environment is transformative. Imagine if athletes, fans and the whole cricketing community could connect globally without being subject to abuse online. Its up to us to make this a reality, which is why I\u0027ve joined Wildr, the world\u0027s first zero-toxicity social media app.”',
  page_home_quote_2_author: 'Robin Singh',
  page_home_quote_2_position: 'Indian Cricketer and Coach',
  page_home_main_title: 'Got Trolled? Join Wildr.',
  page_home_main_description:
    'The world\u0027s first truly positive, non-toxic social network forreal people with real stories. Connect meaningfully without the hate.',
  page_home_main_p_green: 'No toxicity, no abuse, no trolls.',
  page_home_main_download: 'Download Wildr',
  page_home_frame1_title: 'Wildr Verified to keep it Real',
  page_home_frame1_description:
    'Every comment, every reply is 100% real. With Wildr Verified, we keep the bots away and make sure you only see real people with real stories.',
  page_home_frame2_title: 'Have fun with Challenges',
  page_home_frame2_description:
    'Every comment, every reply is 100% real. With Wildr Verified, we keep the bots away and make sure you only see real people with real stories.',
  page_home_frame3_title: 'AI that works for you',
  page_home_frame3_description:
    'Our AI works tirelessly to help keep Wildr a troll-free space. Feel the difference of a cleaner, kinder vibe.',
  page_home_frame4_title: 'Create your Inner Circle',
  page_home_frame4_description:
    'Cherish privacy? Share your moments exclusively with your closest people.',
  page_home_frame5_title: 'Monetization 3.0 - Everyone Earns',
  page_home_frame5_description:
    'On Wildr, you earn when you engage. We believe in rewarding both our creators and our community.',
  page_home_frame5_cta: 'Join waitlist',
  page_home_why_title: 'Why Wildr?',
  page_home_why_p:
    'I have closely experienced how negativity and hate comments can affect one\u0027s mental health. I\u0027m happy to see that on Wildr, we can have a safe space on the internet where we can just be ourselves.',
  page_home_why_person: 'Vidit Gujrathi, Chess Champion',
  page_home_edge_title: '<h1>The <span>Wildr</span> Edge</h1>',
  page_home_edge1_title: 'Toxicity-Free',
  page_home_edge1_description:
    'Our sophisticated AI takes away the right to comment from cyber bullies and trolls.',
  page_home_edge2_title: 'Verified Users',
  page_home_edge2_description:
    'Every user who wishes to converse has to get real ID verified.',
  page_home_edge3_title: 'Real Posts',
  page_home_edge3_description:
    'A positive-reward ecosystem that encourages you to be real and empathetic.',
  page_home_edge4_title: 'Creator Focused',
  page_home_edge4_description:
    'Radical and cutting-edge monetization technology for content creators and consumers.',
  page_home_authentic_title: '<h1>The <span>Authentic</span> Network</h1>',
  page_home_authentic_p:
    'When your brain gets empty pleasure without any effort, it keeps you artificially high and restless. Wildr\u0027s positive reward system (real people, real posts, and real monetization) changes that for every user.',
  page_home_authentic_bottom_p:
    'We are the first social network that goes beyond transient and empty entertainment by empowering creators to not only connect meaningfully with their audience but also monetize their content within the app. Thus focusing on value and not likes.',
};

export type QuoteType = {
  img: StaticImageData;
  text: string;
  author: string;
  position: string;
};

export const quotes: Array<QuoteType> = [
  {
    img: melissa,
    text: translations.page_home_quote_1_text,
    author: translations.page_home_quote_1_author,
    position: translations.page_home_quote_1_position,
  },
  {
    img: robinSingh,
    text: translations.page_home_quote_2_text,
    author: translations.page_home_quote_2_author,
    position: translations.page_home_quote_2_position,
  },
];
