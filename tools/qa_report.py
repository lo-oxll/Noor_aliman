"""فحص آلي لجودة النصوص — لا يغني عن المراجعة البشرية. التشغيل من جذر المشروع: python3 tools/qa_report.py"""
import json,glob,re,os,collections
END=tuple('.:؟!،؛)»"”…؟')
def paras_of(path):
    d=json.load(open(path,encoding='utf-8'))
    base=path.split('/')[0]
    if base=='duas': return [(0,p) for p in d] if isinstance(d,list) and d and isinstance(d[0],str) else []
    if base=='mafatih':
        out=[]
        for h in d:
            for typ,t,ps in h['x']:
                if typ!='سورة': out+= [(0,p) for p in ps]
        return out
    if base=='nahj':
        return [(0,r[-1]) for r in d]
    return []
rows=[]
for f in sorted(glob.glob('duas/*.json')+glob.glob('mafatih/[0-9]*.json')+glob.glob('nahj/*.json')):
    if f.endswith('index.json'): continue
    ps=[p for _,p in paras_of(f)]
    if not ps: continue
    fl=collections.Counter()
    ex={}
    for i,p in enumerate(ps):
        if re.search(r'[A-Za-z]',p): fl['لاتينية']+=1; ex.setdefault('لاتينية',p[:60])
        if re.search(r'(?<=[\u0621-\u064A\u064B-\u0652]) \d{1,4}(?= |$)',p): fl['أرقام داخل النص']+=1; ex.setdefault('أرقام داخل النص',p[:60])
        if 'صفحة' in p and len(p)<30: fl['علامة صفحة']+=1
        if len(p)<6: fl['فقرة قصيرة جداً']+=1; ex.setdefault('فقرة قصيرة جداً',p)
        if len(p)>60 and not p.rstrip().endswith(END) and i+1<len(ps) and not ps[i+1][:1].isspace():
            fl['فقرة بلا ختام (قد تكون مقطوعة)']+=1; ex.setdefault('فقرة بلا ختام (قد تكون مقطوعة)',p[-50:])
        if i and p==ps[i-1]: fl['فقرة مكررة']+=1
    rows.append((f,len(ps),sum(len(p) for p in ps),sum(fl.values()),fl,ex))
tot=sum(r[3] for r in rows)
lines=['# تقرير الفحص الآلي للنصوص','','> هذا فحص آلي بقواعد بسيطة (حروف لاتينية، أرقام داخل النص، فقرات قصيرة جداً أو بلا ختام أو مكررة). **لا يكشف الأخطاء اللغوية أو النقص في المعنى**، ولا يغني عن مقارنة النصوص بنسخة مطبوعة موثوقة.','',f'- ملفات مفحوصة: {len(rows)}',f'- مجموع الملاحظات: {tot}','']
lines+=['## الملفات الأكثر ملاحظات','','| الملف | الفقرات | الملاحظات | أبرزها |','|---|---|---|---|']
for f,n,ch,k,fl,ex in sorted(rows,key=lambda r:-r[3])[:25]:
    if not k: break
    lines.append(f"| `{f}` | {n} | {k} | {', '.join(f'{a}: {b}' for a,b in fl.most_common(2))} |")
lines+=['','## أمثلة للمراجعة اليدوية','']
shown=0
for f,n,ch,k,fl,ex in sorted(rows,key=lambda r:-r[3]):
    for kind,e in ex.items():
        if shown<20: lines.append(f'- `{f}` — {kind}: «{e}»'); shown+=1
lines+=['','## قائمة مراجعة مقترحة (الأكثر قراءة أولاً)','','- [ ] دعاء كميل `duas/dua-kumayl.json`','- [ ] دعاء الندبة `duas/dua-nudba.json`','- [ ] دعاء الافتتاح `duas/dua-al-iftitah.json`','- [ ] زيارة عاشوراء `duas/ziyarat-ashura.json`','- [ ] زيارة الأربعين `duas/ziyarat-arbaeen.json`','- [ ] الزيارة الجامعة الكبيرة `duas/ziyarat-jamia-kabira.json`','- [ ] دعاء أبي حمزة `duas/d-abuhamza.json`','- [ ] دعاء السمات `duas/d-simat.json`','- [ ] زيارة أمين الله `duas/z-amin-allah.json`','- [ ] زيارة العباس `duas/z-abbas.json`','- [ ] أدعية أيام الأسبوع والتوسل والجوشن في `mafatih/2.json`','- [ ] أعمال رمضان وشعبان وذي الحجة في `mafatih/3.json`','- [ ] زيارات `mafatih/4.json`','']
open('REVIEW.md','w',encoding='utf-8').write('\n'.join(lines))
print(len(rows),'files; flags',tot)
