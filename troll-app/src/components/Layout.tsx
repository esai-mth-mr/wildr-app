import Head from 'next/head';
import { useState } from 'react';
import Header from './Header';
import InfoButton from './InfoButton';
import InfoDialog from './InfoDialog';

type LayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  showInfoButton?: boolean;
};

export default function Layout({
  title,
  description,
  children,
  showInfoButton,
}: LayoutProps) {
  const [openInfoDialog, setOpenDialog] = useState(false);

  return (
    <div className='flex min-h-screen flex-col items-center'>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
      </Head>

      <Header
        trailing={
          showInfoButton && (
            <div className='lg:hidden'>
              <InfoButton onClick={() => setOpenDialog(true)} />
            </div>
          )
        }
      />

      <main className='flex w-full flex-grow flex-col items-center'>
        <InfoDialog
          open={openInfoDialog}
          onClose={() => setOpenDialog(false)}
        />

        {children}
      </main>
    </div>
  );
}
