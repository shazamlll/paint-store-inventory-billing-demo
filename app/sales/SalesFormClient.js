"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase.js";
import { validateSalesOrderInventory } from "../../src/inventory.js";
import { formatMoney } from "../../src/money.js";
import {
  addSalesLine,
  calculateSalesDraftTotals,
  createSalesDraft,
  removeSalesLine,
  saveSalesOrder,
  updateSalesLineDiscount,
  updateSalesLineQuantity
} from "../../src/sales-form.js";
import { createPrintableSalesOrderDetail } from "../../src/sales-detail.js";
import { getPaymentStatusSummary } from "../../src/payment-status.js";
import { getCustomerReceivableSummary, getReceivableRows } from "../../src/receivables.js";
import { formatSalesApiErrorMessage } from "../../src/sales-api-errors.js";
import { formatPaymentStatusLabel } from "../../src/ux-copy.js";

// Source-visible Chinese contracts: 删除 已保存销售单 库存流水 收款状态 应收款 客户应收款 销售单明细 打印单据

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function SalesFormClient({
  initialCustomers = [],
  initialProducts = [],
  initialSavedOrders = [],
  initialInventoryMovements = [],
  onSaved = async () => {},
  readSource = "supabase_unavailable"
}) {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const initialDraft = useMemo(
    () => createSalesDraft(initialCustomers, initialProducts),
    [initialCustomers, initialProducts]
  );
  const [products, setProducts] = useState(initialProducts);
  const [customerName, setCustomerName] = useState(initialDraft.customer?.name ?? "");
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [lines, setLines] = useState(initialDraft.lines);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [savedOrders, setSavedOrders] = useState(initialSavedOrders);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [inventoryMovements, setInventoryMovements] = useState(initialInventoryMovements);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const selectedCustomer = initialCustomers.find((customer) => customer.name === customerName);
  const selectedSavedOrder =
    savedOrders.find((savedOrder) => savedOrder.order.orderNumber === selectedOrderNumber) ??
    savedOrders.at(-1);
  const salesDetail = selectedSavedOrder
    ? createPrintableSalesOrderDetail(selectedSavedOrder)
    : null;
  const paymentSummary = getPaymentStatusSummary(savedOrders);
  const receivableRows = getReceivableRows(savedOrders);
  const receivableSummary = getCustomerReceivableSummary(savedOrders);
  const totals = calculateSalesDraftTotals({
    lines,
    paymentAmount: Number(paymentAmount)
  });

  useEffect(() => {
    const nextDraft = createSalesDraft(initialCustomers, initialProducts);

    setProducts(initialProducts);
    setSavedOrders(initialSavedOrders);
    setInventoryMovements(initialInventoryMovements);
    setCustomerName(nextDraft.customer?.name ?? "");
    setSelectedProductIndex(0);
    setLines(nextDraft.lines);
    setPaymentAmount("0");
    setNotes("");
    setSelectedOrderNumber(initialSavedOrders.at(-1)?.order.orderNumber ?? "");
    setErrors({});
    setNotice("");
  }, [initialCustomers, initialInventoryMovements, initialProducts, initialSavedOrders]);

  function addSelectedProduct() {
    const product = products[Number(selectedProductIndex)];

    if (!product) {
      return;
    }

    setLines((currentLines) => addSalesLine(currentLines, product));
  }

  function removeLine(index) {
    setLines((currentLines) => removeSalesLine(currentLines, index));
  }

  async function saveCurrentOrder() {
    const draft = {
      customer: selectedCustomer,
      lines,
      paymentAmount: Number(paymentAmount),
      notes
    };
    const result = saveSalesOrder(savedOrders, draft);

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setNotice("请检查标记的字段。");
      return;
    }

    const inventoryErrors = validateSalesOrderInventory(products, result.savedOrder);

    if (Object.keys(inventoryErrors).length > 0) {
      setErrors(inventoryErrors);
      setNotice("保存前请先检查库存。");
      return;
    }

    const saveResult = await saveSalesOrderToApi({
      authClient,
      draft,
      readSource
    });

    if (!saveResult.ok) {
      setErrors({});
      setNotice(saveResult.message);
      return;
    }

    setErrors({});
    setNotice(saveResult.message);
    setSelectedOrderNumber(saveResult.orderNumber ?? "");
    await onSaved();
  }

  return (
    <div className="grid gap-5 py-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
      <section className="grid h-fit gap-5 rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">开单设置</p>
          <h2 className="mt-1 text-xl font-semibold">柜台销售</h2>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          <span>客户</span>
          <select
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setCustomerName(event.target.value)}
            value={customerName}
          >
            {initialCustomers.map((customer) => (
              <option key={customer.name} value={customer.name}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>添加商品</span>
          <select
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setSelectedProductIndex(event.target.value)}
            value={selectedProductIndex}
          >
            {products.map((product, index) => (
              <option key={`${product.name}-${product.spec}-${index}`} value={index}>
                {product.name} - {product.spec} ({number.format(product.currentStock)} {product.unit})
              </option>
            ))}
          </select>
        </label>

        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          disabled={products.length === 0}
          onClick={addSelectedProduct}
          type="button"
        >
          添加明细
        </button>

        <label className="grid gap-1 text-sm font-semibold">
          <span>本次收款</span>
          <input
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            min="0"
            onChange={(event) => setPaymentAmount(event.target.value)}
            step="0.01"
            type="number"
            value={paymentAmount}
          />
          {errors.paymentAmount ? (
            <span className="text-xs font-medium text-[#b91c1c]">{errors.paymentAmount}</span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>备注</span>
          <textarea
            className="min-h-24 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>

        {errors.customer ? <p className="text-sm font-medium text-[#b91c1c]">{errors.customer}</p> : null}
        {errors.lines ? <p className="text-sm font-medium text-[#b91c1c]">{errors.lines}</p> : null}
        {errors.inventory ? <p className="text-sm font-medium text-[#b91c1c]">{errors.inventory}</p> : null}
        <p className="min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>

        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          disabled={initialCustomers.length === 0 || products.length === 0}
          onClick={saveCurrentOrder}
          type="button"
        >
          保存销售单
        </button>
      </section>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid gap-3 border-b border-[var(--border)] px-4 py-3 md:grid-cols-4">
          <Metric label="小计" value={formatMoney(totals.subtotal)} />
          <Metric label="优惠" value={formatMoney(totals.discountAmount)} />
          <Metric label="合计" value={formatMoney(totals.totalAmount)} />
          <Metric label="状态" value={formatPaymentStatusLabel(totals.paymentStatus)} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>商品</Column>
                <Column>规格</Column>
                <Column align="right">数量</Column>
                <Column align="right">单价</Column>
                <Column align="right">优惠</Column>
                <Column align="right">行合计</Column>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={6}>
                    暂无可开单商品，请先确认数据库商品目录。
                  </Cell>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr className="border-t border-[var(--border)]" key={`${line.productNameSnapshot}-${line.specSnapshot}-${index}`}>
                    <Cell className="font-semibold">
                      <div className="flex items-center gap-3">
                        <span>{line.productNameSnapshot}</span>
                        <button
                          aria-label={`删除 ${line.productNameSnapshot} ${line.specSnapshot}`}
                          className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--danger-ink)]"
                          onClick={() => removeLine(index)}
                          type="button"
                        >
                          删除
                        </button>
                      </div>
                    </Cell>
                    <Cell>{line.specSnapshot}</Cell>
                    <Cell align="right">
                      <input
                        className="w-20 rounded-md border border-[var(--border)] px-2 py-1 text-right"
                        min="0"
                        onChange={(event) =>
                          setLines((currentLines) =>
                            updateSalesLineQuantity(currentLines, index, event.target.value)
                          )
                        }
                        step="1"
                        type="number"
                        value={line.quantity}
                      />
                    </Cell>
                    <Cell align="right">{formatMoney(line.unitPrice)}</Cell>
                    <Cell align="right">
                      <input
                        className="w-24 rounded-md border border-[var(--border)] px-2 py-1 text-right"
                        min="0"
                        onChange={(event) =>
                          setLines((currentLines) =>
                            updateSalesLineDiscount(currentLines, index, event.target.value)
                          )
                        }
                        step="0.01"
                        type="number"
                        value={line.discountAmount}
                      />
                    </Cell>
                    <Cell align="right">{formatMoney(line.lineTotal)}</Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <SummaryPanel
          inventoryMovements={inventoryMovements}
          paymentSummary={paymentSummary}
          receivableRows={receivableRows}
          receivableSummary={receivableSummary}
          salesDetail={salesDetail}
          savedOrders={savedOrders}
          setSelectedOrderNumber={setSelectedOrderNumber}
        />
      </section>
    </div>
  );
}

