#!/bin/sh
# logs which brain each session's gbrain MCP server opens, then runs the exact command `gbrain setup` wrote
echo "$(date +%T) pid $$ GBRAIN_HOME=${GBRAIN_HOME:-unset} cwd=$PWD" >> /tmp/gbb/mcp-wrap.log
exec "$@"
