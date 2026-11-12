const salesErrorMessages = {
  loading_store_context: "正在读取门店信息，请稍后再保存销售单。",
  missing_store_context: "当前账号没有可用门店，销售单未写入数据库。",
  role_forbidden: "当前账号角色无权保存销售单。",
  sales_client_unavailable: "数据库销售服务未就绪，销售单未写入数据库。",
  sales_customer_id_required: "请选择数据库客户后再保存销售单。",
  sales_product_id_required: "请选择数据库商品后再保存销售单。",
  sales_stock_insufficient: "商品库存不足，销售单未写入数据库。",
  sales_payment_exceeds_total: "本次收款不能大于销售合计。"
};

export function formatSalesApiErrorMessage(errors = {}) {
  const firstError = getFirstError(errors);

  if (!firstError) {
    return "数据库销售事务写入失败，请检查库存、门店或收款金额。";
  }

  if (isMissingSalesTransactionFunction(firstError)) {
    return "数据库销售事务函数未部署，请在 Supabase SQL Editor 执行 supabase/migrations/0003_sales_order_transaction.sql 后重试。";
  }

  return salesErrorMessages[firstError] ?? `数据库销售事务写入失败：${firstError}`;
}

function getFirstError(errors) {
  if (typeof errors === "string") {
    return errors;
  }

  const values = Object.values(errors ?? {});

  return values.length > 0 ? String(values[0]) : "";
}

function isMissingSalesTransactionFunction(error) {
  const normalized = String(error).toLowerCase();

  return normalized.includes("could not find the function") &&
    normalized.includes("save_sales_order_transaction");
}
