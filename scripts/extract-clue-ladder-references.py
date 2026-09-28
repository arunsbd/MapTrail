"""Offline extraction of archived federal reference inputs. Python 3 standard library only.
Re-run before the TypeScript fixture builder; no web access, no clue generation.
"""
import csv, json, re, zipfile, html, hashlib
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'data/clue-ladder'
SNAP=BASE/'snapshots/us-states-2026-09-05-v1'
RAW=SNAP/'raw'
for manifest in (BASE/'ladders/manifests').glob('*.json'):
    if json.loads(manifest.read_text())['dataSnapshotId']==SNAP.name:
        raise SystemExit('Snapshot already referenced by a manifest; create a new version before extraction.')
class Tables(HTMLParser):
    def __init__(self):
        super().__init__(); self.rows=[]; self.row=None; self.cell=None; self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag=='sup': self.skip+=1
        if tag=='tr': self.row=[]
        if tag in ('td','th') and self.row is not None: self.cell=''
    def handle_data(self,data):
        if self.cell is not None and not self.skip: self.cell+=data
    def handle_endtag(self,tag):
        if tag=='sup': self.skip-=1
        if tag in ('td','th') and self.cell is not None:
            self.row.append(' '.join(self.cell.split())); self.cell=None
        if tag=='tr' and self.row is not None: self.rows.append(self.row); self.row=None

def table(file):
    parser=Tables(); parser.feed((RAW/file).read_text(encoding='utf-8')); return parser.rows

def number(value):
    return float(value.replace(',',''))

states=re.findall(r'\{ code: "([A-Z]{2})", name: "([^"]+)" \}',(ROOT/'data/states.ts').read_text())
assert len(states)==50
by_name={name:code for code,name in states}
reference={code:{'name':name} for code,name in states}
for row in csv.DictReader((RAW/'population.csv').read_text().splitlines()):
    if row['SUMLEV']=='040' and row['NAME'] in by_name:
        reference[by_name[row['NAME']]].update(fips=row['STATE'],region=row['REGION'],division=row['DIVISION'],population=int(row['POPESTIMATE2025']))
for row in table('area.html'):
    if row and row[0] in by_name:
        reference[by_name[row[0]]].update(land=number(row[3]),water=number(row[5]),total=number(row[1]))
for row in table('elevation.html'):
    if row and row[0] in by_name:
        reference[by_name[row[0]]].update(elevation=number(row[3]),highpoint=row[1])
for row in table('history.html'):
    if row and row[0] in by_name: reference[by_name[row[0]]]['admissionYear']=int(row[1])
with zipfile.ZipFile(RAW/'SAGDP.zip') as archive:
    for file, selected in [('SAGDP1__ALL_AREAS_1997_2025.csv',{'3':'gdp'}),('SAGDP2__ALL_AREAS_1997_2025.csv',{'12':'manufacturing','60':'professional','68':'educationHealth','91':'goodsProducing'})]:
        for row in csv.DictReader(archive.read(file).decode('utf-8-sig').splitlines()):
            if row.get('GeoName') in by_name and row.get('LineCode') in selected:
                assert row['Unit']=='Millions of current dollars'
                reference[by_name[row['GeoName']]][selected[row['LineCode']]]=({'suppressed':row['2025']} if row['2025'].startswith('(') else number(row['2025'])*1000000)
                if row['2025'].startswith('('): print('Suppressed:',row['GeoName'],row['LineCode'],row['2025'])
# NPS formal section only. IDs distinguish the two seki units sharing one URL.
parks_html=(RAW/'parks.html').read_text(encoding='utf-8').split('National Parks (63)',1)[1].split('</div>',1)[0]
park_units=[]
for url,name,locations in re.findall(r'<a href="([^"]+)"[^>]*>(.*?)</a>,\s*(.*?)(?:<br\s*/>|</p>)',parks_html,re.S):
    name=html.unescape(re.sub('<[^>]+>','',name)).strip()
    locations=html.unescape(re.sub('<[^>]+>','',locations)).strip()
    location_names=re.split(r',? and |,\s*',locations)
    codes=[by_name[n] for n in location_names if n in by_name]
    park_units.append({'id':re.sub('[^a-z0-9]+','-',name.lower()).strip('-'),'name':name,'states':codes,'locationText':locations,'url':url})
