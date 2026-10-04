#!/usr/bin/env bash
source "$(dirname "$0")/common.sh"
k get deployment,statefulset,pod,service,pvc,job
k get events --sort-by=.lastTimestamp
