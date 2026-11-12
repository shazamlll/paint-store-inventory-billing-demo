import { getDevelopmentReadEnvironment, createDevelopmentReadClient } from "./development-read-connection.js";

const storeColumns = "id,name,phone,address,notes,active,created_at";
const productColumns = "id,store_id,name,spec,unit,cost_price,sale_price,current_stock,low_stock_threshold,active,created_at";
const customerColumns = "id,store_id,name,phone,notes,receivable_balance,active,created_at";
const supplierColumns = "id,store_id,name,phone,notes,payable_balance,active,created_at";
const salesOrderColumns = "id,store_id,order_number,customer_id,order_date,subtotal,discount_amount,total_amount,payment_amount,payment_status,receivable_delta,notes,created_at";
const salesOrderItemColumns = "id,store_id,sales_order_id,product_id,product_name_snapshot,spec_snapshot,quantity,unit,unit_price,discount_amount,line_total,created_at";
const purchaseOrderColumns = "id,store_id,order_number,supplier_id,received_date,subtotal,total_amount,payment_amount,payment_status,payable_delta,notes,created_at";
const purchaseOrderItemColumns = "id,store_id,purchase_order_id,product_id,product_name_snapshot,spec_snapshot,quantity,unit,unit_cost,line_total,created_at";
const inventoryMovementColumns = "id,store_id,product_id,movement_type,quantity_delta,stock_after,source_table,source_id,notes,created_at";

export async function loadDevelopmentPageReadData({
  env = process.env,
  client,
  clientFactory,
  readTimeoutMs = 2500
} = {}) {
  const environment = getDevelopmentReadEnvironment(env);
  const readClient = client ?? createConfiguredClient({ env, environment, clientFactory });

  if (!readClient) {
    return createDatabaseReadData({
      environment,
      stores: unavailableReadState("stores", "数据库公开配置缺失，暂时无法读取门店。"),
      products: unavailableReadState("products", "数据库公开配置缺失，暂时无法读取商品。"),
      customers: unavailableReadState("customers", "数据库公开配置缺失，暂时无法读取客户。"),
      suppliers: unavailableReadState("suppliers", "数据库公开配置缺失，暂时无法读取供应商。"),
      salesOrders: unavailableReadState("sales_orders", "数据库公开配置缺失，暂时无法读取销售单。"),
      salesOrderItems: unavailableReadState("sales_order_items", "数据库公开配置缺失，暂时无法读取销售明细。"),
      purchaseOrders: unavailableReadState("purchase_orders", "数据库公开配置缺失，暂时无法读取采购单。"),
      purchaseOrderItems: unavailableReadState("purchase_order_items", "数据库公开配置缺失，暂时无法读取采购明细。"),
      inventoryMovements: unavailableReadState("inventory_movements", "数据库公开配置缺失，暂时无法读取库存流水。")
    });
  }

  const [
    stores,
    products,
    customers,
    suppliers,
    salesOrders,
    salesOrderItems,
    purchaseOrders,
    purchaseOrderItems,
    inventoryMovements
  ] = await Promise.all([
    readPageTable({
      client: readClient,
      table: "stores",
      columns: storeColumns,
      mapper: mapSupabaseStoreRow,
      emptyNotice: "暂无数据库门店。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "products",
      columns: productColumns,
      mapper: mapSupabaseProductRow,
      emptyNotice: "暂无数据库商品。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "customers",
      columns: customerColumns,
      mapper: mapSupabaseCustomerRow,
      emptyNotice: "暂无数据库客户。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "suppliers",
      columns: supplierColumns,
      mapper: mapSupabaseSupplierRow,
      emptyNotice: "暂无数据库供应商。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "sales_orders",
      columns: salesOrderColumns,
      mapper: mapSupabaseSalesOrderRow,
      emptyNotice: "暂无数据库销售单。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "sales_order_items",
      columns: salesOrderItemColumns,
      mapper: mapSupabaseSalesOrderItemRow,
      emptyNotice: "暂无数据库销售明细。",
      timeoutMs: readTimeoutMs,
      orderColumn: "created_at",
      ascending: true,
      limit: 1000
    }),
    readPageTable({
      client: readClient,
      table: "purchase_orders",
      columns: purchaseOrderColumns,
      mapper: mapSupabasePurchaseOrderRow,
      emptyNotice: "暂无数据库采购单。",
      timeoutMs: readTimeoutMs
    }),
    readPageTable({
      client: readClient,
      table: "purchase_order_items",
      columns: purchaseOrderItemColumns,
      mapper: mapSupabasePurchaseOrderItemRow,
      emptyNotice: "暂无数据库采购明细。",
      timeoutMs: readTimeoutMs,
      orderColumn: "created_at",
      ascending: true,
      limit: 1000
    }),
    readPageTable({
      client: readClient,
      table: "inventory_movements",
      columns: inventoryMovementColumns,
      mapper: mapSupabaseInventoryMovementRow,
      emptyNotice: "暂无数据库库存流水。",
      timeoutMs: readTimeoutMs,
      limit: 1000
    })
  ]);

  return createDatabaseReadData({
    environment,
    stores,
    products,
    customers,
    suppliers,
    salesOrders,
    salesOrderItems,
    purchaseOrders,
    purchaseOrderItems,
    inventoryMovements
  });
}

