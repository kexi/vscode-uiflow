#!/usr/bin/env bash

CDIR=`pwd`
cd ${CDIR}/server && npm run compile 
cd ${CDIR}/client && npm run compile