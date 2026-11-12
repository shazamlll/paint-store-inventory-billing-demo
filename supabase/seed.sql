insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Interior Wall Paint', 'White 1 gal', 'can', 18.00, 29.00, 24, 6);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Interior Wall Paint', 'White 5 gal', 'bucket', 74.00, 118.00, 10, 3);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Exterior Paint', 'Semi-gloss 1 gal', 'can', 22.00, 36.00, 16, 4);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Exterior Paint', 'Semi-gloss 5 gal', 'bucket', 92.00, 148.00, 8, 2);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Primer', 'Multi-surface 1 gal', 'can', 14.50, 24.00, 20, 5);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Primer', 'Multi-surface 5 gal', 'bucket', 56.00, 89.00, 9, 2);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Wood Stain', 'Walnut 1 qt', 'can', 8.20, 15.00, 18, 4);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Clear Varnish', 'Gloss 1 qt', 'can', 9.50, 17.00, 15, 4);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Paint Thinner', '1 gal', 'can', 7.80, 13.00, 30, 8);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Colorant Red', 'Universal 16 oz', 'bottle', 6.40, 11.00, 12, 3);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Colorant Blue', 'Universal 16 oz', 'bottle', 6.40, 11.00, 12, 3);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Colorant Yellow', 'Universal 16 oz', 'bottle', 6.40, 11.00, 12, 3);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Paint Roller', '9 inch', 'piece', 3.20, 7.50, 40, 10);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Roller Cover', '9 inch microfiber', 'piece', 2.10, 5.00, 48, 12);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Paint Brush', '2 inch angled', 'piece', 2.80, 6.50, 36, 10);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Paint Tray', 'Plastic standard', 'piece', 1.90, 4.50, 25, 6);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Masking Tape', '1.5 inch', 'roll', 1.40, 3.50, 60, 15);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Drop Cloth', '9 x 12 ft', 'piece', 4.80, 9.50, 22, 5);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Sandpaper Pack', 'Assorted grit', 'pack', 2.50, 5.50, 34, 8);
insert into public.products (name, spec, unit, cost_price, sale_price, current_stock, low_stock_threshold) values
('Caulk', 'Paintable white', 'tube', 2.20, 4.80, 28, 7);

insert into public.customers (name, phone, notes, receivable_balance) values
('Regular Contractor A', '555-0101', 'Frequent credit customer', 0);
insert into public.customers (name, phone, notes, receivable_balance) values
('Neighborhood Homeowner', '555-0102', 'Usually pays cash', 0);
insert into public.customers (name, phone, notes, receivable_balance) values
('Property Manager North', '555-0103', 'Monthly maintenance jobs', 0);
insert into public.customers (name, phone, notes, receivable_balance) values
('Cabinet Workshop', '555-0104', 'Buys stain and varnish', 0);
insert into public.customers (name, phone, notes, receivable_balance) values
('Walk-in Customer', '', 'Default quick-sale customer', 0);

insert into public.suppliers (name, phone, notes, payable_balance) values
('Regional Paint Supply', '555-0201', 'Primary paint and primer supplier', 0);
insert into public.suppliers (name, phone, notes, payable_balance) values
('Tool Distributor', '555-0202', 'Brushes, rollers, trays, tape', 0);
insert into public.suppliers (name, phone, notes, payable_balance) values
('Chemical Wholesaler', '555-0203', 'Thinner, colorants, caulk', 0);