export function createEmptyDatabaseReadData({
  environment = { ready: false, missing: [] },
  source = "supabase_unavailable",
  notice = "正在读取数据库。"
} = {}) {
  return createDatabaseReadData({
    environment,
    stores: emptyState("stores", source, notice),
    products: emptyState("products", source, notice),
    customers: emptyState("customers", source, notice),
    suppliers: emptyState("suppliers", source, notice),
    salesOrders: emptyState("sales_orders", source, notice),
    salesOrderItems: emptyState("sales_order_items", source, notice),
    purchaseOrders: emptyState("purchase_orders", source, notice),
    purchaseOrderItems: emptyState("purchase_order_items", source, notice),
    inventoryMovements: emptyState("inventory_movements", source, notice)
  });
}

export function mapSupabaseStoreRow(row) {
  return {
    id: stringify(row.id),
    name: stringify(row.name),
    phone: stringify(row.phone),
    address: stringify(row.address),
    notes: stringify(row.notes),
    active: row.active !== false
  };
}

export function mapSupabaseProductRow(row) {
  const product = {
    name: stringify(row.name),
    spec: stringify(row.spec),
    unit: stringify(row.unit),
    costPrice: toNumber(row.cost_price),
    salePrice: toNumber(row.sale_price),
    currentStock: toNumber(row.current_stock),
    lowStockThreshold: toNumber(row.low_stock_threshold)
  };

  addOptionalIds(product, row);

  return product;
}

export function mapSupabaseCustomerRow(row) {
  const customer = {
    name: stringify(row.name),
    phone: stringify(row.phone),
    notes: stringify(row.notes),
    receivableBalance: toNumber(row.receivable_balance)
  };

  addOptionalIds(customer, row);

  return customer;
}

export function mapSupabaseSupplierRow(row) {
  const supplier = {
    name: stringify(row.name),
    phone: stringify(row.phone),
    notes: stringify(row.notes),
    payableBalance: toNumber(row.payable_balance)
  };

  addOptionalIds(supplier, row);

  return supplier;
}

export function mapSupabaseSalesOrderRow(row) {
  return {
    id: stringify(row.id),
    storeId: stringify(row.store_id),
    orderNumber: stringify(row.order_number),
    customerId: stringify(row.customer_id),
    orderDate: stringify(row.order_date),
    subtotal: toNumber(row.subtotal),
    discountAmount: toNumber(row.discount_amount),
    totalAmount: toNumber(row.total_amount),
    paymentAmount: toNumber(row.payment_amount),
    paymentStatus: stringify(row.payment_status),
    receivableDelta: toNumber(row.receivable_delta),
    notes: stringify(row.notes),
    createdAt: stringify(row.created_at)
  };
}

export function mapSupabaseSalesOrderItemRow(row) {
  return {
    id: stringify(row.id),
    storeId: stringify(row.store_id),
    salesOrderId: stringify(row.sales_order_id),
    productId: stringify(row.product_id),
    productNameSnapshot: stringify(row.product_name_snapshot),
    specSnapshot: stringify(row.spec_snapshot),
    quantity: toNumber(row.quantity),
    unit: stringify(row.unit),
    unitPrice: toNumber(row.unit_price),
    discountAmount: toNumber(row.discount_amount),
    lineTotal: toNumber(row.line_total),
    createdAt: stringify(row.created_at)
  };
}

