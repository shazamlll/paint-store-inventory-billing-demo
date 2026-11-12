"use client";

import Link from "next/link";

import {
  getDashboardSummary,
  getTodaySalesRows
} from "../../src/dashboard.js";
import { getLowStockAlertRows } from "../../src/low-stock-alerts.js";
import { formatMoney } from "../../src/money.js";
import { formatPaymentStatusLabel } from "../../src/ux-copy.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function DashboardPage() {
  const { data } = useDatabasePageData();
  const todayDate = getTodayDate();
  const savedOrders = data.savedOrders.rows;
  const products = data.products.rows;
  const summary = getDashboardSummary({
    savedOrders,
    products,
    todayDate
  });
  const todayRows = getTodaySalesRows(savedOrders, todayDate);
  const lowStockRows = getLowStockAlertRows(products).slice(0, 4);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">今日经营看板</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            给店主快速查看数据库中的今日销售、收款、应收款和低库存风险。
          </p>
        </div>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-4">
        <Metric label="今日销售" value={formatMoney(summary.todaySalesAmount)} />
        <Metric label="收款" value={formatMoney(summary.todayCollectionAmount)} />
        <Metric label="应收款" value={formatMoney(summary.receivableAmount)} />
        <Metric label="低库存" value={number.format(summary.lowStockCount)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs uppercase text-[var(--muted)]">今日销售</p>
            <h2 className="mt-1 text-lg font-semibold">
              {todayDate} 共 {number.format(summary.todayOrderCount)} 张销售单
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <Column>单号</Column>
                  <Column>客户</Column>
                  <Column align="right">合计</Column>
                  <Column align="right">收款</Column>
                  <Column align="right">应收</Column>
                  <Column>状态</Column>
                </tr>
              </thead>
              <tbody>
                {todayRows.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <Cell className="text-[var(--muted)]" colSpan={6}>
                      今日暂无数据库销售单。
                    </Cell>
                  </tr>
                ) : (
                  todayRows.map((row) => (
                    <tr className="border-t border-[var(--border)]" key={row.orderNumber}>
                      <Cell className="font-semibold">{row.orderNumber}</Cell>
                      <Cell>{row.customerName}</Cell>
                      <Cell align="right">{formatMoney(row.totalAmount)}</Cell>
                      <Cell align="right">{formatMoney(row.paymentAmount)}</Cell>
                      <Cell align="right">{formatMoney(row.receivableDelta)}</Cell>
                      <Cell>{formatPaymentStatusLabel(row.paymentStatus)}</Cell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs uppercase text-[var(--muted)]">低库存</p>
            <h2 className="mt-1 text-lg font-semibold">
              {number.format(summary.lowStockCount)} 个商品需要关注
            </h2>
          </div>
          <div className="grid gap-2 p-4">
            {lowStockRows.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">暂无数据库低库存商品。</p>
            ) : (
              lowStockRows.map((row) => (
                <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm" key={`${row.productName}-${row.spec}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{row.productName}</span>
                    <span>{number.format(row.currentStock)} {row.unit}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {row.spec}，预警线 {number.format(row.lowStockThreshold)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Column({ align = "left", children }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 font-semibold ${align === "right" ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

function Cell({ align = "left", className = "", colSpan, children }) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 ${align === "right" ? "text-right" : ""} ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function getTodayDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
}
