type MetricProps = {
  name: string;
  labelLeft: string;
  labelRight: string;
  value: number;
};

export default function Metric({
  name,
  labelLeft,
  labelRight,
  value,
}: MetricProps) {
  const leftPercentage = value;
  const rightPercentage = 100 - value;

  const percentageWidth = Math.max(leftPercentage, rightPercentage);

  return (
    <div className='flex flex-col items-center gap-3 font-body lg:rounded-xl lg:bg-black lg:p-8'>
      <h2 className='text-xs sm:text-base lg:text-2xl'>{name}</h2>

      <div className='relative h-8 w-full rounded-full bg-wildr-gray-900 sm:h-16'>
        <div
          style={{
            width: `${percentageWidth}%`,
          }}
          className={`absolute flex h-full w-full rounded-full ${
            leftPercentage >= 50
              ? 'metric-bar-mobile-bad left-0'
              : 'metric-bar-mobile-good right-0'
          }`}
        />

        <div className='absolute inset-0 flex justify-between'>
          <div className='flex items-center gap-2 p-1 sm:gap-3 sm:p-2'>
            <p
              className={`flex aspect-square w-6 items-center justify-center rounded-full bg-black sm:w-12 ${
                leftPercentage === 100
                  ? 'text-[6px] sm:text-sm'
                  : 'text-[8px] sm:text-base'
              }`}
              id='left-percentage'
            >
              {leftPercentage}%
            </p>

            <label
              className='label-shadow text-xs sm:text-base lg:text-xl'
              htmlFor='left-percentage'
            >
              {labelLeft}
            </label>
          </div>

          <div className='flex items-center gap-2 p-1 sm:gap-3 sm:p-2'>
            <label
              className='label-shadow text-xs sm:text-base lg:text-xl'
              htmlFor='right-percentage'
            >
              {labelRight}
            </label>

            <p
              className={`flex aspect-square w-6 items-center justify-center rounded-full bg-black sm:w-12 ${
                rightPercentage === 100
                  ? 'text-[6px] sm:text-sm'
                  : 'text-[8px] sm:text-base'
              }`}
              id='right-percentage'
            >
              {rightPercentage}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
