import { Tweet } from '@/types/tweet';
import Image from 'next/image';

type TweetCardProps = {
  tweet: Tweet;
};

export default function TweetCard({ tweet }: TweetCardProps) {
  return (
    <div className='flex h-full gap-4 rounded-xl bg-gray-800 p-4'>
      <div className='relative aspect-square h-12 shrink-0 overflow-clip rounded-full'>
        <Image
          src={tweet.profile_image_url}
          alt={'Profile picture for' + tweet.username}
          fill={true}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <p className='text-sm font-semibold'>
          {tweet.name}
          <span className='ml-2 font-normal text-gray-400'>
            @{tweet.username}
          </span>
        </p>

        <p>{tweet.text}</p>
      </div>
    </div>
  );
}
