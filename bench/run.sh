#!/bin/bash
# usage: run.sh <arm> <prompt_key> <rep>
#  solo   : default `gbrain setup claude-code` wiring (stdio MCP + hooks + brain-first block), own brain copy, no other session open
#  second : same wiring and brain copy, but another `gbrain serve` (a second agent session) already has the brain open
#  shared : gbrain's own lock_recovery fix: one `gbrain serve --http` + `gbrain bootstrap harness`; sessions share it
#  none   : no gbrain at all
set -u
B=~/job-scout/projects/gbrain/bench; H2=~/scratch/gbbench-home; GB=~/scratch/gbhome/.bun/bin/gbrain
arm=$1; key=$2; rep=$3
out=$B/runs/$arm/$key-$rep; [ -f $out/stream.jsonl ] && exit 0
mkdir -p $out; d=/tmp/gbb/$arm-$key-$rep; rm -rf $d; mkdir -p /tmp/gbb; cp -R $B/app $d
prompt=$(python3 -c "import json,sys;print(json.load(open('$B/prompts.json'))[sys.argv[1]])" $key)
args=(--setting-sources project --model sonnet --output-format stream-json --verbose --dangerously-skip-permissions --max-turns 30)
GH=$H2; holder=
fresh_brain() { GH=/tmp/gbb/home-$arm-$key-$rep; rm -rf $GH; mkdir -p $GH; cp -R $H2/.gbrain $GH/.gbrain
  python3 - "$GH" <<'P'
import json,sys; p=sys.argv[1]+'/.gbrain/config.json'; c=json.load(open(p)); c['database_path']=sys.argv[1]+'/.gbrain/brain.pglite'; json.dump(c,open(p,'w'),indent=2)
P
}
case $arm in
  solo|second) fresh_brain; cp $B/brain-first-block.md $d/CLAUDE.md
    args+=(--settings $B/hooks-settings.json --strict-mcp-config --mcp-config $B/mcp.json)
    if [ $arm = second ]; then
      GBRAIN_HOME=$GH python3 $B/holder.py $GB $out/holder.log > $out/holder.ready & holder=$!
      for i in $(seq 1 180); do grep -q ready $out/holder.ready 2>/dev/null && break; sleep 0.5; done
    fi;;
  shared) cp $B/brain-first-block-http.md $d/CLAUDE.md
    args+=(--settings $B/hooks-settings.json --strict-mcp-config --mcp-config $B/mcp-shared.json);;
  none) args+=(--strict-mcp-config --mcp-config '{"mcpServers":{}}');;
esac
cd $d && GBRAIN_HOME=$GH timeout 600 claude -p "$prompt" "${args[@]}" < /dev/null > $out/stream.jsonl 2> $out/stderr.txt
echo $? > $out/exit.txt
[ -n "$holder" ] && { grep -q "exited early" $out/holder.log && echo HOLDER_DIED >> $out/holder.log; kill $holder 2>/dev/null; wait $holder 2>/dev/null; }
(cd $d; for f in $(find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -name CLAUDE.md -newer $B/prompts.json); do echo "=== $f"; cat $f; done > $out/files.txt)
[ "$GH" != "$H2" ] && rm -rf $GH
exit 0
