#!/usr/bin/env bash

BRANCH="release/v0.1.0"
vsce publish --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
