export function getReceivableRows(savedOrders) {
  const rowsByCustomer = new Map();

  for (const savedOrder of savedOrders) {
    const order = savedOrder.order;

    if (order.receivableDelta <= 0) {
      continue;
    }

    const existing = rowsByCustomer.get(order.customerNameSnapshot);

    if (existing) {
      existing.orderCount += 1;
      existing.receivableAmount = roundMoney(existing.receivableAmount + order.receivableDelta);
      existing.latestOrderDate = maxDate(existing.latestOrderDate, order.orderDate);
      existing.orderNumbers.push(order.orderNumber);
      existing.paymentStatuses.push(order.paymentStatus);
    } else {
      rowsByCustomer.set(order.customerNameSnapshot, {
        customerName: order.customerNameSnapshot,
        orderCount: 1,
        receivableAmount: order.receivableDelta,
        latestOrderDate: order.orderDate,
        orderNumbers: [order.orderNumber],
        paymentStatuses: [order.paymentStatus]
      });
    }
  }

  return [...rowsByCustomer.values()].sort(
    (left, right) =>
      right.receivableAmount - left.receivableAmount ||
      left.customerName.localeCompare(right.customerName)
  );
}

export function getCustomerReceivableSummary(savedOrders) {
  const rows = getReceivableRows(savedOrders);

  return {
    customerCount: rows.length,
    orderCount: rows.reduce((total, row) => total + row.orderCount, 0),
    receivableAmount: roundMoney(
      rows.reduce((total, row) => total + row.receivableAmount, 0)
    )
  };
}

function maxDate(left, right) {
  return left > right ? left : right;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
