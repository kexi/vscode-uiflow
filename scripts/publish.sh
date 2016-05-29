#!/usr/bin/env bash

BRANCH="release/v0.0.3"
npm install -g vsce
cd client && vsce publish --baseImagesUrl https://raw.githubusercontent.com/kexi/vscode-uiflow/release/$BRANCH/client/