assert len(park_units)==63, len(park_units)
for code in reference: reference[code]['formalParks']=[p['id'] for p in park_units if code in p['states']]
# Regulatory transcription of 49 CFR 71.4-71.12; standard zones only, not local informal observance or DST.
zones={
'Eastern':'CT DE GA ME MD MA NH NJ NY NC OH PA RI SC VT VA WV',
'Central':'AL AR IL IA LA MN MS MO OK WI',
'Mountain':'AZ CO MT NM UT WY',
'Pacific':'CA WA',
'Eastern,Central':'FL IN KY MI TN',
'Central,Mountain':'KS NE ND SD TX',
'Mountain,Pacific':'ID NV OR',
'Alaska,Hawaii-Aleutian':'AK',
'Hawaii-Aleutian':'HI'}
assert sum(len(codes.split()) for codes in zones.values())==50
for zone,codes in zones.items():
    for code in codes.split(): reference[code]['zones']=zone.split(',')
# Read Census workbooks directly as OOXML, retaining actual cell/column locators.
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
places=[]
for fips,code in [('01','AL'),('08','CO'),('44','RI')]:
    with zipfile.ZipFile(RAW/f'places-{fips}.xlsx') as archive:
        strings=[''.join(n.itertext()) for n in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si',NS)]
        sheet=ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        rows=[]
        for row in sheet.findall('.//s:row',NS):
            cells={}
            for cell in row.findall('s:c',NS):
                v=cell.find('s:v',NS)
                if v is not None:
                    value=strings[int(v.text)] if cell.get('t')=='s' else v.text
                    cells[re.sub(r'\d','',cell.get('r'))]=value
            rows.append((int(row.get('r')),cells))
        print(code,'headers',rows[:5])
        # Verify the 2025 column from its header; workbook observations retain place labels.
        assert any(cells.get('H')=='2025' for _,cells in rows)
        for row,cells in rows:
            name=cells.get('A','')
            if name.endswith(', '+reference[code]['name']) and 'H' in cells:
                places.append({'state':code,'name':name.lstrip('.'),'population':int(cells['H']) if cells['H'].isdigit() else None, 'suppressionCode':None if cells['H'].isdigit() else cells['H'],'row':row,'column':'H','sheet':ET.fromstring(archive.read('xl/workbook.xml')).find('s:sheets/s:sheet',NS).get('name')})
        top=sorted([p for p in places if p['state']==code and p['population'] is not None],key=lambda p:-p['population'])[:4]
        print(code,'largest incorporated places',top)
for code,row in reference.items():
    assert all(k in row for k in ['population','land','elevation','admissionYear','gdp','manufacturing','professional','educationHealth','formalParks','zones']),code
(SNAP/'reference-inputs.json').write_text(json.dumps({'states':reference,'formalParks':park_units,'places':places},indent=2)+'\n',encoding='utf-8')
# Preserve the audited clue tables and sample orders verbatim as research expectations.
spec=(ROOT/'docs/MapTrail_Clue_Ladder_Data_Spec.md').read_text(encoding='utf-8')
clues=[]; samples={}
for code,section in [('AL',11),('CO',12),('RI',13)]:
    text=spec.split(f'## {section}. ',1)[1].split(f'## {section+1}. ',1)[0]
    for line in text.splitlines():
        if re.match(r'\| `[a-z]{2}\.',line):
            fields=[f.strip() for f in line.strip('|').split('|')]
            cid,wording,category,count,tier,window=fields
            lo,hi=window.split('–')
            clues.append(dict(clueId=cid.strip('`'),answerStateId='US-'+code,text=wording,category=category.replace(' ','_'),expectedCount=int(count),tier=int(tier),earliest=int(lo),latest=int(hi)))
    samples[code]=re.findall(r'\| \d+ \| `([^`]+)` \|',text)
(BASE/'review/audited-examples.json').write_text(json.dumps({'clues':clues,'sampleLadders':samples,'earlyCounts':{'AL':[19,5,2,1],'CO':[6,3,2,1],'RI':[19,4,2,1]},'notes':['Original specification expectations retained independently of fresh evaluation.']},indent=2)+'\n',encoding='utf-8')
print('Reference rows:',len(reference),'formal units:',len(park_units),'no-park states:',sum(not s['formalParks'] for s in reference.values()))
