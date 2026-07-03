I will fix the broken production flows in one pass:

1. WhatsApp checkout reliability
- Remove the mandatory sign-in blocker from WhatsApp order/reserve messages so buyers can send messages immediately from mobile or desktop.
- Use a mobile-safe WhatsApp redirect (`api.whatsapp.com/send`) instead of relying on popup-style opening after async work.
- Keep saving the buyer inquiry before redirecting, with validation for name, phone, address, amount, and item status.
- Include the product photo link in the WhatsApp message text where possible.

2. Auction visibility and bidding
- Show live auctions reliably, and also show recently ended auctions instead of an empty page when auctions have just ended.
- Make listing detail pages link directly to the active auction for that item, not only to the general auctions page.
- Add stricter auction creation validation: valid starting bid, valid increment, future end time, required photo, and no duplicate live auction for the same listing.
- Improve bid validation and keep real-time bid refresh working.

3. Collections and listing visibility
- Make collection/browse/home listing queries consistent and faster so items do not randomly disappear.
- Batch image signing instead of signing every image one-by-one, reducing backend latency and page lag.
- Keep sold/reserved/auction status visible clearly while still allowing users to browse the full vault.

4. Admin fixes
- Ensure admin can upload photos, create listings, create auctions, and see all auctions/orders from the dashboard.
- Refresh the right data after creating auctions, uploading photos, ending auctions, or receiving inquiries.

5. Backend cleanup and performance
- Add database indexes for auction/listing/bid queries that are used by the public pages and admin dashboard.
- Clean up stale/duplicate auction read policies if needed without weakening security.
- Confirm the backend is healthy and verify the public pages and core flows after changes.