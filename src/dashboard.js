import { getLowStockAlertSummary } from "./low-stock-alerts.js";
import { getCustomerReceivableSummary } from "./receivables.js";

export function getDashboardSummary({ savedOrders, products, todayDate }) {
  const todayRows = getTodaySalesRows(savedOrders, todayDate);
  const receivableSummary = getCustomerReceivableSummary(savedOrders);
  const lowStockSummary = getLowStockAlertSummary(products);

  return {
    todayOrderCount: todayRows.length,
    todaySalesAmount: roundMoney(
      todayRows.reduce((total, row) => total + row.totalAmount, 0)
    ),
    todayCollectionAmount: roundMoney(
      todayRows.reduce((total, row) => total + row.paymentAmount, 0)
    ),
    receivableAmount: receivableSummary.receivableAmount,
    receivableCustomerCount: receivableSummary.customerCount,
    lowStockCount: lowStockSummary.lowStockCount
  };
}

export function getTodaySalesRows(savedOrders, todayDate) {
  return savedOrders
    .filter((savedOrder) => savedOrder.order.orderDate === todayDate)
    .map((savedOrder) => ({
      orderNumber: savedOrder.order.orderNumber,
      customerName: savedOrder.order.customerNameSnapshot,
      totalAmount: savedOrder.order.totalAmount,
      paymentAmount: savedOrder.order.paymentAmount,
      receivableDelta: savedOrder.order.receivableDelta,
      paymentStatus: savedOrder.order.paymentStatus
    }))
    .sort((left, right) => right.orderNumber.localeCompare(left.orderNumber));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
