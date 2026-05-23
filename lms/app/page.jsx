'use client';

import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('../src/ClientApp'), { ssr: false });

const HomePage = () => {
  return <ClientApp />;
};

export default HomePage;
