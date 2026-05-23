import React from 'react';

const ScrollUpButton = () => {
  const handleScrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleScrollUp}
      className="fixed right-6 bottom-6 rounded border border-gray-400 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm hover:bg-gray-50"
    >
      TOP
    </button>
  );
};

export default ScrollUpButton;
