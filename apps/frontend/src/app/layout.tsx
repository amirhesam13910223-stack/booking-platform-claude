import "./globals.css";

// Layout ریشه — RTL و فونت فارسی از همون سطح پایه تنظیم میشه.
export const metadata = {
  title: "پلتفرم نوبت‌دهی",
  description: "رزرو آنلاین نوبت از کسب‌وکارهای مورد اعتماد",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
