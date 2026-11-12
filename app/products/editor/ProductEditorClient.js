"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../../lib/supabase.js";
import {
  createProductDraft,
  normalizeProductDraft,
  updateDraftField,
  validateProductDraft
} from "../../../src/product-editor.js";
import {
  getProductStockStatus,
  getProductSummary
} from "../../../src/products.js";
import { isWritableCatalogReadSource } from "../../../src/catalog-readiness.js";
import { formatMoney } from "../../../src/money.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

const fields = [
  { name: "name", label: "名称", type: "text" },
  { name: "spec", label: "规格", type: "text" },
  { name: "unit", label: "单位", type: "text" },
  { name: "costPrice", label: "成本", type: "number", step: "0.01" },
  { name: "salePrice", label: "售价", type: "number", step: "0.01" },
  { name: "currentStock", label: "库存", type: "number", step: "1" },
  { name: "lowStockThreshold", label: "低库存预警线", type: "number", step: "1" }
];

export default function ProductEditorClient({
  initialProducts = [],
  onSaved = async () => {},
  readSource = "supabase_unavailable"
}) {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState(initialProducts);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState(() => createProductDraft(initialProducts[0]));
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const selectedProduct = products[selectedIndex];
  const summary = useMemo(() => getProductSummary(products), [products]);
  const status = selectedProduct ? getProductStockStatus(selectedProduct) : "ok";
  const catalogReady = isWritableCatalogReadSource(readSource);

  useEffect(() => {
    setProducts(initialProducts);
    setSelectedIndex(initialProducts.length > 0 ? 0 : -1);
    setDraft(createProductDraft(initialProducts[0]));
    setErrors({});
    setNotice("");
  }, [initialProducts]);

  function selectProduct(index) {
    setSelectedIndex(index);
    setDraft(createProductDraft(products[index]));
    setErrors({});
    setNotice("");
  }

  function startNewProduct() {
    setSelectedIndex(-1);
    setDraft(createProductDraft());
    setErrors({});
    setNotice("");
  }

  async function saveDraft(event) {
    event.preventDefault();
    const nextErrors = validateProductDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setNotice("请检查标记的字段。");
      return;
    }

    const product = {
      ...normalizeProductDraft(draft),
      ...(selectedProduct?.id ? { id: selectedProduct.id } : {})
    };
    const saveResult = await saveProductToCatalogApi(product, authClient, readSource);

    if (!saveResult.ok) {
      setNotice(saveResult.message);
      return;
    }

    setNotice(saveResult.message);
    await onSaved();
  }

  function changeField(field, value) {
    setDraft((currentDraft) => updateDraftField(currentDraft, field, value));
    setErrors((currentErrors) => {
      const { [field]: removed, ...rest } = currentErrors;
      return rest;
    });
  }

  return (
    <div className="grid gap-5 py-5 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)]">
      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">
              {catalogReady ? "数据库商品" : "数据库未就绪"}
            </p>
            <p className="text-lg font-semibold">{summary.totalProducts} 个商品</p>
          </div>
          <button
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
            onClick={startNewProduct}
            type="button"
          >
            新增
          </button>
        </div>

        <div className="max-h-[36rem] overflow-y-auto">
          {products.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">暂无数据库商品。</p>
          ) : (
            products.map((productItem, index) => {
              const rowStatus = getProductStockStatus(productItem);

              return (
                <button
                  className={`grid w-full grid-cols-[1fr_auto] gap-3 border-b border-[var(--border)] px-4 py-3 text-left ${
                    selectedIndex === index ? "bg-[var(--accent-soft)]" : "bg-transparent"
                  }`}
                  key={`${productItem.name}-${productItem.spec}-${index}`}
                  onClick={() => selectProduct(index)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold">{productItem.name}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">{productItem.spec}</span>
                  </span>
                  <span
                    className={
                      rowStatus === "low"
                        ? "h-fit rounded px-2 py-1 text-xs font-semibold text-[#9a3412] bg-[#ffedd5]"
                        : "h-fit rounded px-2 py-1 text-xs font-semibold text-[#166534] bg-[#dcfce7]"
                    }
                  >
                    {number.format(productItem.currentStock)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid gap-3 border-b border-[var(--border)] px-4 py-3 md:grid-cols-4">
          <Metric label="库存单位" value={number.format(summary.totalStockUnits)} />
          <Metric label="低库存" value={summary.lowStockCount} />
          <Metric label="零售价值" value={formatMoney(summary.totalRetailValue)} />
          <Metric label="当前选择" value={selectedIndex >= 0 ? (status === "low" ? "低库存" : "正常") : "新商品"} />
        </div>

        <form className="grid gap-4 p-4" onSubmit={saveDraft}>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label className="grid gap-1 text-sm font-semibold" key={field.name}>
                <span>{field.label}</span>
                <input
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
                  min={field.type === "number" ? "0" : undefined}
                  name={field.name}
                  onChange={(event) => changeField(field.name, event.target.value)}
                  step={field.step}
                  type={field.type}
                  value={draft[field.name]}
                />
                {errors[field.name] ? (
                  <span className="text-xs font-medium text-[#b91c1c]">{errors[field.name]}</span>
                ) : null}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 md:flex-row md:items-center md:justify-between">
            <p className="min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                onClick={() => (selectedIndex >= 0 ? selectProduct(selectedIndex) : startNewProduct())}
                type="button"
              >
                重置
              </button>
              <button
                className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                保存商品
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

async function saveProductToCatalogApi(product, authClient, readSource) {
  if (!isWritableCatalogReadSource(readSource)) {
    return {
      ok: false,
      message: "数据库商品目录未就绪，未写入数据库。"
    };
  }

  if (!authClient) {
    return {
      ok: false,
      message: "Supabase Auth 尚未配置，未写入数据库。"
    };
  }

  const { data } = await authClient.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    return {
      ok: false,
      message: "请先登录后再写入数据库。"
    };
  }

  try {
    const response = await fetch("/api/catalog/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "数据库商品目录写入失败，请检查门店上下文。"
      };
    }

    return {
      ok: true,
      message: "已写入数据库商品目录。"
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未写入远端。"
    };
  }
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
