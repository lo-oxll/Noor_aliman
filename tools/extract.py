import re,glob,json
def clean(txt):
    out=[];cur=None
    for ln in txt.split('\n'):
        ln=ln.rstrip()
        if not ln.strip() or ln.startswith('PageV') or ln.startswith('Page'): continue
        if ln.startswith('~~'):
            if cur is not None: cur.append(ln[2:].strip())
            continue
        m=re.match(r'# ?(.*)',ln)
        if m:
            if cur: out.append(' '.join(cur))
            cur=[m.group(1).strip()]
    if cur: out.append(' '.join(cur))
    res=[]
    for p in out:
        p=re.sub(r'@HAD\d*@?','',p)
        p=re.sub(r'\bms\d+\b','',p)
        p=re.sub(r'\s*\(\s*\d+\s*\)','',p)
        p=re.sub(r'\s+',' ',p).replace(' ،','،').replace(' .','.').strip()
        if len(p)>2: res.append(p)
    return res
def load_book(pattern):
    f=glob.glob(pattern)[0]; t=open(f,encoding='utf-8-sig').read()
    hs=[(m.start(),m.end(),m.group(1)) for m in re.finditer(r'^### \|+ (.+)$',t,re.M)]
    return t,hs
def section(t,hs,i):
    return clean(t[hs[i][1]:(hs[i+1][0] if i+1<len(hs) else len(t))])
