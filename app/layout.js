import AppShell from "./AppShell";
import "./globals.css";

export const metadata = {
  title: "门店进销存开单系统",
  description: "面向小型涂料门店的轻量级开单、库存和应收管理工具。"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
