
## Mis see on?
**Highlighter** võimaldab brauseris artiklit lugedes **valitud lõigu** (highlighted) mugavalt **kopeerida oma Google Docsi** koos allika lingiga ja #märksõnadega. Kasutab **järjehoidja ribal olevat bookmarkleti** ja **Google Apps Script**.

## Protsess
- Loed artiklit → valid teksti → klõpsad järjehoidjat → dialoog „Lisa see lõik Docsi?” → "Jah" avab vormi → valid dokumendi ja vajuta „Lisa Docsi”.
- Mul läks vaja kahte erinevat dokumenti, seega saad valida mitut sihtdokumenti.
- Hiljem on võimalik sama artikli lõigud ühe allika alla viia; iga lõik võib omada oma #märksõnu.

### Vajalikud failid

- **Code.gs** – kogu loogika (vorm, lisamine Docsi, korduvate allikate puhastamine). See läheb Google Apps Scripti.
- **capture-bookmarklet.js** – järjehoidja kood (üks pikk rida). Kopeerid selle brauseri järjehoidja aadressiks.

## Kuidas saad ise kasutada?
### 1. Drive dokumendid ja DOC ID

Ostusta, milliseid dokumente oma Google Drivest kasutada või loo need. Siis ava iga dokument brauseris
URL on kujul  `https://docs.google.com/document/d/XXXXXXXXXX/edit`  
Dokumendi ID on kohas - **XXXXXXXXXX** (see on Doc ID), seda läheb hiljem vaja. Jah, see ongi sigri-migri stiilis: Q54rjlESTroo4 jne
<img width="930" height="47" alt="Kuvatõmmis 2026-03-12 104127" src="https://github.com/user-attachments/assets/01a3fd8c-d2b0-4202-bd4f-5a42370610cc" />

### 3. Google Apps Script

- Mine [script.google.com](https://script.google.com).
- Klikka **New project** (Uus projekt).
  <img width="1169" height="324" alt="image" src="https://github.com/user-attachments/assets/f675ef26-1fec-4e3c-a84a-0d0af51bea30" />
- Nüüd peaks avanema selline vaatepilt:
<img width="1499" height="627" alt="image" src="https://github.com/user-attachments/assets/2175420e-e09b-43ee-9995-8e685efa79da" />
- _Untitled project_ nimeta ümber endale sobivalt
- Kustuta seal olev kood ja kopeeri sinna **kogu** faili **Code.gs** sisu.
- Nüüd asenda **Code.gs** faili alguses asenda oma Doc ID-d:
  'var DOC_IDS = {
  'Dokumendi1 nimi, mida soovid vormis välja kuvada': 'XXXXXXXXXXXX',
  'Dokumendi2 nimi, mida soovid vormis välja kuvada': 'XXXXXXXXXXXXX'
};'

-- Kui soovid ainult ühte, siis kustuta teine ära. Kui soovid mitut, siis lisa juurde nii, et *kõigi taga on _koma_, va viimase taga.

### 4. Web app (vormi) avaldamine

- **Deploy** → **New deployment** → tüübiks **Web app**.
- **Execute as**: Me (sinu konto).
- **Who has access**: Only myself.
- **Deploy** → kopeeri **Web app URL** (lõpeb tavaliselt `/exec`).

#### Kui edasipidi teed koodis parandusi:
- siis uuendamiseks vajuta **Deploy** -> **Manage Deployments**
- nüüd vajuta **pliiats** -> **New version** -> **Deploy**
<br><img width="668" height="444" alt="image" src="https://github.com/user-attachments/assets/4d6c4d7c-b1f7-4c46-be22-f878b577c420" />

### 5. Järjehoidja

- Ava fail **capture-bookmarklet.js**.
- Asenda 4. real **YOUR_WEB_APP_URL** oma Web app URLiga (jutumärkide sees).
- Kopeeri **kogu 4. rida** (alates `javascript:(function(){` kuni `})();`).
- Brauseris: järjehoidjate ribal paremklõps → **Lisa leht** (või Add bookmark).
- **Aadress**: kleepi see kopeeritud rida. **Nimi**: nt „Docsi kopeerimine”.

