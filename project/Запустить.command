#!/bin/zsh
cd "${0:A:h}" || exit 1
# Use an existing Node installation; do not install or modify system settings.
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin(N/); do
    export PATH="$candidate:$PATH"
  done
fi
if ! command -v npm >/dev/null 2>&1; then
  print 'Нужен установленный Node.js 20.19 или новее.'
  read '?Нажмите Enter для выхода.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || exit 1
fi
print 'Планировщик: http://127.0.0.1:5173/'
print 'Для остановки нажмите Ctrl+C.'
npm run dev
