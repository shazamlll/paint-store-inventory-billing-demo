import { getLowStockAlertRows, getLowStockAlertSummary } from "./low-stock-alerts.js";
import { formatMoney } from "./money.js";

export { formatMoney };

export function createDailyReport({ savedOrders = [], products = [], reportDate }) {
  const salesRows = savedOrders
    .filter((savedOrder) => savedOrder.order.orderDate === reportDate)
    .map((savedOrder) => ({
      orderNumber: savedOrder.order.orderNumber,
      customerName: savedOrder.order.customerNameSnapshot,
      totalAmount: savedOrder.order.totalAmount,
      paymentAmount: savedOrder.order.paymentAmount,
      receivableDelta: savedOrder.order.receivableDelta,
      paymentStatus: savedOrder.order.paymentStatus
    }))
    .sort((left, right) => right.orderNumber.localeCompare(left.orderNumber));
  const lowStockSummary = getLowStockAlertSummary(products);

  return {
    header: {
      title: "每日结账报告",
      reportDate,
      scope: "数据库销售与库存扫描"
    },
    summary: {
      orderCount: salesRows.length,
      salesAmount: roundMoney(salesRows.reduce((total, row) => total + row.totalAmount, 0)),
      collectionAmount: roundMoney(salesRows.reduce((total, row) => total + row.paymentAmount, 0)),
      receivableAmount: roundMoney(salesRows.reduce((total, row) => total + row.receivableDelta, 0)),
      lowStockCount: lowStockSummary.lowStockCount,
      belowThresholdCount: lowStockSummary.belowThresholdCount,
      atThresholdCount: lowStockSummary.atThresholdCount
    },
    salesRows,
    lowStockRows: getLowStockAlertRows(products),
    footer: "由当前数据库记录生成。闭店前请与现金抽屉和手写记录核对。"
  };
}

export function formatDailyReportMarkdown(report) {
  return [
    `# ${report.header.title} - ${report.header.reportDate}`,
    "",
    `范围：${report.header.scope}`,
    "",
    "## 汇总",
    "",
    `- 订单数：${report.summary.orderCount}`,
    `- 销售额：${formatMoney(report.summary.salesAmount)}`,
    `- 已收款：${formatMoney(report.summary.collectionAmount)}`,
    `- 今日应收：${formatMoney(report.summary.receivableAmount)}`,
    `- 低库存商品：${report.summary.lowStockCount}`,
    "",
    "## 销售单",
    "",
    ...formatSalesRows(report.salesRows),
    "",
    "## 低库存",
    "",
    ...formatLowStockRows(report.lowStockRows),
    "",
    report.footer
  ].join("\n");
}

function formatSalesRows(rows) {
  if (rows.length === 0) {
    return ["当天没有销售单。"];
  }

  return rows.map(
    (row) =>
      `- ${row.orderNumber} | ${row.customerName} | ${formatMoney(row.totalAmount)} | ${formatPaymentStatus(row.paymentStatus)}`
  );
}

function formatLowStockRows(rows) {
  if (rows.length === 0) {
    return ["暂无低库存商品。"];
  }

  return rows.map(
    (row) =>
      `- ${row.productName} ${row.spec} | 库存 ${row.currentStock} ${row.unit} | ${row.statusLabel}`
  );
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatPaymentStatus(status) {
  const labels = {
    paid: "已收清",
    partial: "部分收款",
    unpaid: "未收款"
  };

  return labels[status] ?? "待确认";
}
