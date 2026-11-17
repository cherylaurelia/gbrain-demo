#!/bin/bash
# Follows gbrain_status's share_http_plan literally on a fresh keyless install (the README's self-host path).
set -u
B=<bench>/bench; GB=${GB:-~/scratch/gbhome/.bun/bin/gbrain}; H=~/scratch/gbrepro-home; rm -rf $H; mkdir -p $H; cd /tmp
export HOME=$H GBRAIN_HOME=$H PATH=$(dirname $GB):$PATH
step(){ echo; echo "\$ $*"; "$@"; echo "[exit $?]"; }
gbrain --version
gbrain init --pglite --no-embedding > $H/init.log 2>&1; echo "init exit $?"
gbrain setup claude-code --yes >/dev/null 2>&1; echo "setup claude-code exit $?"
echo "== session 1 opens the brain"
python3 $B/holder.py $GB $H/holder.log > $H/ready & HOLDER=$!
for i in $(seq 1 120); do grep -q ready $H/ready 2>/dev/null && break; sleep 0.5; done
echo "== session 2 starts and calls gbrain_status"
python3 - "$GB" > $H/status.json <<'P'
import subprocess,json,sys
p=subprocess.Popen([sys.argv[1],'serve','--surface','starter','--advertise','verbs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,cwd='/tmp')
w=lambda m:(p.stdin.write(json.dumps(m)+'\n'),p.stdin.flush())
w({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"session-2","version":"1"}}})
w({"jsonrpc":"2.0","method":"notifications/initialized"})
w({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"gbrain_status","arguments":{}}})
while True:
    l=p.stdout.readline()
    if '"id":2' in l: print(json.loads(l)['result']['content'][0]['text']); break
p.stdin.close()
P
python3 -c "
import json;s=json.load(open('$H/status.json'));print('reason:',s['reason']);print('user_message:',s['user_message'])
a=s['share_http_plan'];i=1
while a: print(f'plan step {i}:',a['command']);a=a.get('then');i+=1"
echo "== follow share_http_plan"
kill $HOLDER; wait $HOLDER 2>/dev/null; sleep 2; echo "step 1 done (owner session closed)"
(nohup gbrain serve --http > $H/http.log 2>&1 &); for i in $(seq 1 60); do curl -s -m 2 http://127.0.0.1:3131/health >/dev/null && break; sleep 1; done; echo "step 2: gbrain serve --http up: $(curl -s -m 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:3131/health)"
step gbrain bootstrap harness --harness all --yes 2>&1 | grep -v '^  3\.' | cut -c1-400
echo; echo "harness MCP entry after the plan:"; python3 -c "import json;print(json.load(open('$H/.claude.json'))['mcpServers']['gbrain'].get('type'))"
kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; true

echo; echo "== the order bootstrap harness's own error prints (pre-mint, then --token)"
kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; sleep 3; echo "1. serve stopped"
gbrain auth create bootstrap-harness --scopes read,write,skills_member_self > $H/tok.txt 2>&1; echo "2. auth create [exit $?]"
TOK=$(grep -oE 'gbrain_[A-Za-z0-9_]+' $H/tok.txt | head -1)
OPS=$(gbrain bootstrap harness --harness all --yes 2>&1 | grep -oE 'operations [a-z_,]+' | head -1 | cut -d' ' -f2)
[ -z "$OPS" ] && { (nohup gbrain serve --http > $H/http0.log 2>&1 &); for i in $(seq 1 60); do curl -s -m 2 http://127.0.0.1:3131/health >/dev/null && break; sleep 1; done; OPS=$(gbrain bootstrap harness --harness all --yes 2>&1 | grep -oE 'operations [a-z_,]+' | head -1 | cut -d' ' -f2); kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; sleep 3; }
gbrain auth rescope --token bootstrap-harness --operations "$OPS" > /dev/null 2>&1; echo "3. auth rescope (${#OPS} chars of operations) [exit $?]"
(nohup gbrain serve --http > $H/http2.log 2>&1 &); for i in $(seq 1 60); do curl -s -m 2 http://127.0.0.1:3131/health >/dev/null && break; sleep 1; done; echo "4. gbrain serve --http up"
gbrain bootstrap harness --harness all --yes --token "$TOK" > $H/boot2.txt 2>&1; echo "5. bootstrap harness --token [exit $?]"
grep -E "^MCP registered|^FAILED|^smoke test" $H/boot2.txt | cut -c1-200
echo "harness MCP entry now:"; python3 -c "import json;print(json.load(open('$H/.claude.json'))['mcpServers']['gbrain'].get('type'))"
kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; true
