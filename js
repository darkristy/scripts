#!/usr/bin/zsh

/usr/bin/env NODE_PATH=/home/darkristy/.scripts/node_modules ESM_OPTIONS='{mode:"all",cache:0}' node -r esm -r globals "$@"