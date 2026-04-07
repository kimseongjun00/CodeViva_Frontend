import '../src/styles.css';

export const metadata = {
  title: 'codeviva',
  description: 'codeviva',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
