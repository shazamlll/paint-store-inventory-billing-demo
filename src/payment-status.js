const statusLabels = {
  paid: "已收清",
  partial: "部分收款",
  unpaid: "未收款"
};

const statusTones = {
  paid: "settled",
  partial: "watch",
  unpaid: "risk"
};

export function getPaymentStatusSummary(savedOrders) {
  const byStatus = {
    paid: createStatusBucket("paid"),
    partial: createStatusBucket("partial"),
    unpaid: createStatusBucket("unpaid")
  };
  const totals = {
    orderCount: 0,
    totalAmount: 0,
    paymentAmount: 0,
    receivableAmount: 0
  };

  for (const savedOrder of savedOrders) {
    const order = savedOrder.order;
    const bucket = byStatus[order.paymentStatus] ?? byStatus.unpaid;

    addOrderToBucket(totals, order);
    addOrderToBucket(bucket, order);
  }

  return {
    totals: roundSummary(totals),
    byStatus: {
      paid: roundSummary(byStatus.paid),
      partial: roundSummary(byStatus.partial),
      unpaid: roundSummary(byStatus.unpaid)
    }
  };
}

export function createPaymentDraftFromSalesOrder(savedOrder) {
  return {
    sourceTable: "sales_orders",
    sourceOrderNumber: savedOrder.order.orderNumber,
    customerNameSnapshot: savedOrder.order.customerNameSnapshot,
    paymentDate: savedOrder.order.orderDate,
    amount: savedOrder.order.paymentAmount,
    paymentStatus: savedOrder.order.paymentStatus,
    receivableAfterPayment: savedOrder.order.receivableDelta,
    notes: savedOrder.order.notes
  };
}

export function getPaymentStatusTone(status) {
  return statusTones[status] ?? "neutral";
}

function createStatusBucket(status) {
  return {
    label: statusLabels[status],
    orderCount: 0,
    totalAmount: 0,
    paymentAmount: 0,
    receivableAmount: 0
  };
}

function addOrderToBucket(bucket, order) {
  bucket.orderCount += 1;
  bucket.totalAmount += order.totalAmount;
  bucket.paymentAmount += order.paymentAmount;
  bucket.receivableAmount += order.receivableDelta;
}

function roundSummary(summary) {
  return {
    ...summary,
    totalAmount: roundMoney(summary.totalAmount),
    paymentAmount: roundMoney(summary.paymentAmount),
    receivableAmount: roundMoney(summary.receivableAmount)
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
