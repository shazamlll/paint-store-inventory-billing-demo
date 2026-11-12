import {
  sampleCustomers,
  sampleProducts,
  sampleSuppliers
} from "./sample-data.js";

export const seedProducts = sampleProducts.map(
  ({ name, spec, unit, costPrice, salePrice, currentStock, lowStockThreshold }) => ({
    name,
    spec,
    unit,
    costPrice,
    salePrice,
    currentStock,
    lowStockThreshold
  })
);

export const seedCustomers = sampleCustomers.map(({ name, phone, notes, receivableBalance }) => ({
  name,
  phone,
  notes,
  receivableBalance
}));

export const seedSuppliers = sampleSuppliers.map(({ name, phone, notes, payableBalance }) => ({
  name,
  phone,
  notes,
  payableBalance
}));
