const protectedBusinessTables = [
  "sales_orders",
  "sales_order_items",
  "purchase_orders",
  "purchase_order_items",
  "payments",
  "inventory_movements"
];

export function listProtectedBusinessTables() {
  return [...protectedBusinessTables];
}

export function getCorrectionPolicy(target, context = {}) {
  if (target === "sales_order") {
    return getSalesOrderCorrectionPolicy(context);
  }

  if (target === "customer_payment") {
    return {
      target: "customer_payment",
      canDelete: false,
      canReverseNow: false,
      reason: "standalone_customer_payment_chain_deferred",
      requiredAction: "implement_payment_reversal_with_payment_workflow"
    };
  }

  return {
    target,
    canDelete: false,
    canReverseNow: false,
    reason: "manual_correction_policy_required",
    requiredAction: "define_specific_reversal_transaction"
  };
}

function getSalesOrderCorrectionPolicy(context) {
  const paymentAmount = Number(context.paymentAmount ?? 0);

  if (paymentAmount > 0) {
    return {
      target: "sales_order",
      canDelete: false,
      canReverseNow: false,
      reason: "sales_order_payment_reversal_deferred",
      requiredAction: "wait_for_standalone_payment_reversal_sprint"
    };
  }

  return {
    target: "sales_order",
    canDelete: false,
    canReverseNow: true,
    reason: "sales_order_reversal_supported_when_no_payment_is_attached",
    requiredAction: "reverse_sales_order_transaction"
  };
}
