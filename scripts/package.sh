#!/usr/bin/env bash

BRANCH="release/v0.0.6"
npm install -g vsce
cd client && vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
