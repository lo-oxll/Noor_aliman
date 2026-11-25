"""يبني search.json (فهرس العناوين للبحث الشامل). التشغيل من جذر المشروع."""
import json,re
out=[]
for x in json.load(open('duas/index.json',encoding='utf-8')):
    out.append(['زيارة' if x['c']=='z' else 'دعاء', ('#/ziyarat/' if x['c']=='z' else '#/duas/')+x['id'], x['t'], ''])
for part,lab in (('khutab','خطبة'),('kutub','كتاب')):
    for n,t,_ in json.load(open(f'nahj/{part}.json',encoding='utf-8')):
        out.append(['نهج البلاغة', f'#/nahj/{part}/{n}', f'{lab} {n}: {t}', ''])
for b in json.load(open('ghurar/index.json',encoding='utf-8')):
    out.append(['غرر الحكم', f"#/ghurar/{b['id']}", b['title'], b['sec']])
for s in json.load(open('mafatih/index.json',encoding='utf-8')):
    for hid,ht in s['h']:
        out.append(['مفاتيح الجنان', f"#/mafatih/{s['id']}/{hid}", re.sub(r'\s+',' ',ht), s['t'][:40]])
for x in json.load(open('quran/index.json',encoding='utf-8')):
    out.append(['القرآن الكريم', f"#/quran/{x['n']}", f"سورة {x['t']}", f"{x['c']} آية"])
json.dump(out,open('search.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out))
