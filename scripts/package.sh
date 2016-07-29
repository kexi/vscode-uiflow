#!/usr/bin/env bash

BRANCH="release/v0.0.11"
npm install -g vsce
vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
