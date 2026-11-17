#!/bin/bash
# Follows the PATCHED gbrain_status share_http_plan literally (fix/pglite-share-plan), substituting the printed token.
set -u
B=<bench>/bench; GB=~/scratch/gbm-bin/gbrain; [ -n "$(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN)" ] && { echo "port 3131 busy"; exit 1; }; H=~/scratch/gbpatched-home; rm -rf $H; mkdir -p $H; cd /tmp
export HOME=$H GBRAIN_HOME=$H PATH=$(dirname $GB):$PATH
echo "gbrain $(gbrain --version) on $(git -C ~/scratch/gbrain log -1 --format=%h) + patch"
gbrain init --pglite --no-embedding > /dev/null 2>&1; echo "init [exit $?]"
gbrain setup claude-code --yes > /dev/null 2>&1; echo "setup claude-code [exit $?]"
python3 $B/holder.py $GB $H/holder.log > $H/ready & HOLDER=$!
for i in $(seq 1 120); do grep -q ready $H/ready 2>/dev/null && break; sleep 0.5; done
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
import json;a=json.load(open('$H/status.json'))['share_http_plan']
while a: print(json.dumps(a['argv']));a=a.get('then')" > $H/plan.txt
echo "== share_http_plan from gbrain_status:"; cat $H/plan.txt
TOK=; n=0
while read -r line; do n=$((n+1))
  argv=$(python3 -c "import json,sys,shlex;print(shlex.join(json.loads(sys.argv[1])))" "$line")
  case $argv in
    kill*) kill $HOLDER; wait $HOLDER 2>/dev/null; sleep 2; echo "$n. $argv [done: session 1 closed]";;
    "gbrain serve --http") (nohup gbrain serve --http > $H/http.log 2>&1 &); for i in $(seq 1 60); do curl -s -m 2 http://127.0.0.1:3131/health >/dev/null && break; sleep 1; done; echo "$n. $argv [health $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3131/health)]";;
    *) argv=${argv//"'<token printed by gbrain auth create>'"/$TOK}; eval "$argv" > $H/step$n.txt 2>&1; rc=$?
       [ -z "$TOK" ] && TOK=$(grep -oE 'gbrain_[A-Za-z0-9_]+' $H/step$n.txt | head -1)
       echo "$n. ${argv//$TOK/<token>} [exit $rc]"; grep -E "^MCP registered|^FAILED|^smoke test" $H/step$n.txt | cut -c1-160;;
  esac
done < $H/plan.txt
python3 -c "import json;print('harness MCP entry:',json.load(open('$H/.claude.json'))['mcpServers']['gbrain'].get('type'))"
kill $(/usr/sbin/lsof -tiTCP:3131 -sTCP:LISTEN) 2>/dev/null; true
