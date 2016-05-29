#!/usr/bin/env bash

BRANCH="release/v0.0.2"
npm install -g vsce
cd client && vsce publish --baseImagesUrl https://github.com/kexi/vscode-uiflow/blob/$BRANCH/client/
