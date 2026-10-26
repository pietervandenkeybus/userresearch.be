# Translation overlays for the sheets behind the CDP (description, energy, credit, contact, facts, commute).
# Coordinates are PDF points of the original design frames. Run after translations.py: python3 translations.py && python3 sheets_i18n.py
import json
from PIL import Image
from collections import Counter
D='/home/claude/repo/cdp/img/'
CROP={'description':(32,24,819,1648),'energy':(32,24,819,1812),'credit':(32,24,819,1648),'contact':(32,24,819,2046),'facts':(32,24,819,2464),
      'c1':(47,36,800,1646),'c2':(47,36,799,1646),'c3':(47,36,799,1646),'c4':(47,36,800,1646),'c5':(47,36,800,1646)}
IMG={k:Image.open(D+k+'.png').convert('RGB') for k in CROP}
S={'h1':(16,700),'h2':(14,700),'body':(16,400),'small':(14,400),'xs':(11,400),'btn':(16,700),'pillw':(13,400),'num':(13,500),'tiny':(12,400),'red':(22,500),'lab':(9,700),'chip':(11,400),'big':(18,500),'grey':(12,400)}
def colors(img,X0,Y0,X1,Y1):
    c=Counter()
    for yy in range(int(Y0),int(Y1),2):
        for xx in range(int(X0),int(X1),2): c[img.getpixel((min(img.width-1,max(0,xx)),min(img.height-1,max(0,yy))))]+=1
    bg=c.most_common(1)[0][0]; best=max(c, key=lambda p: sum((a-b)**2 for a,b in zip(p,bg)))
    h=lambda p:'#%02x%02x%02x'%p; return h(bg),h(best)
OV={}
def it(kind,x0,y0,x1,y1,st,nl,fr,align='left',pad=1,lh=None,bgo=None,colo=None,pill=False):
    l,t,r,b=CROP[kind]; img=IMG[kind]; W=(r-l)/2; H=(b-t)/2
    X0,Y0,X1,Y1=x0*2-l,y0*2-t,x1*2-l,y1*2-t
    bg,col=colors(img,X0,Y0,X1,Y1)
    if bgo: bg=bgo
    if colo: col=colo
    fs,fw=S[st]
    cy=(Y0+Y1)/4; gh=fs*1.8 if not lh else (Y1-Y0)/2
    y0p=cy-gh/2
    d=dict(l=round((X0/2-pad)/W*100,3),t=round((y0p-pad)/H*100,3),w=round(((X1-X0)/2+2*pad)/W*100,3),h=round((gh+2*pad)/H*100,3),fs=fs,fw=fw,c=col,bg=bg,a=align,nl=nl,fr=fr,lh=lh,pill=pill)
    if pill: d.update(l=round(X0/2/W*100,3),t=round(Y0/2/H*100,3),w=round((X1-X0)/2/W*100,3),h=round((Y1-Y0)/2/H*100,3))
    OV.setdefault(kind,[]).append(d)
