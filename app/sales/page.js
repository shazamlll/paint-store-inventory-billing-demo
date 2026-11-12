"use client";

import Link from "next/link";

import SalesFormClient from "./SalesFormClient.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

export default function SalesPage() {
  const { data, reload } = useDatabasePageData();
  const { products, customers, savedOrders, inventoryMovements } = data;
  const readSource =
    products.source === "supabase" && customers.source === "supabase"
      ? "supabase"
      : "supabase_unavailable";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">销售开单</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            从数据库商品和客户组合销售单，保存时通过服务端事务写入销售、收款和库存流水。
          </p>
        </div>
        <Link
          className="inline-flex rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          href="/sales/print"
        >
          打印销售单
        </Link>
      </header>

      <ReadStateNotice readSource={readSource} />

      <SalesFormClient
        initialCustomers={customers.rows}
        initialInventoryMovements={inventoryMovements.rows}
        initialProducts={products.rows}
        initialSavedOrders={savedOrders.rows}
        onSaved={reload}
        readSource={readSource}
      />
    </main>
  );
}

function ReadStateNotice({ readSource }) {
  const remoteReady = readSource === "supabase";

  return (
    <section className="mt-5 rounded-md border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold">
          {remoteReady ? "数据库销售准备" : "数据库目录未就绪"}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {remoteReady
            ? "当前商品和客户来源于数据库，保存时会执行服务端销售事务。"
            : "请先在数据库中维护当前门店的商品和客户数据。"}
        </p>
      </div>
    </section>
  );
}
