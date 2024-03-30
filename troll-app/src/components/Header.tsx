import { WILDR_HOME_URL } from '@/constants';
import Image from 'next/image';

type HeaderProps = {
  trailing?: React.ReactNode;
};

export default function Header({ trailing }: HeaderProps) {
  return (
    <header className='grid w-full grid-cols-3 items-center p-4 pt-8 md:p-8'>
      <a
        className='relative col-start-2 h-6 w-20 justify-self-center'
        href={WILDR_HOME_URL}
      >
        <Image alt='Wildr logo' src='/wildr-logo.svg' fill priority />
      </a>

      <div className='justify-self-end'>{trailing}</div>
    </header>
  );
}
