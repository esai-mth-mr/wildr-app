import Image from 'next/image';
import WildrDialog from './WildrDialog';

type InfoDialogProps = {
  open: boolean;
  onClose?: () => void;
};

const definitions = [
  {
    title: 'Toxicity',
    subtitle: "'T' FOR TROLLING, 'L' FOR LURKING",
    description:
      "This category looks for generally toxic phrases and words that aren't specific to anything. You know when you read a tweet and it's not directed at you but it still leaves you unsettled? This is just that.",
  },
  {
    title: 'Profanity',
    subtitle: "'D' FOR DRAMATIC, 'C' FOR CHILL",
    description:
      'This category looks for classic profanity, aka words we should not use in the workplace. If a tweet uses a lot of profanity, we labeled it “Dramatic,” for tweets with little to none, we call it “Chill.”',
  },
  {
    title: 'Bigotry',
    subtitle: "'H' FOR HATER, 'N' FOR NEUTRAL",
    description:
      'This category looks for terms and phrases that attack people for their identity. Whether that be race, gender, etc. if a tweet scores high in this category we label it “Hater” and for low scorers, “Neutral.” ',
  },
  {
    title: 'Insult',
    subtitle: "'R' FOR ROASTING, 'P' FOR PASSIVE",
    description:
      'This category looks for tweets that direct hate or toxicity towards a specific person. For tweets that have many insults, we gave it a “Roasting” label, and for tweets with no insults, “Passive.”',
  },
];

export default function InfoDialog({ open, onClose }: InfoDialogProps) {
  return (
    <WildrDialog title='Definitions' open={open} onClose={onClose}>
      <div className='flex flex-col gap-8 font-body md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-12 md:text-center'>
        {definitions.map((definition) => (
          <div
            key={definition.title}
            className='flex flex-col gap-4 md:items-center'
          >
            <div className='relative aspect-square w-12'>
              <Image
                className='-z-10'
                src={`/icons/definitions/${definition.title.toLowerCase()}.webp`}
                alt={`A red colored icon representing ${definition.title.toLowerCase()}`}
                fill
                priority
              />
            </div>

            <h3 className='text-2xl md:text-3xl'>{definition.title}</h3>

            <h4 className='text-xs uppercase md:text-base'>
              {definition.subtitle}
            </h4>

            <p className='text-wildr-gray-500'>{definition.description}</p>
          </div>
        ))}
      </div>
    </WildrDialog>
  );
}
