const productFields = [
  "name",
  "spec",
  "unit",
  "costPrice",
  "salePrice",
  "currentStock",
  "lowStockThreshold"
];

export function createProductDraft(product = {}) {
  return {
    name: stringify(product.name),
    spec: stringify(product.spec),
    unit: stringify(product.unit),
    costPrice: stringify(product.costPrice),
    salePrice: stringify(product.salePrice),
    currentStock: stringify(product.currentStock),
    lowStockThreshold: stringify(product.lowStockThreshold)
  };
}

export function validateProductDraft(draft) {
  const errors = {};

  if (!draft.name?.trim()) {
    errors.name = "商品名称不能为空。";
  }

  if (!draft.spec?.trim()) {
    errors.spec = "规格不能为空。";
  }

  if (!draft.unit?.trim()) {
    errors.unit = "单位不能为空。";
  }

  validateNumber(errors, draft, "costPrice", "成本价", { allowZero: true });
  validateNumber(errors, draft, "salePrice", "销售价", { allowZero: false });
  validateNumber(errors, draft, "currentStock", "当前库存", { allowZero: true });
  validateNumber(errors, draft, "lowStockThreshold", "低库存阈值", { allowZero: true });

  return errors;
}

export function normalizeProductDraft(draft) {
  return {
    name: draft.name.trim(),
    spec: draft.spec.trim(),
    unit: draft.unit.trim(),
    costPrice: Number(draft.costPrice),
    salePrice: Number(draft.salePrice),
    currentStock: Number(draft.currentStock),
    lowStockThreshold: Number(draft.lowStockThreshold)
  };
}

export function appendProduct(products, product) {
  return [...products, { ...product }];
}

export function updateProductAt(products, index, product) {
  return products.map((productItem, productIndex) =>
    productIndex === index ? { ...product } : productItem
  );
}

export function updateDraftField(draft, field, value) {
  if (!productFields.includes(field)) {
    return draft;
  }

  return {
    ...draft,
    [field]: value
  };
}

function stringify(value) {
  return value === undefined || value === null ? "" : String(value);
}

function validateNumber(errors, draft, field, label, { allowZero }) {
  const value = Number(draft[field]);

  if (draft[field] === "" || Number.isNaN(value)) {
    errors[field] = `${label}必须是数字。`;
    return;
  }

  if (allowZero && value < 0) {
    errors[field] = `${label}不能小于 0。`;
  }

  if (!allowZero && value <= 0) {
    errors[field] = `${label}必须大于 0。`;
  }
}
