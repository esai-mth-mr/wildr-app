import Image from 'next/image';

export default function QrCode() {
  return (
    <div className='relative aspect-square h-full'>
      <Image
        src='/qr.svg'
        alt='A QR code that links to the download for the Wildr app.'
        fill
      />
    </div>
  );
}