export function mapSupabasePurchaseOrderRow(row) {
  return {
    id: stringify(row.id),
    storeId: stringify(row.store_id),
    orderNumber: stringify(row.order_number),
    supplierId: stringify(row.supplier_id),
    receivedDate: stringify(row.received_date),
    subtotal: toNumber(row.subtotal),
    totalAmount: toNumber(row.total_amount),
    paymentAmount: toNumber(row.payment_amount),
    paymentStatus: stringify(row.payment_status),
    payableDelta: toNumber(row.payable_delta),
    notes: stringify(row.notes),
    createdAt: stringify(row.created_at)
  };
}

export function mapSupabasePurchaseOrderItemRow(row) {
  return {
    id: stringify(row.id),
    storeId: stringify(row.store_id),
    purchaseOrderId: stringify(row.purchase_order_id),
    productId: stringify(row.product_id),
    productNameSnapshot: stringify(row.product_name_snapshot),
    specSnapshot: stringify(row.spec_snapshot),
    quantity: toNumber(row.quantity),
    unit: stringify(row.unit),
    unitCost: toNumber(row.unit_cost),
    lineTotal: toNumber(row.line_total),
    createdAt: stringify(row.created_at)
  };
}

export function mapSupabaseInventoryMovementRow(row) {
  return {
    id: stringify(row.id),
    storeId: stringify(row.store_id),
    productId: stringify(row.product_id),
    movementType: stringify(row.movement_type),
    quantityDelta: toNumber(row.quantity_delta),
    stockAfter: toNumber(row.stock_after),
    sourceTable: stringify(row.source_table),
    sourceId: stringify(row.source_id),
    notes: stringify(row.notes),
    createdAt: stringify(row.created_at)
  };
}

function createConfiguredClient({ env, environment, clientFactory }) {
  if (!environment.ready) {
    return null;
  }

  return createDevelopmentReadClient(env, clientFactory);
}

async function readPageTable({
  client,
  table,
  columns,
  mapper,
  emptyNotice,
  timeoutMs,
  orderColumn = "created_at",
  ascending = false,
  limit = 200
}) {
  try {
    const query = client
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending })
      .limit(limit);

    const { data, error } = await withTimeout(query, timeoutMs);

    if (error) {
      return errorReadState(table, `数据库 ${table} 读取失败。`);
    }

    const rows = (data ?? []).map(mapper);

    if (rows.length === 0) {
      return emptyReadState(table, emptyNotice);
    }

    return {
      table,
      source: "supabase",
      rows,
      remoteRowCount: rows.length,
      notice: "当前显示数据库实时数据。"
    };
  } catch {
    return errorReadState(table, `数据库 ${table} 连接失败。`);
  }
}

function createDatabaseReadData({
  environment,
  stores,
  products,
  customers,
  suppliers,
  salesOrders,
  salesOrderItems,
  purchaseOrders,
  purchaseOrderItems,
  inventoryMovements
}) {
  const savedOrders = stateWithRows(
    "saved_sales_orders",
    buildSavedSalesOrders({
      orders: salesOrders.rows,
      items: salesOrderItems.rows,
      customers: customers.rows
    }),
    [salesOrders, salesOrderItems, customers]
  );
  const savedPurchases = stateWithRows(
    "saved_purchase_orders",
    buildSavedPurchaseOrders({
      orders: purchaseOrders.rows,
      items: purchaseOrderItems.rows,
      suppliers: suppliers.rows
    }),
    [purchaseOrders, purchaseOrderItems, suppliers]
  );
  const mappedInventoryMovements = stateWithRows(
    "inventory_movement_rows",
    buildInventoryMovementRows({
      movements: inventoryMovements.rows,
      products: products.rows,
      savedOrders: savedOrders.rows,
      savedPurchases: savedPurchases.rows
    }),
    [inventoryMovements, products, savedOrders, savedPurchases]
  );

  return {
    canWrite: false,
    environment,
    stores,
    products,
    customers,
    suppliers,
    salesOrders,
    salesOrderItems,
    purchaseOrders,
    purchaseOrderItems,
    savedOrders,
    savedPurchases,
    inventoryMovements: mappedInventoryMovements
  };
}

