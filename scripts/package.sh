#!/usr/bin/env bash

BRANCH="release/v0.0.5"
npm install -g vsce
cd client && vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
