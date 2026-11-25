import re,json,os
src='/tmp/openiti/data/0500CabdWahidTamimiAmidi/0500CabdWahidTamimiAmidi.GhurarHikam/0500CabdWahidTamimiAmidi.GhurarHikam.Masaha004559-ara1'
t=open(src,encoding='utf-8-sig').read()
body=t[t.find('### ||| القسم الأول'):]
lines=body.split('\n')
secs=[];cur_sec=None;cur_bab=None;cur_fasl=None;cur_sub=None
last=None
def clean(s):
    s=re.sub(r'\bms\d+\b','',s)
    s=re.sub(r'\s*\(\s*\d+\s*/\s*\d+\s*\)\s*\.?\s*$','',s)
    return re.sub(r'\s+',' ',s).strip()
def newbab(title):
    global cur_bab,last
    cur_bab={'title':title,'groups':[]}; secs[-1]['babs'].append(cur_bab)
def group(title):
    global last
    g={'title':title,'items':[]}
    if cur_bab is None: newbab('عام')
    cur_bab['groups'].append(g); return g
cur_g=None
for ln in lines:
    ln=ln.rstrip()
    if ln.startswith('### |||'):
        h=ln[7:].strip()
        if h.startswith('القسم'):
            h=h.split(' وما فيه')[0]
            secs.append({'title':h,'babs':[]}); cur_bab=None;cur_g=None
        elif h.startswith('الباب'):
            if not secs: secs.append({'title':'عام','babs':[]})
            newbab(h);cur_g=None
        elif h.startswith('الفصل'):
            cur_g=group(h)
        else:
            if cur_g is None or True:
                # subtopic inside current fasl: append to title chain
                base=cur_g['title'].split(' ‹ ')[0] if cur_g else ''
                cur_g=group((base+' ‹ ' if base.startswith('الفصل') else '')+h)
        continue
    if ln.startswith('Page') or not ln.strip(): continue
    m=re.match(r'# @HAD\d+ (.*)',ln)
    if m:
        c=m.group(1); n=re.match(r'(\d+) (.*)',c)
        if n:
            if cur_g is None: cur_g=group('عام')
            last={'n':int(n.group(1)),'t':n.group(2)}; cur_g['items'].append(last)
        elif last: last['t']+=' '+c
        continue
    if ln.startswith('~~') and last: last['t']+=' '+ln[2:]
    elif ln.startswith('# ') and last and not ln.startswith('# @'):
        pass
# split items that swallowed following numbered items
for s_ in secs:
    for b in s_['babs']:
        for g in b['groups']:
            out=[]
            for it in g['items']:
                parts=re.split(r'\s(\d+) @HAD\d+ ',' '+it['t'])
                out.append({'n':it['n'],'t':parts[0].strip()})
                for j in range(1,len(parts),2): out.append({'n':int(parts[j]),'t':parts[j+1].strip()})
            g['items']=out
for s_ in secs:
    for b in s_['babs']: b['title']=re.sub(r'\bms\d+\b','',b['title']).strip()
cnt=0;ids=[]
for s in secs:
    for b in s['babs']:
        for g in b['groups']:
            for it in g['items']:
                it['t']=clean(it['t']); cnt+=1; ids.append(it['n'])
print('sections',len(secs),[ (s['title'],len(s['babs'])) for s in secs])
print('count',cnt,'unique',len(set(ids)),'max',max(ids),'missing',len(set(range(1,max(ids)+1))-set(ids)))
os.makedirs('data/ghurar',exist_ok=True)
index=[];k=0
for s in secs:
    for b in s['babs']:
        k+=1
        groups=[g for g in b['groups'] if g['items']]
        n=sum(len(g['items']) for g in groups)
        json.dump({'groups':[{'t':g['title'],'i':[[i['n'],i['t']] for i in g['items']]} for g in groups]},open(f'data/ghurar/{k}.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
        index.append({'id':k,'sec':s['title'],'title':b['title'],'count':n})
json.dump(index,open('data/ghurar/index.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(index)); [print(x) for x in index]
empty=[it for s in secs for b in s['babs'] for g in b['groups'] for it in g['items'] if len(it['t'])<5]
print('short',len(empty),empty[:5])
