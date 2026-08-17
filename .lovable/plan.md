# Security Hardening Plan

This plan addresses 74 security warnings from the database linter and strengthens frontend XSS/Storage protections.

## User-facing changes
- Improved security for administrative functions (blocking unauthorized access).
- Hardened data processing to prevent malicious scripts from executing.
- No changes to existing functionality, only backend strengthening.

## Technical Details

### Database (Supabase)
- **Fix search_path**: Ensure all `SECURITY DEFINER` functions have an explicit `SET search_path = public` (or relevant schemas like `pgmq`) to prevent search path hijacking.
- **Restrict EXECUTE permissions**: Revoke `EXECUTE` on sensitive administrative `SECURITY DEFINER` functions from `PUBLIC`, `anon`, and `authenticated` roles, granting access only to `service_role` or specific authorized roles.
- **Audit existing functions**: Targeted migration to fix the specific functions flagged by the linter:
    - `trg_update_products_stats` (missing search_path)
    - `retry_pending_emails`, `email_queue_dispatch`, `enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`, `email_queue_wake`, `purge_email_dlq`, `retry_email_dlq`, `purge_email_queue` (ensuring robust search_path and permissions).
- **Consolidate Grants**: Ensure all tables have explicit grants for `authenticated` and `service_role`.

### Frontend
- **Harden AdSense**: Wrap AdSense snippet injection in a check to ensure it only renders valid, expected scripts from the database.
- **XSS Prevention**: Audit all `dangerouslySetInnerHTML` usage. Verified that `HtmlContent` and `PostContent` use `isomorphic-dompurify`.
- **LocalStorage**: Verified that sensitive tokens are NOT stored in plain `localStorage` by custom code (Supabase managed auth is handled by the client library).

## Order of operations
1. Create a consolidation migration to fix all `search_path` and `EXECUTE` issues.
2. Update `@security-memory` with the justifications for necessary `SECURITY DEFINER` usage.
3. Verify the fixes by re-running the linter.
