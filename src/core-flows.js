export const day002CoreFlows = [
  {
    id: "sales_billing",
    priority: 1,
    title: "销售开单",
    actor: "clerk or owner",
    primaryDocument: "sales_order",
    affectsStock: true,
    trigger:
      "散客或长期施工客户购买乳胶漆、底漆、稀释剂、辅料或工具。",
    steps: [
      "选择客户，或快速新建客户。",
      "把商品、数量、单价、优惠和备注加入销售单。",
      "选择收款状态：已收清、部分收款或未收款。",
      "保存销售单，并打印或分享给客户。",
      "复核自动扣减库存和客户应收变化。"
    ],
    dataEffects: [
      "create sales_order",
      "create sales_order_items",
      "create inventory_movements for stock deduction",
      "create or update payment record",
      "increase customer receivable when unpaid or partially paid"
    ],
    completionSignal:
      "门店可以给客户出示销售单，同时用同一张单据更新库存、收款和应收状态。"
  },
  {
    id: "purchase_receiving",
    priority: 2,
    title: "采购入库",
    actor: "owner or inventory clerk",
    primaryDocument: "purchase_order",
    affectsStock: true,
    trigger:
      "供应商送货到店，门店需要记录新增库存和供应商付款状态。",
    steps: [
      "选择供应商，或快速新建供应商。",
      "加入到货商品、数量、进价和到货备注。",
      "记录供应商货款已付、部分付款或未付款。",
      "保存采购入库单。",
      "复核自动入库数量和供应商付款状态。"
    ],
    dataEffects: [
      "create purchase_order",
      "create purchase_order_items",
      "create inventory_movements for stock receiving",
      "update product cost reference when useful",
      "record supplier payment status"
    ],
    completionSignal:
      "门店无需手动改商品库存，就能确认新到货数量和供应商付款状态。"
  },
  {
    id: "payment_tracking",
    priority: 3,
    title: "收款跟踪",
    actor: "owner or receivables keeper",
    primaryDocument: "payment",
    affectsStock: false,
    trigger:
      "客户结清旧账、支付部分欠款，或在新赊销单中合并付款。",
    steps: [
      "打开客户应收页面。",
      "查看未收款和部分收款的销售单。",
      "记录收款金额、方式、日期和可选备注。",
      "把收款关联到一张或多张销售单。",
      "复核更新后的客户应收余额。"
    ],
    dataEffects: [
      "create payment",
      "link payment to one or more sales orders",
      "reduce customer receivable balance",
      "update sales order payment status",
      "leave inventory_movements unchanged"
    ],
    completionSignal:
      "门店无需重新计算，就能说明客户最近一次收款、未结清单据和剩余应收余额。"
  }
];

export function findCoreFlow(id) {
  const flow = day002CoreFlows.find((candidate) => candidate.id === id);

  if (!flow) {
    throw new Error(`Unknown core flow: ${id}`);
  }

  return flow;
}
