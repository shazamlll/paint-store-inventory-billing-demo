# Day 046 Sales Print Template

## Objective

Create the first printable white-paper sales bill template for the OKI MICROLINE 5200F workflow.

## Completed

- Replaced the browser-print card with a blank paper sales form layout.
- Set the print paper contract to `241mm x 140mm`.
- Drew customer, order, item, total, notice, and signature areas in the page.
- Kept Missing contact, address, and landline fields blank when current data has no value.
- Added Chinese uppercase total amount output for the printed total row.

## Boundary

This sprint does not change database schema, import templates, sales persistence, printer driver settings, PDF export, or multi-copy output.

The OKI MICROLINE 5200F driver still needs a matching custom form, and real paper output should be used for offset tuning.
