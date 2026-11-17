# The "other agent session": spawns `gbrain serve` like Claude Code does, sends the MCP handshake and one recall
# (a session's first brain-first lookup), then keeps the session open until it receives SIGTERM.
import subprocess,sys,json,signal,time,os
gb,log=sys.argv[1],sys.argv[2]
p=subprocess.Popen([gb,'serve','--surface','starter','--advertise','verbs'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=open(log,'a'),cwd='/tmp',text=True)
def send(m): p.stdin.write(json.dumps(m)+'\n'); p.stdin.flush()
send({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"other-session","version":"1"}}})
send({"jsonrpc":"2.0","method":"notifications/initialized"})
send({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"recall","arguments":{"query":"Paddle"}}})
got=0
while got<2:
    line=p.stdout.readline()
    if not line: break
    if '"id":' in line: got+=1
open(log,'a').write(f"holder: serve pid {p.pid}, answered {got}/2\n")
print('ready',flush=True)
signal.signal(signal.SIGTERM,lambda *a:(p.stdin.close(),p.wait(timeout=20),sys.exit(0)))
while p.poll() is None: time.sleep(1)
open(log,'a').write(f"holder: serve exited early rc={p.returncode}\n")
