import Image from 'next/image';

type InfoButtonProps = {
  onClick?: () => void;
};

export default function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button className='relative aspect-square h-8 lg:h-10' onClick={onClick}>
      <Image
        src='/icons/info.svg'
        alt='More info icon.'
        aria-label='Tap for more details about MBTI'
        fill
      />
    </button>
  );
}
