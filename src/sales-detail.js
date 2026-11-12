export function createPrintableSalesOrderDetail(savedOrder) {
  const lines = savedOrder.items.map((item, index) => ({
    lineNumber: index + 1,
    product: item.productNameSnapshot,
    spec: item.specSnapshot,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    lineTotal: item.lineTotal
  }));

  return {
    header: {
      title: "销售单",
      orderNumber: savedOrder.order.orderNumber,
      customer: savedOrder.order.customerNameSnapshot,
      orderDate: savedOrder.order.orderDate,
      paymentStatus: getSalesOrderDetailStatusLabel(savedOrder.order.paymentStatus)
    },
    lines,
    totals: {
      subtotal: savedOrder.order.subtotal,
      discountAmount: savedOrder.order.discountAmount,
      totalAmount: savedOrder.order.totalAmount,
      paymentAmount: savedOrder.order.paymentAmount,
      receivableDelta: savedOrder.order.receivableDelta,
      itemCount: lines.length,
      totalQuantity: sumLineQuantity(lines)
    },
    notes: savedOrder.order.notes
  };
}

export function getSalesOrderDetailStatusLabel(status) {
  const labels = {
    paid: "已收清",
    partial: "部分收款",
    unpaid: "未收款"
  };

  return labels[status] ?? "待确认";
}

function sumLineQuantity(lines) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