# ---- description
k='description'
it(k,120,79,300,108,'h1','Wat maakt het bijzonder','Ce qui le rend unique',align='center')
it(k,32,127,392,156,'h2','Parvis Saint-Gilles: herenhuis met 4 slpk.','Parvis Saint-Gilles : maison de maître 4 ch.')
it(k,32,160,392,284,'body','Volledig gerenoveerd herenhuis in een rustige woonstraat, op twee minuten van het Parvis de Saint-Gilles. De originele lijstwerken zijn overal bewaard en geven het interieur karakter en een vleugje geschiedenis.','Maison de maître entièrement rénovée dans une rue résidentielle calme, à deux minutes du Parvis de Saint-Gilles. Les moulures d’origine ont été conservées partout et donnent à l’intérieur caractère et histoire.',lh=24)
it(k,32,316,392,416,'body','De nieuwe keuken geeft uit op een tuin op het zuiden: een uitnodiging om buiten koffie te drinken, samen te eten of rustig van de namiddag te genieten.','La nouvelle cuisine s’ouvre sur un jardin orienté sud : une invitation à prendre un café dehors, partager un repas ou profiter d’un après-midi tranquille.',lh=24)
it(k,32,448,392,548,'body','Een aparte studio op tuinniveau is momenteel verhuurd. Houd rekening met dit lopende huurcontract als u plannen maakt voor deze ruimte.','Un studio indépendant au niveau du jardin est actuellement loué. Ce bail en cours est à prendre en compte dans vos projets pour cet espace.',lh=24)
# ---- energy
k='energy'
it(k,110,80,310,108,'h1','Energie en staat','Énergie et état',align='center')
it(k,48,144,230,171,'h2','Geschatte energiekost','Facture énergétique estimée')
it(k,40,185,392,215,'h2','\u00a0\u00a0\u00a0Tussen 600 € en 800 €/jaar','\u00a0\u00a0\u00a0Entre 600 € et 800 €/an',pill=True,bgo='#f2f2f2')
it(k,48,239,370,324,'small','Geschatte jaarlijkse energiekost bij normaal gebruik: tussen € [waarde] en € [waarde] per jaar. Gemiddelde energieprijzen geïndexeerd op [dag/maand/jaar] (inclusief abonnement)','Coût énergétique annuel estimé pour un usage standard : entre € [valeur] et € [valeur] par an. Prix moyens de l’énergie indexés au [jour/mois/année] (abonnement compris)',lh=20)
it(k,34.5,368,120,392,'h2','EPC-score','Score PEB')
it(k,34.5,405,150,418,'xs','Zuinige woning','Logement économe')
it(k,34.5,621,175,634,'xs','Energieverslindende woning','Logement énergivore')
it(k,233.7,469,320,498,'xs','Primair energieverbruik','Consommation d’énergie primaire',lh=15)
it(k,233.7,525,318,538,'xs','CO₂-uitstoot','Émissions de CO₂')
it(k,68,728,210,746,'small','Gerenoveerd in 2024','Rénové en 2024')
it(k,68,768,130,786,'small','Als nieuw','Comme neuf')
it(k,68,808,160,826,'small','Warmtepomp','Pompe à chaleur')
it(k,68,848,160,866,'small','Gas en stookolie','Gaz et mazout')
# ---- credit (Belfius widget is French in the design; Dutch gets the main labels)
k='credit'
it(k,110,80,310,108,'h1','Simuleer bij Belfius','Simuler avec Belfius',align='center')
it(k,51,207,251,237,'red','Uw simulatie','Votre simulation')
it(k,61,287,110,300,'lab','Vaste rentevoet','Taux fixe')
it(k,61,324,90,337,'lab','JKP','TAEG')
it(k,61,364,140,378,'lab','Maandbedrag','Montant mensuel')
it(k,61,414,251,444,'chip','Bewaar uw simulatie','Sauvegardez votre simulation',align='center',pill=True,bgo='#e9e9e9')
it(k,48,484,380,542,'big','Totale projectkost: 580.999,89 EUR','Coût total du projet: 580.999,89 EUR',lh=29)
it(k,48,559,355,597,'grey','Wilt u de totale kost van uw project kennen? Ontdek het in detail','Vous souhaitez connaitre le coût total de votre projet? Découvrez-le en détail',lh=20)
it(k,48,620,135,637,'lab','Kredietbedrag','Montant de crédit')
it(k,48,726,124,742,'lab','Eigen inbreng','Fonds propres')
# ---- contact
k='contact'
it(k,130,83,290,107,'h1','Contacteer het kantoor','Contacter l’agence',align='center')
it(k,116,156,200,177,'small','Herenhuis','Maison de maître')
it(k,283,158,380,182,'pillw','Onder optie','Sous option',align='center',pill=True)
it(k,140,231,180,252,'small','4 slpk.','4 ch.')
it(k,32,283,110,304,'h2','Naam','Nom')
it(k,224.5,283,310,304,'h2','Voornaam','Prénom')
it(k,32,375,90,396,'h2','E-mail','E-mail')
it(k,32,467,210,488,'h2','Telefoon (optioneel)','Téléphone (facultatif)')
it(k,32,555,100,576,'h2','Bericht','Message')
it(k,48,771,250,792,'h2','Melding bij gelijkaardige panden?','M’alerter pour des biens similaires ?')
it(k,48,793,300,834,'small','We mailen u zodra er nieuwe panden overeenkomen.','Nous vous écrirons dès qu’il y a de nouveaux biens.',lh=20)
it(k,32,862,392,946,'small','Door op VERSTUREN te klikken ga ik akkoord dat Immoweb de gegevens in dit formulier doorgeeft aan de adverteerder, die ze gebruikt om op mijn vraag te antwoorden. Meer informatie','En cliquant sur ENVOYER, j’accepte qu’Immoweb transmette les données de ce formulaire à l’annonceur, qui les utilisera pour répondre à ma demande. Plus d’informations',lh=21)
it(k,183,974,310,998,'btn','Bericht versturen','Envoyer le message')
# ---- facts
k='facts'
it(k,120,82,300,107,'h1','Kenmerken','Caractéristiques',align='center')
it(k,48,146,130,171,'h2','Binnen','Intérieur')
it(k,96,198,220,223,'small','3 badkamers','3 salles de bain')
it(k,96,246,220,271,'small','4 slaapkamers','4 chambres')
it(k,96,294,250,319,'small','Woonkamer · 35 m²','Salon · 35 m²')
it(k,96,342,230,367,'small','Parketvloer','Parquet')
it(k,96,390,220,415,'small','Open keuken','Cuisine ouverte')
it(k,96,438,160,463,'small','Kelder','Cave')
it(k,48,514,130,539,'h2','Buiten','Extérieur')
it(k,96,566,170,591,'small','Terras','Terrasse')
it(k,96,614,320,639,'small','Tuin · zuidwest · 57 m²','Jardin · sud-ouest · 57 m²')
it(k,96,662,160,687,'small','Rustig','Calme')
it(k,96,710,230,735,'small','Garage · 2 wagens','Garage · 2 voitures')
it(k,48,786,140,811,'h2','Pand','Bien')
it(k,96,838,180,863,'small','3 verdiepingen','3 étages')
it(k,96,886,200,911,'small','Perceel 5 are','Terrain 5 ares')
it(k,48,962,170,987,'h2','Constructie','Construction')
it(k,96,1014,190,1039,'small','Pannendak','Toit en tuiles')
it(k,96,1062,200,1087,'small','Gebouwd in 1978','Construit en 1978')
it(k,96,1110,230,1135,'small','Dubbel glas','Double vitrage')
# ---- commute
for k,y in (('c1',562),('c4',482),('c5',397)):
    it(k,140,y,275,y+24,'h1','Traject toevoegen','Ajouter un trajet',align='center')
    it(k,72,y+91,215,y+112,'h2','Bestemming','Adresse de destination')
