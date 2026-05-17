'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>오류가 발생했습니다.</h2>
      <button
        onClick={reset}
        style={{ padding: '0.5rem 1.5rem', background: '#1a6d7e', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
      >
        다시 시도
      </button>
    </div>
  );
}
