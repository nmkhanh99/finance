#!/bin/sh
# Cron cho container: gọi định kỳ các endpoint của service web.
# Nếu auth bật, đặt CRON_SECRET để vượt qua middleware (?key=...).
set -eu

BASE="http://web:3000/api"
KEY="${CRON_SECRET:-}"
Q=""
[ -n "$KEY" ] && Q="?key=$KEY"

mkdir -p /etc/crontabs
cat > /etc/crontabs/root <<EOF
# Cập nhật giá (crypto + CK VN) mỗi 15 phút
*/15 * * * * curl -fsS "$BASE/prices/refresh$Q" >/dev/null 2>&1
# Sinh giao dịch định kỳ — 00:05 hằng ngày
5 0 * * * curl -fsS "$BASE/recurring/run$Q" >/dev/null 2>&1
# Snapshot Net Worth — 23:30 hằng ngày
30 23 * * * curl -fsS "$BASE/networth/snapshot$Q" >/dev/null 2>&1
# Cập nhật tỷ giá — 06:00 hằng ngày
0 6 * * * curl -fsS "$BASE/rates/refresh$Q" >/dev/null 2>&1
# Gửi email nhắc nhở nợ/mục tiêu đến hạn — 07:00 hằng ngày
0 7 * * * curl -fsS "$BASE/reminders/email$Q" >/dev/null 2>&1
EOF

echo "[cron] đã cài crontab:"
cat /etc/crontabs/root
exec crond -f -l 8
