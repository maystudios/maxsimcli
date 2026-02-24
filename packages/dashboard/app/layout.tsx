export const metadata = {
  title: "MAXSIM Dashboard",
  description: "Live project dashboard for MAXSIM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
