/**
 * Docsi kopeerimine (Highlighter) – ainult see tööriist.
 * Lisa dokumendid selles järjekorras, kuidas soovid neid vormis näha.
 *
 * Copy-to-Docs (Highlighter) – this tool only. Add documents in the order you want them in the form.
 */
var DOC_IDS = {
  'Dokumendi1 nimi, mida soovid vormis välja kuvada': 'XXXXXXXXXXXX',
  'Dokumendi2 nimi, mida soovid vormis välja kuvada': 'XXXXXXXXXXXXX'
  // Key = label shown in dropdown; value = Google Doc ID from the document URL.
};

/**
 * Tagastab vormi, kui Web app URL avatakse (valikuline ?url=...&text=... järjehoidjast).
 * Serves the form when the Web app URL is opened (with optional ?url=...&text=... from bookmarklet).
 */
function doGet(e) {
  e = e || {};
  var params = e.parameter || {};
  var initialUrl = (params.url || '').toString();
  var initialText = (params.text || '').toString();
  var html = HtmlService.createHtmlOutput(getFormHtml(initialUrl, initialText))
    .setTitle('Lisa lõik Docsi')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

/** Escapib stringi turvaliseks kasutamiseks JavaScripti stringis HTML-is.
 *  Escapes a string for safe use inside a JavaScript string in HTML.
 */
function escapeForScript(s) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

/**
 * Teisendab komaeraldatud märksõnad Docsi vormingusse: "AI, keel" → "#AI #keel".
 * Converts comma-separated tags to Doc format: "AI, keel" → "#AI #keel".
 */
function normalizeTags(input) {
  if (!input || !input.trim()) return '';
  var parts = input.split(',');
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    var tag = parts[i].trim();
    if (!tag) continue;
    if (tag.indexOf('#') !== 0) tag = '#' + tag;
    result.push(tag);
  }
  return result.join(' ');
}

/**
 * Koostab HTML-vormi; rippmenüü valikud tulevad DOC_IDS-st (järjekord = võtmete järjekord).
 * Builds the HTML form. Dropdown options are generated from DOC_IDS (order = object key order).
 */
function getFormHtml(initialUrl, initialText) {
  var safeUrl = escapeForScript(initialUrl);
  var safeText = escapeForScript(initialText);
  var docOptions = '';
  var keys = Object.keys(DOC_IDS);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var safeVal = (key || '').replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/&/g, '&amp;');
    var safeLabel = (key || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
    docOptions += '<option value="' + safeVal + '">' + safeLabel + '</option>';
  }
  return '<!DOCTYPE html><html><head><base target="_top"><meta charset="utf-8">' +
    '<style>body{font-family:sans-serif;max-width:560px;margin:20px;}label{display:block;margin-top:12px;font-weight:600;}input,textarea,select{width:100%;padding:8px;box-sizing:border-box;}textarea{min-height:120px;resize:vertical;}button{margin-top:16px;padding:10px 20px;cursor:pointer;}#msg{margin-top:12px;color:#0d6;}#msg.err{color:#c00;}</style></head><body>' +
    '<h2>Lisa lõik Docsi</h2><label>Kuhu</label><select id="doc">' + docOptions + '</select>' +
    '<label>Lõigu tekst</label><textarea id="text" placeholder="Kleebi siia valitud tekst..."></textarea>' +
    '<label>Allika link</label><input type="url" id="url" placeholder="https://...">' +
    '<label>#märksõnad</label><input type="text" id="tags" placeholder="AI, keel, õpetamine">' +
    '<button type="button" id="btn">Lisa Docsi</button><div id="msg"></div>' +
    '<script>var __initialUrl="' + safeUrl + '";var __initialText="' + safeText + '";(function(){if(__initialUrl){document.getElementById("url").value=__initialUrl;}if(__initialText){document.getElementById("text").value=__initialText;}' +
    'document.getElementById("btn").onclick=function(){var text=document.getElementById("text").value.trim(),url=document.getElementById("url").value.trim(),tags=document.getElementById("tags").value.trim(),docKey=document.getElementById("doc").value,msg=document.getElementById("msg");msg.textContent="";msg.className="";if(!text&&!url){msg.textContent="Lisa vähemalt tekst või link.";msg.className="err";return;}google.script.run.withSuccessHandler(function(){msg.textContent="Lisatud.";msg.className="";document.getElementById("text").value="";}).withFailureHandler(function(err){msg.textContent="Viga: "+(err.message||err);msg.className="err";}).appendToDoc(text,url,tags,docKey);};})();</script></body></html>';
}

