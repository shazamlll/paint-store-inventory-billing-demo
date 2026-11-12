"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  getSearchSummary,
  searchDatabaseRecords
} from "../../src/search.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

const resultTypeLabels = {
  product: "商品",
  customer: "客户",
  order: "销售单"
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { data } = useDatabasePageData();
  const query = searchParams.get("q") ?? "";
  const results = searchDatabaseRecords({
    products: data.products.rows,
    customers: data.customers.rows,
    savedOrders: data.savedOrders.rows,
    query
  });
  const summary = getSearchSummary(results);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-6">
      <header className="border-b border-[var(--border)] pb-5">
        <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
          返回首页
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">全局搜索</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          在数据库商品、客户和销售单之间做统一搜索。
        </p>
      </header>

      <form className="grid gap-2 py-5 md:grid-cols-[1fr_auto]" action="/search">
        <label className="grid gap-1 text-sm font-semibold">
          <span>搜索词</span>
          <input
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            defaultValue={query}
            name="q"
            placeholder="输入商品、客户、销售单号"
          />
        </label>
        <button className="self-end rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white" type="submit">
          搜索
        </button>
      </form>

      <section className="grid gap-3 py-5 md:grid-cols-4">
        <Metric label="结果数" value={summary.totalResults} />
        <Metric label="商品" value={summary.productCount} />
        <Metric label="客户" value={summary.customerCount} />
        <Metric label="销售单" value={summary.orderCount} />
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <p className="text-xs uppercase text-[var(--muted)]">搜索词</p>
          <h2 className="mt-1 text-lg font-semibold">{query || "未输入"}</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">
              {query ? "没有匹配的数据库记录。" : "请输入搜索词。"}
            </p>
          ) : (
            results.map((result) => (
              <article className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[140px_1fr_1.5fr]" key={`${result.type}-${result.title}-${result.subtitle}`}>
                <p className="font-semibold text-[var(--accent)]">{resultTypeLabels[result.type] ?? result.type}</p>
                <div>
                  <h3 className="font-semibold">{result.title}</h3>
                  <p className="text-[var(--muted)]">{result.subtitle}</p>
                </div>
                <p className="text-[var(--muted)]">{result.detail}</p>
              </article>
            ))
          )}
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
