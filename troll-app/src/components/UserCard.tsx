import Image from 'next/image';

type UserCardProps = {
  name: string;
  username: string;
  profileImageUrl: string;
};

export default function UserCard({
  name,
  username,
  profileImageUrl,
}: UserCardProps) {
  return (
    <div className='h-full w-24 rounded-md bg-wildr-gray-1000 text-center sm:w-40 lg:w-60 lg:bg-black'>
      <div className='flex -translate-y-6 flex-col items-center gap-2 lg:gap-4'>
        <div className='relative aspect-square h-12 overflow-hidden rounded-full sm:h-16 lg:h-20'>
          <Image
            className='object-cover'
            src={profileImageUrl}
            alt={`Profile picture for ${name} (@${username}).`}
            fill
            priority
          />
        </div>

        <div className='flex w-full flex-col items-center gap-1 px-2 sm:px-4'>
          <h3 className='w-full text-sm font-semibold line-clamp-3 sm:text-base lg:text-2xl'>
            {name}
          </h3>

          <a
            className='max-w-full truncate font-body text-xs text-wildr-gray-500 sm:text-sm lg:text-base'
            href={`https://twitter.com/${username}`}
            target='_blank'
            rel='noreferrer'
          >
            @{username}
          </a>
        </div>
      </div>
    </div>
  );
}
