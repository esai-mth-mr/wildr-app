type LoadingBarProps = {
  progress: number;
};

export default function LoadingBar({ progress }: LoadingBarProps) {
  return (
    <div className='relative h-24 w-full rounded-3xl outline outline-2'>
      <div className='loading-bar absolute h-full w-full rounded-3xl' />
    </div>
  );
}