/** Tagastab lõigust lingi URL-i (kui on); muidu null.
 *  Returns the URL from a paragraph if it contains a link (whole element or per-offset); otherwise null.
 */
function getLinkUrlFromParagraph(p) {
  for (var j = 0; j < p.getNumChildren(); j++) {
    var te = p.getChild(j);
    if (te.getType() !== DocumentApp.ElementType.TEXT) continue;
    var textEl = te.asText();
    var linkUrl = textEl.getLinkUrl();
    if (linkUrl) return linkUrl.trim();
    var len = textEl.getText().length;
    for (var offset = 0; offset < len; offset++) {
      linkUrl = textEl.getLinkUrl(offset);
      if (linkUrl) return linkUrl.trim();
    }
  }
  return null;
}

/** Leiab body lapsindeksi lõigule, mis sisaldab antud URL-iga „Allikas: [link]” rida. Tagastab -1, kui ei leia.
 *  Finds the body child index of the paragraph that contains "Allikas: [link]" with the given url. Returns -1 if not found.
 */
function findParagraphIndexWithLink(body, url) {
  if (!url) return -1;
  var u = url.trim();
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    var linkUrl = getLinkUrlFromParagraph(el.asParagraph());
    if (linkUrl === u) return i;
  }
  return -1;
}

/**
 * Eemaldab korduvad "Allikas" read. Käivita script.redaktorist: puhastaKorduvadAllikad('key').
 * Removes duplicate "Allikas" (source) paragraphs – keeps one per URL. Run from script editor: puhastaKorduvadAllikad('yourDocKey').
 */
function puhastaKorduvadAllikad(docKey) {
  docKey = docKey || 'secondBrain';
  var docId = DOC_IDS[docKey];
  if (!docId) throw new Error('Tundmatu doc: ' + docKey);
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var n = body.getNumChildren();
  var allikasByUrl = {}; // url -> [indices of paragraphs with that link]
  for (var i = 0; i < n; i++) {
    var el = body.getChild(i);
    if (el.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    var url = getLinkUrlFromParagraph(el.asParagraph());
    if (!url) continue;
    if (!allikasByUrl[url]) allikasByUrl[url] = [];
    allikasByUrl[url].push(i);
  }
  var toRemove = [];
  for (var u in allikasByUrl) {
    var indices = allikasByUrl[u];
    if (indices.length <= 1) continue;
    indices.sort(function(a, b) { return a - b; });
    for (var k = 0; k < indices.length - 1; k++) toRemove.push(indices[k]);
  }
  toRemove.sort(function(a, b) { return b - a; });
  for (var r = 0; r < toRemove.length; r++) {
    body.getChild(toRemove[r]).removeFromParent();
  }
  doc.saveAndClose();
  return 'Eemaldatud ' + toRemove.length + ' korduvat allikat.';
}

/**
 * Lisab lõigu valitud dokumenti. Kui sama URL juba eksisteerib (olemasolev „Allikas” rida),
 * lisatakse uus lõik enne seda; vastasel juhul lisatakse dokumendi algusesse (tekst, sildid, „Allikas: url”).
 * Appends the snippet to the chosen document. If the same URL already exists (existing "Allikas" row),
 * inserts the new block before it; otherwise inserts at the top (text, tags, "Allikas: url").
 */
function appendToDoc(text, url, tags, docKey) {
  var docId = DOC_IDS[docKey];
  if (!docId) throw new Error('Tundmatu doc: ' + docKey);
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var lines = (text || '').trim().split('\n').filter(function(l) { return l.length > 0; });
  var textLines = lines.length === 0 ? ['(tekst puudub)'] : lines;
  var tagsStr = normalizeTags(tags || '');
  var idx = findParagraphIndexWithLink(body, url);
  if (idx >= 0) {
    // Same article – insert new block before existing "Allikas" row
    body.insertParagraph(idx, '');
    if (tagsStr) body.insertParagraph(idx, tagsStr);
    for (var i = textLines.length - 1; i >= 0; i--) body.insertParagraph(idx, textLines[i]);
  } else {
    // New article – insert at top: text, tags, "Allikas: url", blank line
    body.insertParagraph(0, '');
    var linkP = body.insertParagraph(0, '');
    linkP.appendText('Allikas: ');
    if (url && url.trim()) linkP.appendText(url.trim()).setLinkUrl(url.trim());
    else linkP.appendText('—');
    if (tagsStr) body.insertParagraph(0, tagsStr);
    for (var i = textLines.length - 1; i >= 0; i--) body.insertParagraph(0, textLines[i]);
  }
  doc.saveAndClose();
  return 'OK';
}
