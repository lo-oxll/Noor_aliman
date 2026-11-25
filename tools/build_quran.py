"""يبني quran/ من نص Tanzil (Uthmani minimal v1.1) عبر حزمة @muslims-community/quran. النص لا يُعدَّل."""
import json,sys
src=sys.argv[1] if len(sys.argv)>1 else '/tmp/q/pk/muslims-community-quran-1.1.0/package/dist/quran.json'
d=json.load(open(src,encoding='utf-8'))['surahs']
assert len(d)==114 and sum(len(s['ayat']) for s in d)==6236
idx=[]
for s in d:
    ay=s['ayat']; assert [a['id'] for a in ay]==list(range(1,len(ay)+1))
    json.dump({'a':[a['text'] for a in ay],'s':[a['id'] for a in ay if a.get('sajdah')]},open(f"quran/{s['id']}.json",'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
    idx.append({'n':s['id'],'t':s['name'],'c':len(ay),'m':'مكية' if s['revelationType']=='Meccan' else 'مدنية','j':ay[0]['juz']})
json.dump(idx,open('quran/index.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(idx),sum(i['c'] for i in idx))
