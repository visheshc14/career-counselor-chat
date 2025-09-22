// src/pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

const themeInit = `
(function(){
  try {
    var saved = localStorage.getItem('theme');
    var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved ? saved === 'dark' : prefers;
    if (dark) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}