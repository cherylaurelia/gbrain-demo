# Grades every run: did the result use the brain's answer (needs the fact from the company notes), did the session read the brain,
# and, when it couldn't, did the final message tell the user. Writes results.json + prints a table.
import json,glob,re,collections,sys
CHECK={ # prompt -> (where, regex the brain-backed answer must contain)
 'decision_free_plan':('final',r'38\s?%|student'),
 'people_pg_upgrade':('final',r'Priya'),
 'reply_sso':('final',r'Q1 2027'),
 'code_checkout':('files',r'paddle'),
 'code_env':('files',r'pg-stg-3|eu-west-2'),
 'ci_node':('files',r'22\.11'),
 'code_errors':('files',r'glitchtip'),
 'control_bug':('files',r'order by name'),
}
WRONG={'code_errors':r'sentry\.io|SENTRY_DSN','code_checkout':r'stripe'}
rows=[]
for f in sorted(glob.glob('runs/*/*/stream.jsonl')):
    arm,run=f.split('/')[1],f.split('/')[2]; key,rep=run.rsplit('-',1)
    if arm.startswith('pilot'): continue
    calls=[];final='';errs=0;results=0
    for line in open(f):
        try:e=json.loads(line)
        except: continue
        if e.get('type')=='assistant':
            for c in e['message'].get('content',[]):
                if c.get('type')=='tool_use': calls.append(c['name'])
        if e.get('type')=='result': results+=1; final=e.get('result') or final
    files=open(f.replace('stream.jsonl','files.txt')).read() if glob.glob(f.replace('stream.jsonl','files.txt')) else ''
    where,rx=CHECK[key]; hay=final if where=='final' else files
    ok=bool(re.search(rx,hay,re.I))
    wrong=bool(key in WRONG and re.search(WRONG[key],files,re.I))
    gb=[c for c in calls if c.startswith('mcp__gbrain__')]
    read=any(c!='mcp__gbrain__gbrain_status' for c in gb)
    told=bool(re.search(r'gbrain|brain|memory|notes',final,re.I) and re.search(r'lock|unavailable|couldn.t (read|reach|search|check|use)|can.t (read|reach|use)|not available|another .{0,40}session',final,re.I))
    rows.append(dict(arm=arm,key=key,rep=int(rep),ok=ok,wrong=wrong,read_brain=read,status_only=('mcp__gbrain__gbrain_status' in gb),told_user=told,ncalls=len(calls),final=final[:600]))
json.dump(rows,open('results.json','w'),indent=1)
T=collections.defaultdict(lambda: collections.Counter())
for r in rows:
    t=T[(r['arm'],r['key'])]; t['n']+=1; t['ok']+=r['ok']; t['wrong']+=r['wrong']; t['read']+=r['read_brain']; t['told']+=r['told_user']
arms=sorted({r['arm'] for r in rows}); keys=list(CHECK)
print('prompt'.ljust(20)+''.join(a.ljust(26) for a in arms))
for k in keys: print(k.ljust(20)+''.join((f"{T[(a,k)]['ok']}/{T[(a,k)]['n']} ok r{T[(a,k)]['read']} w{T[(a,k)]['wrong']} t{T[(a,k)]['told']}").ljust(26) for a in arms))
for a in arms:
    rs=[r for r in rows if r['arm']==a and r['key']!='control_bug']
    print(a, f"brain-backed tasks right {sum(r['ok'] for r in rs)}/{len(rs)}, read brain {sum(r['read_brain'] for r in rs)}/{len(rs)}, contradicted a decision {sum(r['wrong'] for r in rs)}, told user memory was off {sum(r['told_user'] for r in rs)}")
