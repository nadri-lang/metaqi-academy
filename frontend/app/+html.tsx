// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" translate="no" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/*
          Chrome's auto page-translation (Google Translate) rewrites DOM text
          nodes outside of React's control. When it fires on the admin web
          view, React's own reconciler later tries to remove/update a node
          Translate already swapped out, crashing with
          "Failed to execute 'removeChild' on 'Node'". These two tags stop
          Chrome from offering/applying translation on this page.
        */}
        <meta name="google" content="notranslate" />
        {/*
          Google AdSense base library + site-ownership verification snippet
          (client ca-pub-7209607881692193). Web only - +html.tsx has no
          effect on the native app. Once the site is approved in AdSense,
          turn off Auto ads in the dashboard (we're placing ad units
          manually) and add <ins class="adsbygoogle"> blocks where needed.
        */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7209607881692193"
          crossOrigin="anonymous"
        />
        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /*
                position:fixed + bottom:0 anchors to the LAYOUT viewport,
                which on mobile Safari/Chrome is taller than what's
                actually visible while the address bar is showing - the
                bottom tab bar ends up partly hidden until the toolbar
                collapses. 100dvh (dynamic viewport height) tracks the
                real visible area instead; fall back to 100% where dvh
                isn't supported.
              */
              html, body, #root, body > div:first-child {
                height: 100%;
                height: 100dvh;
              }
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
