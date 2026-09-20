# App Manager UI Bypass — Install ServiceNow Store Apps via REST

Skips the App Manager UI's stuck "loading dependencies" step by calling its
underlying API directly.

## Steps

1. Get `app_id` and `version` from the App Manager URL:
   `/now/app-manager/home/app/id/<APP_ID>/v/<VERSION>`

2. Kick off install (GET, query params — not POST/body):
```bash
curl -s -u "<user>:<password>" -G \
  "https://<instance>.service-now.com/api/sn_appclient/appmanager/app/install" \
  --data-urlencode "app_id=<APP_ID>" \
  --data-urlencode "version=<VERSION>" \
  --data-urlencode "customization_version=none" \
  --data-urlencode "load_demo_data=false"
```
Returns a `trackerId`.

3. Poll status:
```bash
curl -s -u "<user>:<password>" \
  "https://<instance>.service-now.com/api/sn_cicd/progress/<trackerId>"
```
`status`: `0` Pending → `1` Running (watch `percent_complete`) → `2` Successful (or error).

## Gotchas
- Must be `GET`, not `POST` (POST → "Method not Supported").
- No body — everything is query string.
- `customization_version=none` for a plain install/upgrade.
- Response also returns `rollback_version` in case it fails.
