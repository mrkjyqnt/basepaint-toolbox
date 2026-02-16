import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasePaint Toolbox",
  description: "Convert images to BasePaint pixel art strokes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||((!t)&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}else{d.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <TooltipProvider>
          <main className="flex min-h-screen items-start justify-center p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
