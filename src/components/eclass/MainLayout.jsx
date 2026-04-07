import React from 'react';

const MainLayout = ({ sidebar, children }) => {
  return (
    <div className="-mt-[1px] mb-0 flex min-h-[560px] border-x border-t border-[#cfcfcf] bg-[#fcfcfc]">
      {sidebar}
      <main className="min-w-0 flex-1 border-l border-[#e3e3e3] bg-white px-5 py-6">{children}</main>
    </div>
  );
};

export default MainLayout;
