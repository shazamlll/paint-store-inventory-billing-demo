"use client";

import Link from "next/link";

import PurchaseFormClient from "./PurchaseFormClient.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

export default function PurchasesPage() {
  const { data, reload } = useDatabasePageData();
  const { products, suppliers, savedPurchases, inventoryMovements } = data;
  const readSource =
    products.source === "supabase" && suppliers.source === "supabase"
      ? "supabase"
      : "supabase_unavailable";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">采购入库</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            记录供应商到货、付款状态、库存增加和采购入库流水，保存时通过服务端事务写入数据库。
          </p>
        </div>
      </header>

      <ReadStateNotice readSource={readSource} />

      <PurchaseFormClient
        initialProducts={products.rows}
        initialInventoryMovements={inventoryMovements.rows}
        initialSavedOrders={savedPurchases.rows}
        initialSuppliers={suppliers.rows}
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
          {remoteReady ? "数据库入库准备" : "数据库目录未就绪"}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {remoteReady
            ? "当前商品和供应商来源于数据库，保存时会执行服务端采购事务。"
            : "请先在数据库中维护当前门店的商品和供应商数据。"}
        </p>
      </div>
    </section>
  );
}