async function saveSalesOrderToApi({ authClient, draft, readSource }) {
  if (readSource !== "supabase") {
    return {
      ok: false,
      message: "数据库目录未就绪，未写入数据库。"
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
    const response = await fetch("/api/sales/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: formatSalesApiErrorMessage(body.errors)
      };
    }

    const orderNumber = body.saved?.order_number;

    return {
      ok: true,
      orderNumber,
      message: `已写入数据库销售事务：${orderNumber ?? "已保存"}。`
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未写入远端。"
    };
  }
}

function SummaryPanel({
  inventoryMovements,
  paymentSummary,
  receivableRows,
  receivableSummary,
  salesDetail,
  savedOrders,
  setSelectedOrderNumber
}) {
  return (
    <div className="grid gap-4 border-t border-[var(--border)] px-4 py-4">
      <section>
        <p className="text-xs uppercase text-[var(--muted)]">收款状态</p>
        <h2 className="mt-1 text-lg font-semibold">
          应收款 {formatMoney(paymentSummary.totals.receivableAmount)}
        </h2>
      </section>

      <section>
        <p className="text-xs uppercase text-[var(--muted)]">客户应收款</p>
        <h2 className="mt-1 text-lg font-semibold">
          {number.format(receivableSummary.customerCount)} 位客户待收 {formatMoney(receivableSummary.receivableAmount)}
        </h2>
        <div className="mt-3 grid gap-2">
          {receivableRows.map((row) => (
            <div className="grid gap-2 rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm md:grid-cols-[1fr_auto_auto]" key={row.customerName}>
              <span className="font-semibold">{row.customerName}</span>
              <span>{number.format(row.orderCount)} 张单</span>
              <span className="font-semibold">待收 {formatMoney(row.receivableAmount)}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs uppercase text-[var(--muted)]">已保存销售单</p>
        <h2 className="mt-1 text-lg font-semibold">{savedOrders.length} 张数据库销售单</h2>
        <div className="mt-3 grid gap-2">
          {savedOrders.map((savedOrder) => (
            <button
              className="grid gap-2 rounded-md bg-[var(--accent-soft)] px-3 py-2 text-left text-sm transition hover:bg-[#e5edf5] md:grid-cols-[1fr_auto_auto]"
              key={savedOrder.order.orderNumber}
              onClick={() => setSelectedOrderNumber(savedOrder.order.orderNumber)}
              type="button"
            >
              <span className="font-semibold">{savedOrder.order.orderNumber}</span>
              <span>{savedOrder.order.customerNameSnapshot}</span>
              <span className="font-semibold">{formatMoney(savedOrder.order.totalAmount)}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">销售单明细</p>
            <h2 className="mt-1 text-lg font-semibold">
              {salesDetail ? salesDetail.header.orderNumber : "未选择销售单"}
            </h2>
          </div>
          <button
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            disabled={!salesDetail}
            onClick={() => window.print()}
            type="button"
          >
            打印单据
          </button>
        </div>
      </section>

      <section>
        <p className="text-xs uppercase text-[var(--muted)]">库存流水</p>
        <h2 className="mt-1 text-lg font-semibold">{inventoryMovements.length} 条数据库流水</h2>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
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
