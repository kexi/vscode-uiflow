#!/usr/bin/env bash

BRANCH="release/v0.0.8"
vsce publish --baseImagesUrl https://github.com/kexi/vscode-uiflow/raw/$BRANCH/
