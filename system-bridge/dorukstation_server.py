#!/usr/bin/env python3
import json, os, re, shutil, subprocess, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
HOST = os.environ.get('DORUKSTATION_HOST', '127.0.0.1')
PORT = int(os.environ.get('DORUKSTATION_PORT', '8765'))
API = '/__dorukstation/api/'


def run(args, timeout=20):
    try:
        cp = subprocess.run(args, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            text=True, timeout=timeout, check=False)
        return cp.returncode, cp.stdout.strip(), cp.stderr.strip()
    except FileNotFoundError:
        return 127, '', f'{args[0]} not installed'
    except subprocess.TimeoutExpired:
        return 124, '', 'command timed out'


def split_nmcli(line):
    out, cur, esc = [], [], False
    for ch in line:
        if esc:
            cur.append(ch); esc = False
        elif ch == '\\':
            esc = True
        elif ch == ':':
            out.append(''.join(cur)); cur = []
        else:
            cur.append(ch)
    out.append(''.join(cur))
    return out


def wifi_device():
    if not shutil.which('nmcli'):
        return None
    rc, out, _ = run(['nmcli','-t','-f','DEVICE,TYPE,STATE,CONNECTION','device','status'])
    if rc:
        return None
    for line in out.splitlines():
        parts = split_nmcli(line)
        if len(parts) >= 4 and parts[1] == 'wifi':
            return {'device':parts[0], 'state':parts[2], 'connection':parts[3] if parts[3] != '--' else ''}
    return None


def wifi_status():
    available = bool(shutil.which('nmcli'))
    if not available:
        return {'available':False,'powered':False,'connection':'','signal':0}
    rc, out, _ = run(['nmcli','radio','wifi'])
    powered = rc == 0 and out.strip().lower() == 'enabled'
    dev = wifi_device() or {}
    signal = 0
    if powered:
        rc2, out2, _ = run(['nmcli','-t','-f','IN-USE,SIGNAL','device','wifi','list'])
        if rc2 == 0:
            for line in out2.splitlines():
                parts = split_nmcli(line)
                if len(parts) >= 2 and parts[0] == '*':
                    try: signal = int(parts[1])
                    except: signal = 0
                    break
    return {'available':True,'powered':powered,'connection':dev.get('connection',''),'state':dev.get('state',''),'signal':signal,'device':dev.get('device','')}


def wifi_scan():
    if not shutil.which('nmcli'):
        raise RuntimeError('NetworkManager (nmcli) is not installed')
    rc, out, err = run(['nmcli','-t','-f','IN-USE,SSID,SIGNAL,SECURITY','device','wifi','list','--rescan','yes'], timeout=25)
    if rc: raise RuntimeError(err or out or 'Wi-Fi scan failed')
    nets=[]
    for line in out.splitlines():
        p=split_nmcli(line)
        if len(p) < 4: continue
        try: sig=int(p[2] or 0)
        except: sig=0
        nets.append({'active':p[0]=='*','ssid':p[1],'signal':sig,'security':p[3] or '--'})
    nets.sort(key=lambda x:(not x['active'],-x['signal'],x['ssid'].lower()))
    return nets


def valid_mac(mac):
    return bool(re.fullmatch(r'(?i)([0-9a-f]{2}:){5}[0-9a-f]{2}', mac or ''))


def bt_parse_devices(text, paired=False):
    devices=[]
    for line in text.splitlines():
        m=re.match(r'^Device\s+([0-9A-Fa-f:]{17})\s*(.*)$', line.strip())
        if not m: continue
        devices.append({'mac':m.group(1).upper(),'name':m.group(2).strip() or m.group(1).upper(),'paired':paired,'connected':False})
    return devices


def bt_info(mac):
    rc,out,_=run(['bluetoothctl','info',mac],timeout=8)
    return {'paired':'Paired: yes' in out,'connected':'Connected: yes' in out,'trusted':'Trusted: yes' in out}


def bluetooth_status():
    available=bool(shutil.which('bluetoothctl'))
    if not available:return {'available':False,'powered':False,'pairedCount':0}
    rc,out,_=run(['bluetoothctl','show'],timeout=8)
    powered=rc==0 and 'Powered: yes' in out
    rc2,out2,_=run(['bluetoothctl','paired-devices'],timeout=8)
    paired=bt_parse_devices(out2,True) if rc2==0 else []
    return {'available':True,'powered':powered,'pairedCount':len(paired)}


def bluetooth_devices(paired_only=False):
    if not shutil.which('bluetoothctl'):raise RuntimeError('bluetoothctl is not installed')
    cmd=['bluetoothctl','paired-devices'] if paired_only else ['bluetoothctl','devices']
    rc,out,err=run(cmd,timeout=8)
    if rc:raise RuntimeError(err or out or 'Bluetooth device listing failed')
    arr=bt_parse_devices(out,paired_only)
    for d in arr:
        d.update(bt_info(d['mac']))
    return arr


