"use client";

import Link from "next/link";

import { formatMoney } from "../../../src/money.js";
import { createPrintableSalesBill } from "../../../src/sales-print.js";
import { useDatabasePageData } from "../../useDatabasePageData.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function PrintSalesBillPage() {
  const { data } = useDatabasePageData();
  const latestSalesOrder = data.savedOrders.rows[0];
  const activeStore = data.stores.rows[0];
  const bill = latestSalesOrder
    ? createPrintableSalesBill(latestSalesOrder, {
        shopName: activeStore?.name,
        shopPhone: activeStore?.phone,
        shopAddress: activeStore?.address
      })
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-6">
      <header className="no-print flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/sales">
            返回销售开单
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">打印销售单</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            浏览器打印预览数据库中最新的销售单。
          </p>
        </div>
        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.print()}
          type="button"
        >
          浏览器打印
        </button>
      </header>

      {bill ? (
        <div className="print-preview-shell mt-6 overflow-x-auto">
          <section className="sales-print-form bg-white text-[#1f4a9d]">
            <div className="form-copy-label">{bill.header.copyLabel || "①白存根 ②红客户 ③黄回单"}</div>
            <div className="form-title-row">
              <div className="form-title-block">
                <div className="form-title-prefix">{bill.template.titlePrefix || "示例涂料门店"}</div>
                <div className="form-title">{bill.shop.name} 销售单</div>
              </div>
              <div className="form-serial">{bill.header.orderNumber}</div>
            </div>
            <div className="form-shop-row">
              <span aria-hidden="true" />
              <span>{bill.shop.phone}</span>
              <span>{bill.header.paymentStamp}</span>
            </div>

            <div className="form-meta-grid">
              <PrintField label="客户名称" value={bill.template.fields.customerName} />
              <PrintField label="送货日期" value={bill.template.fields.deliveryDate} />
              <PrintField label="单据编号" value={bill.template.fields.orderNumber} />
              <PrintField label="联系人" value={bill.template.fields.contactPerson} />
              <PrintField label="客户手机" value={bill.template.fields.customerPhone} />
              <PrintField label="客户座机" value={bill.template.fields.customerLandline} />
              <PrintField wide label="联系地址" value={bill.template.fields.contactAddress} />
              <PrintField label="摘要" value={bill.template.fields.summary} />
            </div>

            <table className="print-grid">
              <colgroup>
                <col className="col-index" />
                <col className="col-product" />
                <col className="col-spec" />
                <col className="col-unit" />
                <col className="col-quantity" />
                <col className="col-price" />
                <col className="col-amount" />
                <col className="col-notes" />
              </colgroup>
              <thead>
                <tr>
                  <th>编号</th>
                  <th>商品全名</th>
                  <th>规格</th>
                  <th>单位</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>金额</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {bill.template.table.rows.map((row, index) => (
                  <tr key={`print-row-${index}`}>
                    <PrintCell>{row.lineNumber}</PrintCell>
                    <PrintCell>{row.productName}</PrintCell>
                    <PrintCell>{row.spec}</PrintCell>
                    <PrintCell>{row.unit}</PrintCell>
                    <PrintCell align="right">{printValue(row.quantity)}</PrintCell>
                    <PrintCell align="right">{printMoney(row.unitPrice)}</PrintCell>
                    <PrintCell align="right">{printMoney(row.amount)}</PrintCell>
                    <PrintCell>{row.notes}</PrintCell>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-total-row">
              <span>总计大写：{bill.template.totals.totalAmountUppercase}</span>
              <span>数量：{printValue(bill.template.totals.totalQuantity)}</span>
              <span>总计：{formatMoney(bill.totals.totalAmount)}</span>
            </div>

            <p className="form-notice">注：卸货时，请仔细核对产品的数量，价格，型号等，如签字后，再发生异议本公司概不负责。</p>

            <p className="form-footer-contact">{bill.template.footerContact}</p>

            <div className="form-signatures">
              {bill.template.signatures.map((label) => (
                <span key={label}>{label}：</span>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="mt-6 rounded-md border border-[var(--border)] bg-[var(--panel)] p-6">
          <h2 className="text-xl font-semibold">暂无可打印销售单</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">当前数据库中还没有销售单。</p>
        </section>
      )}

      <style>{`
        .print-preview-shell {
          max-width: 100%;
          padding-bottom: 16px;
        }

        .sales-print-form {
          position: relative;
          width: 241mm;
          height: 140mm;
          padding: 4mm 10mm 5mm 8mm;
          border: 1px solid #8aa0d6;
          box-shadow: var(--paper-shadow);
          font-family: "SimSun", "Songti SC", "Noto Serif CJK SC", serif;
          font-size: 3mm;
          line-height: 1.2;
          overflow: hidden;
        }

        .form-copy-label {
          position: absolute;
          top: 7mm;
          right: 2.2mm;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          height: auto;
          font-size: 2.8mm;
          font-weight: 700;
          letter-spacing: 0;
        }

        .form-title-row {
          display: grid;
          grid-template-columns: 1fr 38mm;
          align-items: end;
          gap: 6mm;
          min-height: 10mm;
        }

        .form-title-block {
          align-self: start;
          margin-top: -1mm;
          text-align: center;
        }

        .form-title-prefix {
          font-size: 4mm;
          font-weight: 700;
          line-height: 1;
        }

        .form-title {
          margin-top: 0.6mm;
          font-size: 5.4mm;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1;
        }

        .form-serial {
          text-align: right;
          font-size: 4mm;
          font-weight: 700;
        }

        .form-shop-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 8mm;
          margin-top: 0.5mm;
          min-height: 4mm;
          font-size: 2.8mm;
        }

        .form-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 1mm;
          border-top: 0.35mm solid currentColor;
          border-left: 0.35mm solid currentColor;
        }

        .print-field {
          display: grid;
          grid-template-columns: 18mm minmax(0, 1fr);
          min-height: 6mm;
          border-right: 0.35mm solid currentColor;
          border-bottom: 0.35mm solid currentColor;
        }

        .print-field-wide {
          grid-column: span 2;
          grid-template-columns: 18mm minmax(0, 1fr);
        }

        .print-field-label {
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 0.35mm solid currentColor;
          font-weight: 700;
          white-space: nowrap;
        }

        .print-field-value {
          display: flex;
          align-items: center;
          padding: 0 2mm;
          overflow: hidden;
          white-space: nowrap;
        }

        .print-grid {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          color: inherit;
        }

        .print-grid th,
        .print-grid td {
          height: 6mm;
          border: 0.35mm solid currentColor;
          padding: 0 1.5mm;
          overflow: hidden;
          vertical-align: middle;
          white-space: nowrap;
        }

        .print-grid th {
          height: 6.5mm;
          text-align: center;
          font-weight: 700;
        }

        .print-cell-right {
          text-align: right;
        }

        .col-index {
          width: 9mm;
        }

        .col-product {
          width: 70mm;
        }

        .col-spec {
          width: 24mm;
        }

        .col-unit {
          width: 14mm;
        }

        .col-quantity {
          width: 20mm;
        }

        .col-price,
        .col-amount {
          width: 24mm;
        }

        .col-notes {
          width: auto;
        }

        .form-total-row {
          display: grid;
          grid-template-columns: 1fr 28mm 42mm;
          min-height: 7mm;
          border-right: 0.35mm solid currentColor;
          border-bottom: 0.35mm solid currentColor;
          border-left: 0.35mm solid currentColor;
        }

        .form-total-row span {
          display: flex;
          align-items: center;
          padding: 0 2mm;
          border-right: 0.35mm solid currentColor;
          font-weight: 700;
          white-space: nowrap;
        }

        .form-total-row span:last-child {
          border-right: 0;
        }

        .form-notice {
          margin: 1.2mm 0 0;
          font-size: 2.8mm;
          line-height: 1.2;
        }

        .form-footer-contact {
          margin: 1.2mm 0 0;
          font-size: 2.9mm;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
        }

        .form-signatures {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8mm;
          margin-top: 1.6mm;
          font-size: 2.9mm;
          white-space: nowrap;
        }

        @media print {
          @page {
            size: 140mm 241mm;
            margin: 0;
          }

          html,
          body {
            width: 140mm;
            min-height: 241mm;
            background: white;
          }

          body {
            margin: 0;
          }

          .app-shell {
            display: block !important;
          }

          .app-content {
            display: block !important;
          }

          .app-sidebar,
          .app-mobile-chrome,
          .no-print {
            display: none !important;
          }

          main {
            width: 140mm !important;
            min-height: 241mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-preview-shell {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .sales-print-form {
            border: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 4mm 10mm 5mm 8mm !important;
            transform: rotate(90deg) translateY(-140mm);
            transform-origin: top left;
          }
        }
      `}</style>
    </main>
  );
}

function PrintField({ label, value, wide = false }) {
  return (
    <div className={`print-field ${wide ? "print-field-wide" : ""}`}>
      <span className="print-field-label">{label}</span>
      <span className="print-field-value">{value}</span>
    </div>
  );
}

function PrintCell({ align = "left", children }) {
  return <td className={align === "right" ? "print-cell-right" : ""}>{children}</td>;
}

function printMoney(value) {
  return value === "" || value === undefined || value === null ? "" : formatMoney(value);
}

function printValue(value) {
  return value === "" || value === undefined || value === null ? "" : number.format(value);
}
