#!/usr/bin/env bash

TAG="v0.4.1"
npm install -g vsce
vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$TAG/
