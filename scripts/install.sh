#!/usr/bin/env bash

CDIR=`pwd`
cd ${CDIR}/server && npm install
cd ${CDIR}/client && npm install && npm run vscode:prepublish
