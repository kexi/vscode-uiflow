#!/usr/bin/env bash

BRANCH="release-v0.0.1"
npm install -g vsce
cd client && vsce package --baseImagesUrl https://github.com/kexi/vscode-uiflow/blob/$BRANCH/client/