it('c1',88,690,240,715,'body','Kies een bestemming','Choisir une destination')
for k in ('c2','c3'):
    it(k,70,36.7,300,61.7,'h1','Bestemming invoeren','Saisir l’adresse de destination',align='center')
    it(k,40,99,180,121,'h2','Bestemming','Adresse de destination')
it('c2',57,135.7,220,160.7,'body','Kies een bestemming','Choisir une destination')
it('c2',88,191.7,230,216.7,'h2','Mijn locatie gebruiken','Utiliser ma position')
it('c3',56,239.7,250,264.7,'body','Rue des Faisans, Brussel','Rue des Faisans, Bruxelles',colo='#ffffff',bgo='#0022cd')
it('c3',56,287.7,265,312.7,'body','Rue Faidherbe, Lille, Frankrijk','Rue Faidherbe, Lille, France')
it('c3',56,335.7,320,360.7,'body','Rue des Faînes, Brussel, België','Rue des Faînes, Bruxelles, Belgique')
it('c5',72,572.5,120,593.7,'h2','Naam','Alias')
it('c5',88,609.3,230,633.5,'body','bv. school van Gina','p. ex. école de Gina')
it('c5',90,778.3,160,802.5,'btn','Annuleren','Annuler',align='center')
it('c5',270,778.3,330,802.5,'btn','Opslaan','Enregistrer',align='center')
base=json.load(open('/home/claude/repo/cdp/ov.json'))
base.update(OV); json.dump(base,open('/home/claude/repo/cdp/ov.json','w'),ensure_ascii=False)
print({k:len(v) for k,v in OV.items()})
