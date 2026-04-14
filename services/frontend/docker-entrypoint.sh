#!/usr/bin/env sh
set -eu

# Runtime-config for the SPA. Served by nginx as /config.js and read by the app.
# This allows setting the API base URL via container environment variables.

: "${API_BASE_URL:=/api/v1}"

cat >/usr/share/nginx/html/config.js <<EOF
window.__ENV = window.__ENV || {};
window.__ENV.API_BASE_URL = "${API_BASE_URL}";
EOF

exec nginx -g "daemon off;"

