import json
from PIL import Image
from collections import Counter
D='/home/claude/repo/cdp/img/'
im=Image.open(D+'detail.png').convert('RGB'); card=Image.open(D+'card.png').convert('RGB'); gal=Image.open(D+'gallery.png').convert('RGB'); cta=Image.open(D+'cta.png').convert('RGB')
def colors(img,X0,Y0,X1,Y1):
    c=Counter(); X0,Y0,X1,Y1=int(X0),int(Y0),int(X1),int(Y1)
    for yy in range(Y0,Y1,2):
        for xx in range(X0,X1,2): c[img.getpixel((min(img.width-1,max(0,xx)),min(img.height-1,max(0,yy))))]+=1
    bg=c.most_common(1)[0][0]; best=max(c, key=lambda p: sum((a-b)**2 for a,b in zip(p,bg)))
    h=lambda p:'#%02x%02x%02x'%p; return h(bg),h(best)
# styles: font size pt, weight
S={'h1':(24,700),'h2':(16,700),'body':(16,400),'small':(14,400),'xs':(11,400),'btn':(16,700),'pill':(12,700),'btns':(14,700),'pills':(9,700),'pillw':(13,400),'num':(13,500),'tiny':(12,400)}
view=Image.open(D+'viewer.png').convert('RGB')
SC=632/425.0  # px per pt in the new CDP export
def shift(y): return 0 if y<1330 else (60 if y<4600 else 63)   # the Documents block grew by 60pt in the new design
def item(kind,x0,y0,x1,y1,st,nl,fr,align='left',pad=1,lh=None,bgo=None,colo=None,el=None,raw=False,pill=False):
    if kind=='detail':
        if not raw: y0,y1=y0+shift(y0),y1+shift(y1)
        img=im; W=599/SC; H=7822/SC; X0,Y0,X1,Y1=x0*SC-17,y0*SC-17,x1*SC-17,y1*SC-17
        k=1/SC
    elif kind=='card':
        img=card; W=393; H=291; X0,Y0,X1,Y1=x0*2,y0*2,x1*2,y1*2; k=0.5
    elif kind=='cta':
        img=cta; W=393; H=76; X0,Y0,X1,Y1=x0*2,y0*2,x1*2,y1*2; k=0.5
    elif kind=='viewer':
        img=view; W=393; H=812; X0,Y0,X1,Y1=x0*2,y0*2,x1*2,y1*2; k=0.5
    else:
        img=gal; W=393; H=1584; X0,Y0,X1,Y1=x0*2,y0*2,x1*2,y1*2; k=0.5
    bg,col=colors(img,X0,Y0,X1,Y1)
    if bgo: bg=bgo
    if colo: col=colo
    fs,fw=S[st]
    cy=(Y0+Y1)/2*k; gh=(fs*1.25) if not (lh or el) else (Y1-Y0)*k   # patch covers the glyph band only, not the whole line box
    y0p=cy-gh/2
    l=(X0*k-pad)/W*100; t=(y0p-pad)/H*100; w=(X1-X0)*k/W*100+2*pad/W*100; hgt=(gh+2*pad)/H*100
    if pill: l=X0*k/W*100; t=Y0*k/H*100; w=(X1-X0)*k/W*100; hgt=(Y1-Y0)*k/H*100
    return dict(l=round(l,3),t=round(t,3),w=round(w,3),h=round(hgt,3),fs=fs,fw=fw,c=col,bg=bg,a=align,nl=nl,fr=fr,lh=lh,el=el,pill=pill)
