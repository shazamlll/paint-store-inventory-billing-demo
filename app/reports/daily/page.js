"use client";

import Link from "next/link";

import {
  createDailyReport,
  formatDailyReportMarkdown
} from "../../../src/daily-report.js";
import { formatMoney } from "../../../src/money.js";
import { formatPaymentStatusLabel } from "../../../src/ux-copy.js";
import { useDatabasePageData } from "../../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function DailyReportPage() {
  const { data } = useDatabasePageData();
  const reportDate = getTodayDate();
  const report = createDailyReport({
    savedOrders: data.savedOrders.rows,
    products: data.products.rows,
    reportDate
  });
  const markdown = formatDailyReportMarkdown(report);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="no-print flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">每日结账导出</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            汇总数据库中的当天销售、收款、当日应收和低库存跟进。
          </p>
        </div>
        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.print()}
          type="button"
        >
          打印报表
        </button>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-5">
        <Metric label="单据" value={number.format(report.summary.orderCount)} />
        <Metric label="销售额" value={formatMoney(report.summary.salesAmount)} />
        <Metric label="收款" value={formatMoney(report.summary.collectionAmount)} />
        <Metric label="应收" value={formatMoney(report.summary.receivableAmount)} />
        <Metric label="低库存" value={number.format(report.summary.lowStockCount)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-xs uppercase text-[var(--muted)]">{report.header.scope}</p>
            <h2 className="mt-1 text-lg font-semibold">
              {report.header.title} - {report.header.reportDate}
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
                {report.salesRows.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <Cell className="text-[var(--muted)]" colSpan={6}>
                      当天暂无数据库销售单。
                    </Cell>
                  </tr>
                ) : (
                  report.salesRows.map((row) => (
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
            <p className="text-xs uppercase text-[var(--muted)]">Markdown 报表</p>
            <h2 className="mt-1 text-lg font-semibold">用于结账备注</h2>
          </div>
          <pre className="whitespace-pre-wrap px-4 py-4 font-mono text-xs leading-5 text-[var(--muted)]">
            {markdown}
          </pre>
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <p className="text-xs uppercase text-[var(--muted)]">低库存跟进</p>
          <h2 className="mt-1 text-lg font-semibold">
            {number.format(report.summary.belowThresholdCount)} 个低于预警线，{number.format(report.summary.atThresholdCount)} 个刚到预警线
          </h2>
        </div>
        <div className="grid gap-2 p-4 md:grid-cols-2">
          {report.lowStockRows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">暂无数据库低库存商品。</p>
          ) : (
            report.lowStockRows.slice(0, 6).map((row) => (
              <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm" key={`${row.productName}-${row.spec}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {row.productName} {row.spec}
                  </span>
                  <span>{row.statusLabel}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  库存 {number.format(row.currentStock)} {row.unit}，预警线 {number.format(row.lowStockThreshold)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`
        @media print {
          body {
            background: white;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
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
