#!/bin/bash
# 自动寻找系统里的 Node 环境并启动 Crystal Studio
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

# 获取脚本所在目录，防止因双击引起的路径错误
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/crystal-studio"

echo "========================================================"
echo " 💎 正在启动 Crystal Studio (KIP Protocol Workbench)    "
echo "========================================================"
echo "🌐 专属端口: http://localhost:5773 运行，即将自动打开浏览器..."

# 启动并通过 --open 参数自动在浏览器唤起
npm run dev -- --open
