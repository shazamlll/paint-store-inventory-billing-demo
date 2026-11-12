"use client";

import Link from "next/link";

import {
  getLowStockAlertRows,
  getLowStockAlertSummary
} from "../../../src/low-stock-alerts.js";
import { useDatabasePageData } from "../../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function LowStockAlertsPage() {
  const { data } = useDatabasePageData();
  const products = data.products.rows;
  const rows = getLowStockAlertRows(products);
  const summary = getLowStockAlertSummary(products);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">低库存提醒</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            扫描当前库存低于或等于预警线的商品。这里先提供给店主查看的提醒列表，
            补货流程暂缓。
          </p>
        </div>
        <Link
          className="inline-flex w-fit rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          href="/inventory"
        >
          库存流水
        </Link>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-4">
        <Metric label="低库存商品" value={number.format(summary.lowStockCount)} />
        <Metric label="低于预警线" value={number.format(summary.belowThresholdCount)} />
        <Metric label="刚到预警线" value={number.format(summary.atThresholdCount)} />
        <Metric label="补货缺口" value={number.format(summary.totalStockGap)} />
      </section>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>商品</Column>
                <Column>规格</Column>
                <Column>单位</Column>
                <Column align="right">库存</Column>
                <Column align="right">预警线</Column>
                <Column align="right">缺口</Column>
                <Column>状态</Column>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={7}>
                    暂无数据库低库存商品。
                  </Cell>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr className="border-t border-[var(--border)]" key={`${row.productName}-${row.spec}`}>
                    <Cell className="font-semibold">{row.productName}</Cell>
                    <Cell>{row.spec}</Cell>
                    <Cell>{row.unit}</Cell>
                    <Cell align="right">{number.format(row.currentStock)}</Cell>
                    <Cell align="right">{number.format(row.lowStockThreshold)}</Cell>
                    <Cell align="right">{number.format(row.stockGap)}</Cell>
                    <Cell>
                      <span
                        className={
                          row.statusLabel === "低于预警线"
                            ? "rounded px-2 py-1 text-xs font-semibold text-[#9a3412] bg-[#ffedd5]"
                            : "rounded px-2 py-1 text-xs font-semibold text-[#854d0e] bg-[#fef9c3]"
                        }
                      >
                        {row.statusLabel}
                      </span>
                    </Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
