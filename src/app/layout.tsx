import type { Metadata } from "next";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServiceBridge AI - Benefits Navigator",
  description: "AI-powered benefits guidance with document readiness and human referral guardrails.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingChatbot />
      </body>
    </html>
  );
}
