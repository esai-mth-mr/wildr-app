import { analytics } from '@/analytics';
import { ToxicityResults } from '@/types/tweet';
import { logEvent } from 'firebase/analytics';
import Image from 'next/image';
import { useEffect } from 'react';
import Metric from './Metric';
import UserCard from './UserCard';

type ResultsCardProps = {
  name: string;
  results: ToxicityResults;
  showTopToxicUsers: boolean;
  topRight?: React.ReactNode;
  bottom?: React.ReactNode;
};

const mbtiToName: { [mbti: string]: { title: string; description: string } } = {
  TDHR: {
    title: 'ABSOLUTE TRASH',
    description:
      "Call the therapist because this is the worst result we have available in our system. Your feed contains all four types of toxicity and we genuinely want to know if you're doing okay.",
  },
  TDHP: {
    title: 'PASSIVE AGGRESSIVE',
    description:
      "According to our analysis.... you just like to see people complain. Your feed is for sure toxic, but not towards anyone in particular. This isn't the worst result, but it's certainly not good.",
  },
  TDNR: {
    title: 'NEEDS TO GET A LIFE',
    description:
      "Your feed is full of people that love to roast others using as many curse words as possible. They've got too much time on their hands and we suggest you don't go down their path.",
  },
  TDNP: {
    title: 'NEEDS TO TAKE A CHILL PILL',
    description:
      'Have you been feeling stressed lately? Because your feed is full of people who love to freak out over everything. We hope you take some time off Twitter and get a peace of mind.',
  },
  TCHR: {
    title: 'SILENT BUT DEADLY',
    description:
      "You probably haven't noticed how toxic your feed is because these types of posts seem fine on the surface, but are actually  harmful. We suggest you take a closer look and reassess your feed.",
  },
  TCNR: {
    title: 'JUST HATES PEOPLE',
    description:
      "The people on your feed love posting unwarranted insults. There's no reasoning or logic behind it, they just hate people. We suggest you give all of them a virtual hug.",
  },
  TCHP: {
    title: 'INCEL VIBES',
    description:
      "The people on your feed love to hate others based on who they are. We wouldn't be surprised if you're used to seeing long threads of pointless arguments. You deserve better.",
  },
  TCNP: {
    title: 'PURE TROLL',
    description:
      "Pure trolls can piss anyone off without even using curse words or insults. They've mastered the art of trolling and your feed is full of them. Email us and we'll send you some Advil for your headaches.",
  },
  LDHR: {
    title: 'SNIPER',
    description:
      'Snipers cook up the most personal and hurtful tweet and wait for the right time to strike. It seems you follow quite a bit of them and we suggest that you stay low and avoid the blow.',
  },
  LDHP: {
    title: 'ATTENTION SEEKER',
    description:
      'Your feed is full of desperate cries for help. These types of people love to stir up controversy for attention. We hope you put these attention seekers on snooze and live your best life.',
  },
  LDNR: {
    title: 'DISS TRACK RAPPER',
    description:
      "Your feed is best described as “toxic with taste.” These toxic posts are crafted meticulously to roast the s*** out of someone. We hope that you're not part of someone's diss track anytime soon.",
  },
  LDNP: {
    title: 'SAILOR MOUTH',
    description:
      "People on your feed love to crack out the Urban Dictionary and go to town. You've probably got a bit of a dirty mind and we just hope you're careful not to use this language at work.",
  },
  LCHR: {
    title: 'FOX NEWS VIBES',
    description:
      'Ring ring, FOX News is calling and they want their Twitter back. You follow people who tend to attack others for their identity. We hope you can inject some kindness and love back into your feed.',
  },
  LCNR: {
    title: 'A LIL SALTY',
    description:
      'Just a little roast never hurt nobody? Your feed has people who like to make low-level insults towards others. We suggest you make the escape before it gets worse.',
  },
  LCHP: {
    title: 'JUST PLAIN RACIST',
    description:
      "This is probably a tough pill to swallow, but your feed is full of bigots. If you weren't aware of this before, we hope you take this opportunity to cleanse your Twitter feed.",
  },
  LCNP: {
    title: 'PEACEMAKER',
    description:
      "There is little to no toxicity on your feed and you're probably the sweetest angel to grace the Earth. You deserve the absolute best and we think you'd find yourself at home here on Wildr.",
  },
};