I=[]
d=lambda *a,**k: I.append(item('detail',*a,**k))
# header card (also reused on the Basic card with y-133)
HEAD=[
 (32,157,120,187,'body','Herenhuis','Maison de maître'),
 (60,228.6,204.4,256.2,'num','± € 1.254/maand   ›','± € 1.254/mois   ›'),
 (75,303,125,333,'small','4 slpk.','4 ch.'),
 (161,303,215,333,'small','3 verd.','3 étages'),
]
for h in HEAD: d(h[0],h[1],h[2],h[3],h[4],h[5],h[6],pill=(h[4]=='num'))
d(64,366,300,400,'h2','Dichtstbijzijnde haltes','Arrêts les plus proches')
d(32,562,210,610,'h1','Kenmerken','Caractéristiques')
d(64,625,180,659,'body','Garage · 2 wagens','Garage · 2 voitures')
d(64,673,170,707,'body','Open keuken','Cuisine ouverte')
d(64,721,225,755,'body','Tuin · zuidwest','Jardin · sud-ouest')
d(64,769,112,803,'body','Kelder','Cave')
d(64,817,124,851,'body','Terras','Terrasse')
d(141,881,283,915,'btn','Alle 15 kenmerken','Voir les 15 caractéristiques',align='center')
d(32,959,185,1006,'h1','Wat maakt het bijzonder','Ce qui le rend unique')
d(32,1010,392,1044,'h2','Parvis Saint-Gilles: herenhuis met 4 slpk.','Parvis Saint-Gilles : maison de maître 4 ch.')
d(32,1042,392,1176,'body','Volledig gerenoveerd herenhuis in een rustige woonstraat, op twee minuten van het Parvis de Saint-Gilles. Originele lijstwerken bewaard, nieuwe keuken die uitgeeft op een tuin op het zuiden. Aparte studio op tuinniveau, momenteel verhuurd.','Maison de maître entièrement rénovée dans une rue calme, à deux minutes du Parvis de Saint-Gilles. Moulures d’origine conservées, nouvelle cuisine ouverte sur un jardin orienté sud. Studio indépendant au niveau du jardin, actuellement loué.',lh=24,el=True)
d(176,1190,248,1224,'btn','Meer tonen','Voir plus',align='center')
d(32,1268,160,1315,'h1','Documenten','Documents')
d(80,1340,120,1368,'h2','EPC','PEB',raw=True)
d(80,1404,150,1432,'h2','Elektriciteit','Électricité',raw=True)
d(80,1468,150,1496,'h2','Asbest','Amiante',raw=True)
d(32,1857,270,1904,'h1','Energie en staat','Énergie et état')
d(32,1908,230,1938,'small','Energieprestatie (EPC)','Performance énergétique (PEB)')
d(68,1990,140,2014,'body','Bouwjaar 1978','Construit en 1978')
d(68,2030,205,2054,'body','Gerenoveerd in 2024','Rénové en 2024')
d(68,2070,125,2094,'body','Als nieuw','Comme neuf')
d(68,2110,152,2134,'body','Warmtepomp','Pompe à chaleur')
d(68,2150,152,2174,'body','Gas en stookolie','Gaz et mazout')
d(176,2196,248,2230,'btn','Meer tonen','Voir plus',align='center')
d(32,2274,300,2321,'h1','Ligging en buurt','Localisation et quartier')
d(80,2740,320,2774,'h2','Dichtstbijzijnde haltes','Arrêts les plus proches')
d(80,2852,350,2886,'h2','Reistijd naar uw plaatsen','Temps de trajet vers vos lieux')
d(112,2899,280,2929,'body','1 u 30 naar Mijn kantoor','1 h 30 vers Mon bureau')
d(112,2964,280,2994,'body','45 min naar Paula’s school','45 min vers l’école de Paula')
d(176,3105,276,3129,'btn','Traject toevoegen','Ajouter un trajet',raw=True)
d(32,3113,275,3160,'h1','Markt en prijshistoriek','Marché et historique des prix')
d(49,3182,240,3207,'small','Vraagprijs per m² · Sint-Gillis','Prix demandé par m² · Saint-Gilles')
d(46,3306,202,3342,'num','11% onder de mediaan van de buurt','11 % sous la médiane du quartier',raw=True,bgo='#ffffff',colo='#006d31',pad=0,el=True)
d(126,3358,205,3384,'small','Buurt','Quartier')
d(248,3358,312,3384,'small','Deze woning','Ce bien')
d(45,3420,78,3446,'num','Datum','Date')
d(159,3420,200,3446,'num','Gebeurtenis','Événement')
d(340,3420,381,3446,'num','Prijs','Prix',align='right')
d(45,3460,128,3490,'small','12 sep 2026','12 sept. 2026')
d(159,3460,205,3490,'small','Te koop gezet','Mis en vente')
d(45,3509,128,3539,'small','03 mrt 2019','03 mars 2019')
d(159,3509,195,3539,'small','Verkocht','Vendu')
d(32,3586,118,3633,'h1','Financiering','Financement')
d(238,3600,318,3626,'tiny','Aangeboden door','Proposé par',align='right')
d(57,3666,160,3696,'h2','Aankoopprijs','Prix d’achat')
d(57,3758,280,3788,'h2','Eigen inbreng (20% aanbevolen)','Fonds propres (20 % recommandés)')
d(57,3850,155,3880,'h2','Looptijd','Durée du prêt')
d(300,3847,370,3881,'h2','25 jaar','25 ans',align='right')
d(170,4118,250,4146,'h2','/maand','/mois',align='center',raw=True)
d(73,4149,200,4179,'small','Geleend bedrag','Montant emprunté')
d(73,4195,220,4225,'small','Rentekosten (3,30%)','Coût des intérêts (3,30 %)')
d(73,4241,290,4271,'small','Registratie- en notariskosten','Droits d’enregistrement et notaire')
d(57,4287,185,4317,'h2','Totale projectkost','Coût total du projet')
d(129,4343,295,4377,'btn','Simuleer bij Belfius','Simuler avec Belfius',align='center')
d(57,4413,340,4443,'xs','¹ Indicatieve, niet-contractuele simulatie op basis van parameters van Belfius. Meer info','¹ Simulation indicative et non contractuelle basée sur les paramètres de Belfius. En savoir plus',lh=16)
d(100,4510,325,4544,'body','Immoweb-code: 9273615','Code Immoweb : 9273615',align='center')
d(157,4554,300,4588,'btn','Zoekertje melden','Signaler cette annonce',align='center')
d(32,4636,225,4683,'h1','Vergelijkbare panden','Biens similaires')
d(76,4719,102,4745,'pill','Nieuw','Nouveau')
d(311,4724,392,4743,'pills','OPENBARE VERKOOP','VENTE PUBLIQUE')
d(303,4868,390,4898,'small','Herenhuis','Maison de maître')
d(76,4929,112,4959,'small','4 slpk.','4 ch.')
d(327,4929,362,4959,'small','4 slpk.','4 ch.')
d(32,5036,170,5083,'h1','Contact opnemen','Prendre contact')
OV={'detail':I,'card':[],'cta':[],'gallery':[],'viewer':[]}
for h in HEAD: OV['card'].append(item('card',h[0]-16,h[1]-133,h[2]-16,h[3]-133,h[4],h[5],h[6],pill=(h[4]=='num')))
OV['gallery'].append(item('gallery',16,1018,110,1042,'pillw','3D-tour','Visite 3D',align='center',bgo='#000000',colo='#ffffff'))
OV['gallery'].append(item('gallery',16,1298,90,1322,'pillw','Video','Vidéo',align='center',bgo='#000000',colo='#ffffff'))
OV['viewer'].append(item('viewer',140,70,253,90,'h2','Woonkamer','Salon',align='center'))
json.dump(OV,open('/home/claude/repo/cdp/ov.json','w'),ensure_ascii=False)
print(sum(len(v) for v in OV.values()),'items')