function buildSavedSalesOrders({ orders, items, customers }) {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const itemsByOrderId = groupBy(items, "salesOrderId");

  return orders.map((order) => ({
    order: {
      id: order.id,
      storeId: order.storeId,
      orderNumber: order.orderNumber,
      customerNameSnapshot: customerById.get(order.customerId)?.name ?? "未命名客户",
      orderDate: order.orderDate,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      totalAmount: order.totalAmount,
      paymentAmount: order.paymentAmount,
      paymentStatus: order.paymentStatus,
      receivableDelta: order.receivableDelta,
      notes: order.notes
    },
    items: (itemsByOrderId.get(order.id) ?? []).map((item) => ({
      salesOrderNumber: order.orderNumber,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      specSnapshot: item.specSnapshot,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal
    }))
  }));
}

function buildSavedPurchaseOrders({ orders, items, suppliers }) {
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const itemsByOrderId = groupBy(items, "purchaseOrderId");

  return orders.map((order) => ({
    order: {
      id: order.id,
      storeId: order.storeId,
      orderNumber: order.orderNumber,
      supplierNameSnapshot: supplierById.get(order.supplierId)?.name ?? "未命名供应商",
      receivedDate: order.receivedDate,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      paymentAmount: order.paymentAmount,
      paymentStatus: order.paymentStatus,
      payableDelta: order.payableDelta,
      notes: order.notes
    },
    items: (itemsByOrderId.get(order.id) ?? []).map((item) => ({
      purchaseOrderNumber: order.orderNumber,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      specSnapshot: item.specSnapshot,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      lineTotal: item.lineTotal
    }))
  }));
}

function buildInventoryMovementRows({ movements, products, savedOrders, savedPurchases }) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const salesOrderNumberById = new Map(savedOrders.map((savedOrder) => [savedOrder.order.id, savedOrder.order.orderNumber]));
  const purchaseOrderNumberById = new Map(savedPurchases.map((savedPurchase) => [savedPurchase.order.id, savedPurchase.order.orderNumber]));

  return movements.map((movement) => {
    const product = productById.get(movement.productId);

    return {
      ...movement,
      productNameSnapshot: product?.name ?? "未知商品",
      specSnapshot: product?.spec ?? "",
      sourceOrderNumber: getSourceOrderNumber({
        movement,
        salesOrderNumberById,
        purchaseOrderNumberById
      })
    };
  });
}

function getSourceOrderNumber({ movement, salesOrderNumberById, purchaseOrderNumberById }) {
  if (movement.sourceTable === "sales_orders") {
    return salesOrderNumberById.get(movement.sourceId) ?? movement.sourceId;
  }

  if (movement.sourceTable === "purchase_orders") {
    return purchaseOrderNumberById.get(movement.sourceId) ?? movement.sourceId;
  }

  return movement.sourceId;
}

function groupBy(rows, key) {
  const grouped = new Map();

  for (const row of rows) {
    const value = row[key];
    const existing = grouped.get(value) ?? [];

    existing.push(row);
    grouped.set(value, existing);
  }

  return grouped;
}

function stateWithRows(table, rows, sources) {
  const hasError = sources.some((state) => state.source === "supabase_error" || state.source === "supabase_unavailable");
  const hasLoading = sources.some((state) => state.source === "loading");

  if (hasLoading) {
    return emptyState(table, "loading", "正在读取数据库。");
  }

  if (hasError) {
    return emptyState(table, "supabase_error", "数据库关联数据读取失败。");
  }

  if (rows.length === 0) {
    return emptyReadState(table, "暂无数据库记录。");
  }

  return {
    table,
    source: "supabase",
    rows,
    remoteRowCount: rows.length,
    notice: "当前显示数据库实时数据。"
  };
}

function unavailableReadState(table, notice) {
  return emptyState(table, "supabase_unavailable", notice);
}

function emptyReadState(table, notice) {
  return emptyState(table, "supabase_empty", notice);
}

function errorReadState(table, notice) {
  return emptyState(table, "supabase_error", notice);
}

function emptyState(table, source, notice) {
  return {
    table,
    source,
    rows: [],
    remoteRowCount: 0,
    notice
  };
}

function addOptionalIds(target, row) {
  if (row.id) {
    target.id = stringify(row.id);
  }

  if (row.store_id) {
    target.storeId = stringify(row.store_id);
  }
}

function stringify(value) {
  return value === undefined || value === null ? "" : String(value);
}

function toNumber(value) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 0;
}

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Supabase read timed out"));
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}
