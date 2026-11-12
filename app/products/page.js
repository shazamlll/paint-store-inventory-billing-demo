"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase.js";
import {
  getProductStockStatus,
  getProductSummary
} from "../../src/products.js";
import { formatMoney } from "../../src/money.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function ProductsPage() {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const { data, loading, reload } = useDatabasePageData();
  const { products } = data;
  const productRows = products.rows;
  const summary = getProductSummary(productRows);
  const [notice, setNotice] = useState("");

  async function removeProduct(productItem) {
    const result = await deleteCatalogRow({
      authClient,
      endpoint: "/api/catalog/products",
      id: productItem.id,
      readSource: products.source,
      unavailableMessage: "数据库商品目录未就绪，未删除商品。",
      failureMessage: "数据库商品删除失败，请检查门店上下文。"
    });

    setNotice(result.message);

    if (result.ok) {
      await reload();
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">商品列表</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            读取当前登录账号可访问门店的数据库商品目录，用于开单、采购和库存预警。
          </p>
        </div>
        <Link
          className="inline-flex w-fit rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          href="/products/editor"
        >
          编辑商品
        </Link>
      </header>

      <section className="grid gap-3 py-5 md:grid-cols-4">
        <Metric label="商品数" value={summary.totalProducts} />
        <Metric label="库存单位" value={number.format(summary.totalStockUnits)} />
        <Metric label="低库存" value={summary.lowStockCount} />
        <Metric label="零售价值" value={formatMoney(summary.totalRetailValue)} />
      </section>

      <ReadStateNotice loading={loading} state={products} />
      <p className="mb-3 min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>名称</Column>
                <Column>规格</Column>
                <Column>单位</Column>
                <Column align="right">成本</Column>
                <Column align="right">售价</Column>
                <Column align="right">库存</Column>
                <Column align="right">预警线</Column>
                <Column>状态</Column>
                <Column>操作</Column>
              </tr>
            </thead>
            <tbody>
              {productRows.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={9}>
                    暂无数据库商品。
                  </Cell>
                </tr>
              ) : (
                productRows.map((productItem) => {
                  const status = getProductStockStatus(productItem);

                  return (
                    <tr className="border-t border-[var(--border)]" key={`${productItem.name}-${productItem.spec}`}>
                      <Cell className="font-semibold">{productItem.name}</Cell>
                      <Cell>{productItem.spec}</Cell>
                      <Cell>{productItem.unit}</Cell>
                      <Cell align="right">{formatMoney(productItem.costPrice)}</Cell>
                      <Cell align="right">{formatMoney(productItem.salePrice)}</Cell>
                      <Cell align="right">{number.format(productItem.currentStock)}</Cell>
                      <Cell align="right">{number.format(productItem.lowStockThreshold)}</Cell>
                      <Cell>
                        <span
                          className={
                            status === "low"
                              ? "rounded px-2 py-1 text-xs font-semibold text-[#9a3412] bg-[#ffedd5]"
                              : "rounded px-2 py-1 text-xs font-semibold text-[#166534] bg-[#dcfce7]"
                          }
                        >
                          {status === "low" ? "低库存" : "正常"}
                        </span>
                      </Cell>
                      <Cell>
                        <button
                          aria-label={`删除 ${productItem.name} ${productItem.spec}`}
                          className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--danger-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!productItem.id}
                          onClick={() => removeProduct(productItem)}
                          type="button"
                        >
                          删除
                        </button>
                      </Cell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

async function deleteCatalogRow({
  authClient,
  endpoint,
  id,
  readSource,
  unavailableMessage,
  failureMessage
}) {
  if (readSource !== "supabase" || !id) {
    return {
      ok: false,
      message: unavailableMessage
    };
  }

  if (!authClient) {
    return {
      ok: false,
      message: "Supabase Auth 尚未配置，未删除数据。"
    };
  }

  const { data } = await authClient.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    return {
      ok: false,
      message: "请先登录后再删除数据。"
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      return {
        ok: false,
        message: failureMessage
      };
    }

    return {
      ok: true,
      message: "已删除数据库商品。"
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未删除远端数据。"
    };
  }
}

function ReadStateNotice({ loading, state }) {
  const label = loading ? "正在读取数据库" : getReadStateLabel(state.source);

  return (
    <section className="mb-5 rounded-md border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-[var(--muted)]">{state.notice}</p>
      </div>
    </section>
  );
}

function getReadStateLabel(source) {
  if (source === "supabase") {
    return "数据库实时数据";
  }

  if (source === "supabase_empty") {
    return "数据库暂无数据";
  }

  return "数据库读取受限";
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
