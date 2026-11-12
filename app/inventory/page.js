"use client";

import Link from "next/link";

import {
  getInventoryLedgerRows,
  getInventoryLedgerSummary,
  getProductMovementHistory
} from "../../src/inventory-ledger.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function InventoryLedgerPage() {
  const { data } = useDatabasePageData();
  const movements = data.inventoryMovements.rows;
  const rows = getInventoryLedgerRows(movements);
  const summary = getInventoryLedgerSummary(movements);
  const selectedRow = rows[0];
  const selectedHistory = selectedRow
    ? getProductMovementHistory(movements, selectedRow)
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">库存流水</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            按商品查看数据库中销售、采购和调整形成的库存变动历史。
          </p>
        </div>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-5">
        <Metric label="商品数" value={number.format(summary.productCount)} />
        <Metric label="流水数" value={number.format(summary.movementCount)} />
        <Metric label="入库" value={number.format(summary.totalIn)} />
        <Metric label="出库" value={number.format(summary.totalOut)} />
        <Metric label="净变化" value={number.format(summary.netChange)} />
      </section>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>商品</Column>
                <Column>规格</Column>
                <Column align="right">流水</Column>
                <Column align="right">入库</Column>
                <Column align="right">出库</Column>
                <Column align="right">净变化</Column>
                <Column align="right">最新结存</Column>
                <Column>最近来源</Column>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={8}>
                    暂无数据库库存流水。
                  </Cell>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr className="border-t border-[var(--border)]" key={`${row.productName}-${row.spec}`}>
                    <Cell className="font-semibold">{row.productName}</Cell>
                    <Cell>{row.spec}</Cell>
                    <Cell align="right">{number.format(row.movementCount)}</Cell>
                    <Cell align="right">{number.format(row.totalIn)}</Cell>
                    <Cell align="right">{number.format(row.totalOut)}</Cell>
                    <Cell align="right">{number.format(row.netChange)}</Cell>
                    <Cell align="right">{number.format(row.lastStockAfter)}</Cell>
                    <Cell>{row.latestSourceOrderNumber}</Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <p className="text-xs uppercase text-[var(--muted)]">变动历史</p>
          <h2 className="mt-1 text-lg font-semibold">
            {selectedRow ? `${selectedRow.productName} ${selectedRow.spec}` : "未选择商品"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>类型</Column>
                <Column align="right">数量</Column>
                <Column align="right">变动后库存</Column>
                <Column>来源</Column>
                <Column>备注</Column>
              </tr>
            </thead>
            <tbody>
              {selectedHistory.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={5}>
                    暂无数据库变动历史。
                  </Cell>
                </tr>
              ) : (
                selectedHistory.map((historyItem) => (
                  <tr className="border-t border-[var(--border)]" key={`${historyItem.sourceOrderNumber}-${historyItem.movementType}`}>
                    <Cell className="font-semibold">{formatMovementType(historyItem.movementType)}</Cell>
                    <Cell align="right">{number.format(historyItem.quantityDelta)}</Cell>
                    <Cell align="right">{number.format(historyItem.stockAfter)}</Cell>
                    <Cell>{historyItem.sourceOrderNumber}</Cell>
                    <Cell>{historyItem.notes || "-"}</Cell>
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

function formatMovementType(type) {
  const labels = {
    sale: "销售出库",
    purchase: "采购入库",
    adjustment: "库存调整"
  };

  return labels[type] ?? "库存变动";
}
