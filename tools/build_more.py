import sys,re,glob,json; sys.path.insert(0,'/tmp')
from extract import *
OUT='/home/claude/nooralimaan/duas/'
t,hs=load_book('0610*/*/*Masaha001025-ara1')
def fin(p):
    p=re.sub(r'@[A-Z]+@?\d*','',p)            # رموز @QUR@ ونحوها
    p=re.sub(r'\[|\]','',p) if False else p
    p=re.sub(r'\*','',p)
    p=re.sub(r'(?<=[\u0621-\u064A\)\،]) \d{1,3}(?= |$)','',p)
    return re.sub(r'\s+',' ',p).strip()
SRC_M='المزار الكبير لابن المشهدي'
# (id, عنوان, نوع, [أرقام الأقسام])
M=[
('z-nabi','زيارة النبي محمد (ص)','z',[17]),
('z-nabi-2','زيارة أخرى للنبي (ص)','z',[18]),
('z-zahra-1','زيارة السيدة فاطمة الزهراء (ع) - الأولى','z',[25]),
('z-zahra-2','زيارة السيدة فاطمة الزهراء (ع) - الثانية','z',[26]),
('z-baqi-1','زيارة الأئمة (ع) في البقيع - الأولى','z',[31]),
('z-baqi-2','زيارة الأئمة (ع) في البقيع - الثانية','z',[32]),
('z-fatima-asad','زيارة فاطمة بنت أسد (ع)','z',[34]),
('z-hamza','زيارة حمزة بن عبد المطلب (رض)','z',[35]),
('z-ali-1','زيارة أمير المؤمنين (ع) - ليلة المبعث','z',[73]),
('z-ali-2','زيارة أمير المؤمنين (ع) - أخرى','z',[74]),
('z-ali-3','زيارة أمير المؤمنين والحسين (ع)','z',[76]),
('z-ali-4','زيارة أمير المؤمنين (ع) - المطولة','z',[77]),
('z-ali-5','زيارة أمير المؤمنين (ع) - عند الباب','z',[79]),
('z-ghadir-1','زيارة أمير المؤمنين (ع) يوم الغدير','z',[83]),
('z-ghadir-2','الزيارة المختصة بيوم الغدير','z',[84]),
('z-ali-6','زيارة أمير المؤمنين (ع) - أخرى جامعة','z',[87]),
('z-muslim','زيارة مسلم بن عقيل (رض)','z',[64]),
('z-hani','زيارة هاني بن عروة (رض)','z',[65]),
('z-hussain-qadr','زيارة الإمام الحسين (ع) - ليلة القدر والعيدين','z',[129]),
('z-hussain-eid','زيارة الإمام الحسين (ع) - أخرى في العيدين','z',[130]),
('z-hussain-safwan','زيارة الإمام الحسين (ع) - زيارة صفوان','z',[136]),
('z-hussain-jabir','زيارة الإمام الحسين (ع) - زيارة جابر','z',[137]),
('z-hussain-arafa','زيارة الإمام الحسين (ع) يوم عرفة','z',[145]),
('z-hussain-short','زيارة الإمام الحسين (ع) - مختصرة تُقرأ كل يوم','z',[153]),
('z-shuhada-ashura','زيارة الشهداء (رض) يوم عاشوراء','z',[150]),
('z-sajjad','زيارة علي الأكبر بن الحسين (ع)','z',[109]),
('z-shuhada','زيارة الشهداء (رض)','z',[110]),
('z-abbas','زيارة أبي الفضل العباس (ع)','z',[111]),
('z-aimma','زيارة جامعة للأئمة (ع)','z',[155]),
('z-kazim','زيارة الإمام الكاظم (ع)','z',[157]),
('z-jawad','زيارة الإمام الجواد (ع)','z',[158]),
('z-kazimayn-1','زيارة الكاظمين (ع) - الأولى','z',[160]),
('z-kazimayn-2','زيارة الكاظمين (ع) - الثانية','z',[161]),
('z-rida-1','زيارة الإمام الرضا (ع) - الأولى','z',[164]),
('z-rida-2','زيارة الإمام الرضا (ع) - الثانية','z',[165]),
('z-rida-3','زيارة الإمام الرضا (ع) - مختصرة','z',[204]),
('z-askariyyayn-1','زيارة الهادي والعسكري (ع) - الأولى','z',[167]),
('z-askariyyayn-2','زيارة الهادي والعسكري (ع) - الثانية','z',[168]),
('z-askariyyayn-3','زيارة العسكريين (ع)','z',[205]),
('z-mashahid','زيارة جامعة لسائر المشاهد','z',[170]),
('z-mashahid-2','زيارة مختصرة جامعة لسائر المشاهد','z',[172]),
('z-mahdi-1','زيارة صاحب الزمان (عج)','z',[173]),
('z-mahdi-2','زيارة أخرى لصاحب الزمان (عج)','z',[177]),
('z-ummqaim','زيارة أم القائم (ع)','z',[206]),
('z-salman-1','زيارة سلمان الفارسي (رض) - الأولى','z',[184]),
('z-salman-2','زيارة سلمان الفارسي (رض) - الثانية','z',[185]),
('d-ahd','دعاء العهد','d',[208]),
('d-arafa','دعاء يوم عرفة (رواية المزار الكبير)','d',[142]),
('d-munajat-ali','مناجاة أمير المؤمنين (ع) في مسجد الكوفة','d',[61]),
]
idx=json.load(open(OUT+'index.json',encoding='utf-8'))
have={i['id'] for i in idx}
def add(id_,title,c,paras,src):
    paras=[fin(p) for p in paras if fin(p)]
    assert len(paras)>=2 and sum(map(len,paras))>150,(id_,len(paras))
    json.dump(paras,open(OUT+id_+'.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
    idx[:]=[i for i in idx if i['id']!=id_]
    idx.append({'id':id_,'t':title,'c':c,'n':len(paras),'s':src})
for id_,title,c,secs in M:
    paras=[]
    for s in secs: paras+=section(t,hs,s)
    add(id_,title,c,paras,SRC_M)
# دعاء الفرج
s=section(t,hs,178); first=s[5].split('السلام): ',1)[-1]
add('d-faraj','دعاء الفرج (اللهم عظم البلاء)','d',[first]+s[6:],SRC_M)
# مصباح المتهجد
f=glob.glob('0460ShaykhTusi/*Misbah*/*ara1')[0]; raw=re.sub(r'\n~~',' ',open(f,encoding='utf-8-sig').read()); L=raw.split('\n')
def tusi(a,b):
    out=[]
    for l in L[a:b]:
        if not l.startswith('# ') or l.startswith('# PageV'): continue
        p=l[2:]
        p=re.sub(r'^\d+ / \d+،?\s*','',p)
        p=re.sub(r'\bms\d+\b','',p)
        p=re.sub(r'(?<=\s)\d{1,4}(?=\s)','',p)       # أرقام الحواشي بين الكلمات
        p=re.sub(r'\s+',' ',p).strip()
        if p: out.append(p)
    return out
SRC_T='مصباح المتهجد للشيخ الطوسي'
add('d-abuhamza','دعاء أبي حمزة الثمالي','d',tusi(3253,3304),SRC_T)
add('d-simat','دعاء السمات','d',tusi(2417,2428),SRC_T)
add('z-amin-allah','زيارة أمين الله','z',tusi(4072,4087),SRC_T)
idx.sort(key=lambda i:(i['c'],i['id']))
json.dump(idx,open(OUT+'index.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
import collections; print(collections.Counter(i['c'] for i in idx), len(idx))
# فحوص
bad=0
for i in idx:
    tx=' '.join(json.load(open(OUT+i['id']+'.json',encoding='utf-8')))
    if re.search(r'@|ms\d|PageV|~~|\(\d\)',tx) or re.search(r'(?<=[\u0621-\u064A]) \d{1,4} (?=[\u0621-\u064A])',tx): print('LEFTOVER',i['id'],re.findall(r'@\w*|ms\d+|PageV|\(\d\)|(?<=[\u0621-\u064A]) \d{1,4} (?=[\u0621-\u064A])',tx)[:5]); bad+=1
print('leftover files',bad)
