/**
 * Dulaney wedding — RSVP backend (Google Apps Script)
 * =====================================================================
 * Stores RSVPs in a Google Sheet the couple owns, and powers:
 *   • guests adding / updating their reply (+ who's coming with them)
 *   • the public "who's coming" list on the site
 *   • the password-protected Hosts admin (edit / remove / CSV)
 *
 * The admin password is checked HERE (on Google's servers), so it is NOT
 * exposed in the website's code.
 *
 * ── ONE-TIME SETUP (about 5 minutes) ─────────────────────────────────
 *  1. Create a new Google Sheet (sheets.new). This is the guest list the
 *     couple can open any time. Rename the first tab to "RSVPs".
 *  2. Extensions → Apps Script. Delete the sample code, paste THIS file.
 *  3. Set ADMIN_PASSWORD below to the password you'll give the couple.
 *  4. Click Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *     Deploy, authorize, and COPY the Web app URL (ends in /exec).
 *  5. In assets/app.js set  RSVP_ENDPOINT = "that /exec URL".  Done.
 *
 *  To change the password later: edit ADMIN_PASSWORD, then
 *  Deploy → Manage deployments → edit (pencil) → Version: New → Deploy.
 * ─────────────────────────────────────────────────────────────────────
 */

var ADMIN_PASSWORD = "CHANGE-ME";       // the password you hand the couple
var SHEET_NAME     = "RSVPs";
var HEADERS = ["id", "name", "email", "attending", "party", "companions", "note", "updated"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var req = JSON.parse(e.postData.contents || "{}");
    var action = req.action;
    if (action === "submit") return json(submit_(req.record));
    if (action === "list")   return json({ ok: true, guests: publicList_() });
    if (action === "admin")  return adminGuard_(req.password, function () { return { ok: true, guests: allRows_() }; });
    if (action === "update") return adminGuard_(req.password, function () { return update_(req.id, req.fields); });
    if (action === "remove") return adminGuard_(req.password, function () { return remove_(req.id); });
    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Allow a simple GET (e.g. the public list) too.
function doGet(e) {
  return json({ ok: true, guests: publicList_() });
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function allRows_() {
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    rows.push({
      id: String(r[0]), name: r[1], email: r[2], attending: r[3],
      party: Number(r[4]) || 0,
      companions: r[5] ? String(r[5]).split(";").map(function (s) { return s.trim(); }).filter(Boolean) : [],
      note: r[6], updated: r[7]
    });
  }
  return rows;
}

function publicList_() {
  return allRows_().filter(function (g) { return g.attending === "yes"; })
    .map(function (g) { return { name: g.name, party: g.party, companions: g.companions }; });
}

function submit_(rec) {
  if (!rec || !rec.email) return { ok: false, error: "email required" };
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  var rowIndex = -1, id = "";
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][2]).toLowerCase() === String(rec.email).toLowerCase()) { rowIndex = i + 1; id = values[i][0]; break; }
  }
  if (!id) id = Utilities.getUuid();
  var row = [
    id, rec.name || "", rec.email, rec.attending || "no",
    Number(rec.party) || 0, (rec.companions || []).join("; "), rec.note || "",
    new Date().toISOString()
  ];
  if (rowIndex > 0) sh.getRange(rowIndex, 1, 1, HEADERS.length).setValues([row]);
  else sh.appendRow(row);
  return { ok: true };
}

function update_(id, fields) {
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      var row = values[i];
      if (fields.attending != null) row[3] = fields.attending;
      if (fields.party != null) row[4] = Number(fields.party) || 0;
      if (fields.companions != null) row[5] = (fields.companions || []).join("; ");
      if (fields.note != null) row[6] = fields.note;
      if (fields.name != null) row[1] = fields.name;
      row[7] = new Date().toISOString();
      sh.getRange(i + 1, 1, 1, HEADERS.length).setValues([row]);
      break;
    }
  }
  return { ok: true, guests: allRows_() };
}

function remove_(id) {
  var sh = sheet_();
  var values = sh.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) sh.deleteRow(i + 1);
  }
  return { ok: true, guests: allRows_() };
}

function adminGuard_(password, fn) {
  if (password !== ADMIN_PASSWORD) return json({ ok: false, error: "bad password" });
  return json(fn());
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