function calculateMBTI(results: ToxicityResults): {
  mbti: string;
  mbtiTitle: string;
  mbtiDescription: string;
} {
  const { tox, obs, idn, ins } = results.metrics!;

  let mbti: string;
  tox >= 0.5 ? (mbti = 'T') : (mbti = 'L');
  obs >= 0.5 ? (mbti += 'D') : (mbti += 'C');
  idn >= 0.5 ? (mbti += 'H') : (mbti += 'N');
  ins >= 0.5 ? (mbti += 'R') : (mbti += 'P');

  return {
    mbti,
    mbtiTitle: mbtiToName[mbti].title,
    mbtiDescription: mbtiToName[mbti].description,
  };
}

export default function ResultsCard({
  name,
  results,
  showTopToxicUsers,
  topRight,
  bottom,
}: ResultsCardProps) {
  const { mbti, mbtiTitle, mbtiDescription } = calculateMBTI(results);

  useEffect(() => {
    logEvent(analytics, 'GetDetoxScoreSuccess', {
      mbti,
      results,
    });
  }, [mbti, results]);

  return (
    <article className='flex flex-col items-center p-4 sm:p-8 lg:pt-20'>
      <div className='relative z-10 aspect-square w-24 lg:-m-20 lg:w-36 lg:rounded-full lg:border-8 lg:border-black lg:bg-wildr-gray-1000'>
        <Image
          className='lg:p-4'
          src={`/icons/mbti/${mbti.toLowerCase()}.webp`}
          alt='Icon for MBTI.'
          fill
          priority
        />
      </div>

      <div className='relative mt-4 w-full max-w-screen-xl md:rounded-xl lg:bg-wildr-gray-1000 lg:px-8 lg:pt-20 lg:pb-8'>
        <div className='absolute top-0 right-0'>{topRight}</div>

        <h1 className='flex flex-col items-center gap-4 text-center text-xs font-semibold uppercase sm:text-base lg:text-2xl'>
          {name}, your toxicity MBTI is{' '}
          <span className='text-2xl text-wildr-emerald-500 sm:text-4xl lg:text-6xl'>
            <span className='text-wildr-emerald-1000'>{mbti}: </span>
            {mbtiTitle}
          </span>
        </h1>

        <section className='mt-4 flex w-full flex-col items-center gap-5 sm:mt-8 sm:gap-8'>
          <p className='max-w-md text-center font-body text-xs sm:max-w-screen-sm sm:text-base lg:max-w-screen-md lg:text-2xl'>
            {mbtiDescription}
          </p>

          <div className='flex w-full flex-col gap-5 md:grid md:grid-cols-2 md:gap-8'>
            <Metric
              name='Toxicity'
              labelLeft='Trolling'
              labelRight='Lurking'
              value={Math.round(results.metrics!.tox * 100)}
            />
            <Metric
              name='Profanity'
              labelLeft='Dramatic'
              labelRight='Chill'
              value={Math.round(results.metrics!.obs * 100)}
            />
            <Metric
              name='Bigotry'
              labelLeft='Hater'
              labelRight='Neutral'
              value={Math.round(results.metrics!.idn * 100)}
            />
            <Metric
              name='Insult'
              labelLeft='Roasting'
              labelRight='Passive'
              value={Math.round(results.metrics!.ins * 100)}
            />
          </div>
        </section>

        <section className='mt-12 flex w-full flex-col items-center gap-12 sm:mt-8'>
          {showTopToxicUsers && (
            <>
              <h2 className='max-w-md text-center font-body text-xs sm:max-w-screen-sm sm:text-base lg:max-w-screen-md lg:text-2xl'>
                The {results.most_toxic_following?.length} most toxic people you
                follow:
              </h2>

              <ul className='flex gap-2 sm:gap-4'>
                {results.most_toxic_following?.map((tweet) => (
                  <li key={tweet.username}>
                    <UserCard
                      name={tweet.name}
                      username={tweet.username}
                      profileImageUrl={tweet.profile_image_url}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {bottom}
        </section>
      </div>
    </article>
  );
}
