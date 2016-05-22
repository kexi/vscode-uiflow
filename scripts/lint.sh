#!/usr/bin/env bash

CDIR=`pwd`
cd ${CDIR}/server && npm run lint --loglevel silent
cd ${CDIR}/client && npm run lint --loglevel silent