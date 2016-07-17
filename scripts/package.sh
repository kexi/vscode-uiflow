#!/usr/bin/env bash

BRANCH="release/v0.0.10"
npm install -g vsce
vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
