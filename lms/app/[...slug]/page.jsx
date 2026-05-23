'use client';

import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('../../src/ClientApp'), { ssr: false });

const CatchAllPage = () => {
  return <ClientApp />;
};

export default CatchAllPage;
