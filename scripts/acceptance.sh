#!/bin/bash
set -e

current_directory="$PWD"

cd $(dirname $0)/..

yarn lint

yarn test --coverage

result=$?

cd "$current_directory"

exit $result
