#!/bin/sh
# The former repair path truncated migration history and ran migrations as the app.
echo "Disabled: automatic database repair can destroy migration provenance." >&2
echo "Use the reviewed release runbook; never truncate the migrations table." >&2
exit 1
