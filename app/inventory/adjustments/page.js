"use client";

import Link from "next/link";

import InventoryAdjustmentClient from "./InventoryAdjustmentClient.js";
import { useDatabasePageData } from "../../useDatabasePageData.js";

export default function InventoryAdjustmentsPage() {
  const { data, reload } = useDatabasePageData();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">库存调整</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            手工调整数据库库存并填写原因，调整会形成库存流水，并与销售单、采购单保持分离。
          </p>
        </div>
        <Link
          className="inline-flex w-fit rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
          href="/inventory"
        >
          库存流水
        </Link>
      </header>

      <InventoryAdjustmentClient
        initialProducts={data.products.rows}
        onSaved={reload}
        readSource={data.products.source}
      />
    </main>
  );
}
