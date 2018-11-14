#!/usr/bin/env bash

TAG="v0.7.0"
npm install -g vsce
vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$TAG/
