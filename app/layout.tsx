import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "NY Economic Incentive Tax Credits Dashboard",
  description:
    "Interactive dashboard exploring New York State economic incentive tax credit utilization.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
