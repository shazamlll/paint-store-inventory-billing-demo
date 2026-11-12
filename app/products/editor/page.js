"use client";

import Link from "next/link";

import ProductEditorClient from "./ProductEditorClient.js";
import { useDatabasePageData } from "../../useDatabasePageData.js";

export default function ProductEditorPage() {
  const { data, reload } = useDatabasePageData();
  const { products } = data;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/products">
            返回商品列表
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">商品编辑</h1>
        </div>
      </header>

      <ProductEditorClient
        initialProducts={products.rows}
        onSaved={reload}
        readSource={products.source}
      />
    </main>
  );
}