def system_status():
    return {'ok':True,'bridge':True,'platform':sys.platform,'wifi':wifi_status(),'bluetooth':bluetooth_status()}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):
        super().__init__(*a,directory=str(ROOT),**kw)

    def log_message(self, fmt, *args):
        sys.stderr.write('[DorukStation] '+fmt%args+'\n')

    def json_reply(self,obj,status=200):
        raw=json.dumps(obj,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(raw)))
        self.send_header('Cache-Control','no-store')
        self.end_headers();self.wfile.write(raw)

    def read_json(self):
        n=min(int(self.headers.get('Content-Length','0') or 0),65536)
        if not n:return {}
        try:return json.loads(self.rfile.read(n).decode('utf-8'))
        except:return {}

    def do_GET(self):
        if self.path.startswith(API):
            self.json_reply({'ok':False,'error':'Use POST for system API'},405);return
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith(API):
            self.json_reply({'ok':False,'error':'Not found'},404);return
        action=unquote(self.path[len(API):].split('?',1)[0]).strip('/')
        data=self.read_json()
        try:
            if action=='status': result=system_status()
            elif action=='wifi/scan': result={'ok':True,'networks':wifi_scan()}
            elif action=='wifi/power':
                if not shutil.which('nmcli'):raise RuntimeError('NetworkManager (nmcli) is not installed')
                enabled=bool(data.get('enabled'));rc,out,err=run(['nmcli','radio','wifi','on' if enabled else 'off'])
                if rc:raise RuntimeError(err or out or 'Unable to change Wi-Fi power')
                result={'ok':True,'powered':enabled}
            elif action=='wifi/connect':
                if not shutil.which('nmcli'):raise RuntimeError('NetworkManager (nmcli) is not installed')
                ssid=str(data.get('ssid',''))[:128]
                if not ssid:raise RuntimeError('Missing SSID')
                args=['nmcli','device','wifi','connect',ssid]
                password=str(data.get('password',''))
                if password:args += ['password',password]
                rc,out,err=run(args,timeout=40)
                if rc:raise RuntimeError(err or out or 'Wi-Fi connection failed')
                result={'ok':True,'message':out}
            elif action=='wifi/disconnect':
                dev=wifi_device()
                if not dev or not dev.get('device'):raise RuntimeError('No Wi-Fi device found')
                rc,out,err=run(['nmcli','device','disconnect',dev['device']])
                if rc:raise RuntimeError(err or out or 'Wi-Fi disconnect failed')
                result={'ok':True}
            elif action=='bluetooth/power':
                if not shutil.which('bluetoothctl'):raise RuntimeError('bluetoothctl is not installed')
                enabled=bool(data.get('enabled'));rc,out,err=run(['bluetoothctl','power','on' if enabled else 'off'],timeout=10)
                if rc:raise RuntimeError(err or out or 'Unable to change Bluetooth power')
                result={'ok':True,'powered':enabled}
            elif action=='bluetooth/scan':
                if not shutil.which('bluetoothctl'):raise RuntimeError('bluetoothctl is not installed')
                run(['bluetoothctl','--timeout','5','scan','on'],timeout=8)
                result={'ok':True,'devices':bluetooth_devices(False)}
            elif action=='bluetooth/devices':
                result={'ok':True,'devices':bluetooth_devices(bool(data.get('paired',True)))}
            elif action in ('bluetooth/pair','bluetooth/connect','bluetooth/disconnect'):
                if not shutil.which('bluetoothctl'):raise RuntimeError('bluetoothctl is not installed')
                mac=str(data.get('mac','')).upper()
                if not valid_mac(mac):raise RuntimeError('Invalid Bluetooth address')
                verb=action.split('/')[1]
                if verb=='pair':
                    rc,out,err=run(['bluetoothctl','--timeout','30','pair',mac],timeout=35)
                    if rc:raise RuntimeError(err or out or 'Bluetooth pairing failed')
                    run(['bluetoothctl','trust',mac],timeout=8)
                    run(['bluetoothctl','connect',mac],timeout=15)
                else:
                    rc,out,err=run(['bluetoothctl',verb,mac],timeout=20)
                    if rc:raise RuntimeError(err or out or f'Bluetooth {verb} failed')
                result={'ok':True}
            else:
                self.json_reply({'ok':False,'error':'Unknown system action'},404);return
            self.json_reply(result)
        except Exception as e:
            self.json_reply({'ok':False,'error':str(e)},400)


if __name__=='__main__':
    server=ThreadingHTTPServer((HOST,PORT),Handler)
    print(f'DorukStation local system server: http://{HOST}:{PORT}/')
    print('Wi-Fi control:', 'enabled' if shutil.which('nmcli') else 'unavailable (nmcli missing)')
    print('Bluetooth control:', 'enabled' if shutil.which('bluetoothctl') else 'unavailable (bluetoothctl missing)')
    print('Press Ctrl+C to stop.')
    try: server.serve_forever()
    except KeyboardInterrupt: pass
