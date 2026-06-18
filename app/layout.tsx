import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "DabbaDoc - Scan Before You Eat",
  description: "AI Food Health Intelligence for Indian Families",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "512x512"
      }
    ],
    shortcut: "/favicon.png",
    apple: "/dabbadoc-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="strip-extension-hydration-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const shouldRemove = (name) =>
                  name === "bis_skin_checked" ||
                  name === "bis_register" ||
                  name.startsWith("__processed_");

                const cleanElement = (element) => {
                  if (!element || element.nodeType !== 1) return;
                  for (const attr of Array.from(element.attributes || [])) {
                    if (shouldRemove(attr.name)) element.removeAttribute(attr.name);
                  }
                  if (element.querySelectorAll) {
                    element.querySelectorAll("*").forEach(cleanElement);
                  }
                };

                cleanElement(document.documentElement);

                const observer = new MutationObserver((mutations) => {
                  for (const mutation of mutations) {
                    if (
                      mutation.type === "attributes" &&
                      mutation.attributeName &&
                      shouldRemove(mutation.attributeName)
                    ) {
                      mutation.target.removeAttribute(mutation.attributeName);
                    }
                    mutation.addedNodes.forEach(cleanElement);
                  }
                });

                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true
                });

                window.addEventListener("load", () => {
                  window.setTimeout(() => observer.disconnect(), 5000);
                });

                window.addEventListener(
                  "unhandledrejection",
                  (event) => {
                    if (event.reason instanceof Event) {
                      event.preventDefault();
                      event.stopImmediatePropagation();
                      console.warn(
                        "Ignored browser event rejection:",
                        event.reason.type || "unknown"
                      );
                    }
                  },
                  true
                );

                window.addEventListener(
                  "error",
                  (event) => {
                    if (event instanceof ErrorEvent) return;
                    const target = event.target;
                    const tagName = target?.tagName;
                    if (tagName === "IMG" || tagName === "LINK" || tagName === "SCRIPT") {
                      console.warn("Resource failed to load:", tagName);
                    }
                  },
                  true
                );
              })();
            `
          }}
        />
        {children}
      </body>
    </html>
  );
}
