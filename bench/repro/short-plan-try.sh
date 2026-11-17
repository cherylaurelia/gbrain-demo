#!/bin/bash
# Candidate PGLite plan without the rescope: pre-mint a plain read,write token, serve, wire with --token --no-hooks --skills memory-only.
set -u
B=<bench>/bench; GB=${GB:-~/scratch/gbm-bin/gbrain}; H=~/scratch/gbshort-home; rm -rf $H; mkdir -p $H; cd /tmp
export HOME=$H GBRAIN_HOME=$H PATH=$(dirname $GB):$PATH
gbrain --version
gbrain init --pglite --no-embedding > /dev/null 2>&1; echo "init [exit $?]"
cp -R $B/company $H/company; gbrain sources add company --path $H/company --federated --force > /dev/null 2>&1; gbrain sync --all > /dev/null 2>&1; echo "company notes synced [exit $?]"
gbrain setup claude-code --yes > /dev/null 2>&1; echo "setup claude-code [exit $?]"
python3 $B/holder.py $GB $H/holder.log > $H/ready & HOLDER=$!
for i in $(seq 1 120); do grep -q ready $H/ready 2>/dev/null && break; sleep 0.5; done; echo "session 1 holds the brain"
kill $HOLDER; wait $HOLDER 2>/dev/null; sleep 2; echo "1. session 1's serve stopped"
gbrain auth create bootstrap-harness --scopes ${SCOPES:-read,write} > $H/tok.txt 2>&1; echo "2. auth create [exit $?]"; TOK=$(grep -oE 'gbrain_[A-Za-z0-9_]+' $H/tok.txt | head -1)
(nohup gbrain serve --http > $H/http.log 2>&1 &); for i in $(seq 1 60); do curl -s -m 2 http://127.0.0.1:3131/health >/dev/null && break; sleep 1; done; echo "3. serve --http up"
gbrain bootstrap harness --harness all --yes --token "$TOK" ${EXTRA:---no-hooks --skills memory-only} > $H/boot.txt 2>&1; echo "4. bootstrap harness --token [exit $?]"
grep -E "^MCP registered|^FAILED|^smoke|pending|^error|Error" $H/boot.txt | cut -c1-220
python3 -c "import json;print('harness MCP entry:',json.load(open('$H/.claude.json'))['mcpServers']['gbrain'].get('type'))"
[ -n "${KEEP:-}" ] || kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; true
