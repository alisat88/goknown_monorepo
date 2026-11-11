#!/bin/sh
# Database provisioning is a separate, explicitly verified operator action.
set -eu
echo "Building backend; no migrations run during startup."
yarn build
exec yarn start
