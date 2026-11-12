export const day003Tables = [
  {
    name: "products",
    purpose: "维护涂料、底漆、稀释剂、色浆、辅料和工具的商品目录。",
    fields: [
      "id",
      "name",
      "spec",
      "unit",
      "cost_price",
      "sale_price",
      "current_stock",
      "low_stock_threshold",
      "active",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "customers",
    purpose: "维护客户资料和滚动应收余额。",
    fields: [
      "id",
      "name",
      "phone",
      "notes",
      "receivable_balance",
      "active",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "suppliers",
    purpose: "维护供应商资料和轻量应付余额。",
    fields: [
      "id",
      "name",
      "phone",
      "notes",
      "payable_balance",
      "active",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "sales_orders",
    purpose: "销售单的主单据。",
    fields: [
      "id",
      "order_number",
      "customer_id",
      "order_date",
      "subtotal",
      "discount_amount",
      "total_amount",
      "payment_status",
      "receivable_delta",
      "notes",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "sales_order_items",
    purpose: "销售单中的商品明细行。",
    fields: [
      "id",
      "sales_order_id",
      "product_id",
      "product_name_snapshot",
      "spec_snapshot",
      "quantity",
      "unit",
      "unit_price",
      "discount_amount",
      "line_total",
      "created_at"
    ]
  },
  {
    name: "purchase_orders",
    purpose: "供应商到货入库的主单据。",
    fields: [
      "id",
      "order_number",
      "supplier_id",
      "received_date",
      "subtotal",
      "total_amount",
      "payment_status",
      "payable_delta",
      "notes",
      "created_at",
      "updated_at"
    ]
  },
  {
    name: "purchase_order_items",
    purpose: "供应商到货入库的商品明细行。",
    fields: [
      "id",
      "purchase_order_id",
      "product_id",
      "product_name_snapshot",
      "spec_snapshot",
      "quantity",
      "unit",
      "unit_cost",
      "line_total",
      "created_at"
    ]
  },
  {
    name: "payments",
    purpose: "用于核销应收款的客户收款记录。",
    affectsStock: false,
    fields: [
      "id",
      "customer_id",
      "sales_order_id",
      "payment_date",
      "amount",
      "method",
      "notes",
      "created_at"
    ]
  },
  {
    name: "inventory_movements",
    purpose: "记录每一次库存变化的审计流水。",
    fields: [
      "id",
      "product_id",
      "movement_type",
      "quantity_delta",
      "stock_after",
      "source_table",
      "source_id",
      "notes",
      "created_at"
    ]
  }
];

export const flowToTableCoverage = {
  sales_billing: [
    "sales_orders",
    "sales_order_items",
    "inventory_movements",
    "payments",
    "customers"
  ],
  purchase_receiving: [
    "purchase_orders",
    "purchase_order_items",
    "inventory_movements",
    "products",
    "suppliers"
  ],
  payment_tracking: ["payments", "sales_orders", "customers"]
};

export function getTableNames() {
  return day003Tables.map((table) => table.name);
}

export function findTable(name) {
  const table = day003Tables.find((candidate) => candidate.name === name);

  if (!table) {
    throw new Error(`Unknown table: ${name}`);
  }

  return table;
}
