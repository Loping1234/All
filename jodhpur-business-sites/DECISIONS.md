# Decisions Log

## D001 — Use Geoapify instead of Google Places
- **Reason**: Free tier, no credit card required, easy endpoints.
- **Tradeoff**: Lower local-business coverage than Google Maps.

## D002 — No scraping
- **Reason**: Avoid legal/ToS risks associated with scraping platforms like Google Maps, Justdial, Zomato, etc.
- **Tradeoff**: Fewer overall leads, reliant purely on Geoapify.

## D003 — RAW Response Auditing
- **Reason**: Store raw JSON responses under `data/raw/` to ensure a reproducible audit trail and prevent fabrication of data.
- **Tradeoff**: Slightly more disk storage used for raw JSON files.
