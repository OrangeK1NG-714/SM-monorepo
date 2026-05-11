#!/bin/bash
# SM-DoubleAssistant 宝塔面板部署脚本
# 使用方式: 在服务器项目根目录执行 bash deploy/deploy.sh

set -e

echo "=== 1. 安装依赖 ==="
pnpm install --frozen-lockfile

echo "=== 2. 构建 Admin 管理后台 ==="
pnpm build:admin

echo "=== 3. 重启 Egg.js 后端 ==="
pnpm stop:server 2>/dev/null || true
pnpm start:server

echo "=== 部署完成 ==="
echo "Admin:  已构建到 apps/admin/dist/"
echo "Server: Egg.js 已启动在端口 7001"
echo ""
echo "请确保宝塔面板中已配置:"
echo "  1. Nginx 反向代理 /api -> http://127.0.0.1:7001"
echo "  2. 网站根目录指向 apps/admin/dist/"
echo "  3. MongoDB 服务已启动"
