import { formatMoney } from "./money.js";

export function searchDatabaseRecords({ products = [], customers = [], savedOrders = [], query = "" }) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const productResults = products
    .filter((product) => matches(normalizedQuery, [product.name, product.spec, product.unit]))
    .map((product) => ({
      type: "product",
      title: product.name,
      subtitle: product.spec,
      detail: `库存 ${product.currentStock} ${product.unit}`
    }));

  const customerResults = customers
    .filter((customer) => matches(normalizedQuery, [customer.name, customer.phone, customer.notes]))
    .map((customer) => ({
      type: "customer",
      title: customer.name,
      subtitle: customer.phone || "未登记电话",
      detail: customer.notes
    }));

  const orderResults = savedOrders
    .filter((savedOrder) => {
      const order = savedOrder.order;

      return matches(normalizedQuery, [
        order.orderNumber,
        order.customerNameSnapshot,
        order.orderDate,
        order.paymentStatus,
        order.notes,
        ...(savedOrder.items || []).flatMap((item) => [
          item.productNameSnapshot,
          item.specSnapshot
        ])
      ]);
    })
    .map((savedOrder) => {
      const order = savedOrder.order;

      return {
        type: "order",
        title: order.orderNumber,
        subtitle: order.customerNameSnapshot,
        detail: `${order.orderDate} ${formatPaymentStatus(order.paymentStatus)} ${formatMoney(order.totalAmount)}`,
        sortKey: `${order.orderDate}-${order.orderNumber}`
      };
    })
    .sort((left, right) => right.sortKey.localeCompare(left.sortKey))
    .map(({ sortKey, ...result }) => result);

  return [...productResults, ...customerResults, ...orderResults];
}

export const searchLocalRecords = searchDatabaseRecords;

export function getSearchSummary(results = []) {
  return results.reduce(
    (summary, result) => {
      summary.totalResults += 1;

      if (result.type === "product") {
        summary.productCount += 1;
      }

      if (result.type === "customer") {
        summary.customerCount += 1;
      }

      if (result.type === "order") {
        summary.orderCount += 1;
      }

      return summary;
    },
    {
      totalResults: 0,
      productCount: 0,
      customerCount: 0,
      orderCount: 0
    }
  );
}

function matches(query, values) {
  return values.some((value) => normalize(value).includes(query));
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatPaymentStatus(status) {
  const labels = {
    paid: "已收清",
    partial: "部分收款",
    unpaid: "未收款"
  };

  return labels[status] ?? "待确认";
}
