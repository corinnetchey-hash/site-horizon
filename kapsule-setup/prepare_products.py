#!/usr/bin/env python3
"""Builds a Shopify product-import CSV that gives the catalogue the data the Kapsule theme reads.

The theme relies on three product fields:
  * Vendor → the Korean house (brand pill, "Marques" filter, "La maison" portrait, same-house bundle)
  * Type   → the six Boutique categories ("Catégories" filter)
  * Tags   → skin concerns, prefixed `besoin-` ("Besoins" filter, concern tiles, diagnostic)

Usage:
  python3 prepare_products.py products_export.csv > products_import.csv
  python3 prepare_products.py products_export.csv --clean-titles > products_import.csv

Import the result in Shopify admin › Products › Import with
"Overwrite products with matching handles" ticked. Only the 33 products listed in
product-mapping.csv are written; drafts, zero-price rows and test products are left untouched.

--clean-titles also replaces titles such as "Nettoyant Mousse - Urang" with "Nettoyant Mousse",
since the house is now shown separately. Handles (and therefore URLs) do not change.
"""
import csv
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    clean_titles = '--clean-titles' in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)

    with open(os.path.join(HERE, 'product-mapping.csv'), newline='', encoding='utf-8') as f:
        mapping = {row['Handle']: row for row in csv.DictReader(f)}

    with open(args[0], newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames
        rows = [row for row in reader if row['Handle'] in mapping]

    writer = csv.DictWriter(sys.stdout, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    for row in rows:
        if row['Title']:
            target = mapping[row['Handle']]
            row['Vendor'] = target['Vendor']
            row['Type'] = target['Type']
            existing = [t.strip() for t in row['Tags'].split(',') if t.strip() and not t.strip().startswith('besoin-')]
            row['Tags'] = ', '.join(existing + [t.strip() for t in target['Concern tags'].split(',') if t.strip()])
            if clean_titles:
                row['Title'] = target['Title (FR)']
        writer.writerow(row)

    missing = set(mapping) - {row['Handle'] for row in rows}
    if missing:
        print('Not found in the export: ' + ', '.join(sorted(missing)), file=sys.stderr)


if __name__ == '__main__':
    main()
