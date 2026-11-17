import json,sys,glob,os
# per run: tool calls in order, whether gbrain called, which call index, final text
for f in sorted(glob.glob(f'runs/{sys.argv[1]}/*/stream.jsonl')):
    calls=[];final='';hookctx=False
    for line in open(f):
        try: e=json.loads(line)
        except: continue
        if e.get('type')=='assistant':
            for c in e['message'].get('content',[]):
                if c.get('type')=='tool_use':
                    n=c['name']; i=c.get('input',{})
                    calls.append(n.replace('mcp__gbrain__','gb:')+('('+json.dumps(i)[:80]+')' if n.startswith('mcp__gbrain') else ''))
        if e.get('type')=='result': final=e.get('result') or final
        if e.get('type')=='system' and 'hook' in json.dumps(e).lower() and 'GBrain' in json.dumps(e): hookctx=True
    gb=[k for k,c in enumerate(calls) if c.startswith('gb:')]
    print(f"== {f.split('/')[2]}  calls={len(calls)} first_gb={gb[0] if gb else None}")
    print('  ', ' | '.join(calls)[:600])
    print('  FINAL:', final.replace('\n',' ')[:400])
