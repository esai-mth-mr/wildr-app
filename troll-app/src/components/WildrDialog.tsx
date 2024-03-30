import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { useState } from 'react';

type WildrDialogProps = {
  open: boolean;
  onClose?: () => void;
  title: string;
  children: React.ReactNode;
};

export default function WildrDialog({
  open,
  onClose,
  title,
  children,
}: WildrDialogProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <>
      <Dialog.Root open={open}>
        <Dialog.Portal container={container}>
          <Dialog.Overlay className='fixed inset-0 z-50 bg-wildr-overlay/50 backdrop-blur-xl' />
          <Dialog.Content
            className='fixed inset-0 z-50 m-auto flex flex-col items-center overflow-y-auto bg-black md:h-fit md:max-h-screen md:max-w-3xl md:rounded-xl'
            onInteractOutside={onClose}
            aria-describedby={undefined}
          >
            <div className='sticky inset-0 grid w-full grid-cols-3 items-center bg-black p-4 md:flex md:flex-col'>
              <Dialog.Close asChild>
                <button
                  className='relative aspect-square h-8 md:self-end'
                  onClick={onClose}
                >
                  <Image
                    className='block md:hidden'
                    src='/icons/back.svg'
                    alt='Icon for the back navigation button.'
                    aria-label='Close definitions'
                    fill
                  />
                  <Image
                    className='hidden md:block'
                    src='/icons/x.svg'
                    alt='Icon for the close button.'
                    aria-label='Close definitions'
                    fill
                  />
                </button>
              </Dialog.Close>

              <Dialog.Title className='justify-self-center'>
                <h3 className='whitespace-nowrap text-center text-lg font-semibold md:text-3xl'>
                  {title}
                </h3>
              </Dialog.Title>
            </div>

            <div className='p-4 md:p-16'>{children}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div ref={setContainer} />
    </>
  );
}
