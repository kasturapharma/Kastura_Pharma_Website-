/** Kastura Pharma form collector. Run setupKasturaSpreadsheet() once, then deploy as Web App. */
const SPREADSHEET_ID = ''; // Optional: paste an existing spreadsheet ID. Leave blank to create one automatically.
const SHEETS = {
  'Contact Us': ['Submitted At','Name','Email','Phone','Topic','Message','Consent','Page'],
  'Callback Requests': ['Submitted At','Name','Phone','Preferred Time','Topic','Consent','Page'],
  'Newsletter': ['Submitted At','Email','Page'],
  'Orders (Mock)': ['Submitted At','Name','Phone','Address','City','PIN','Payment Method','Items','Note','Page'],
  'Other Forms': ['Submitted At','Form Type','Payload JSON','Page']
};
function spreadsheet_(){
  const props=PropertiesService.getScriptProperties();
  let id=SPREADSHEET_ID || props.getProperty('KASTURA_SPREADSHEET_ID');
  if(!id){const ss=SpreadsheetApp.create('Kastura Pharma — Website Enquiries');id=ss.getId();props.setProperty('KASTURA_SPREADSHEET_ID',id);}
  return SpreadsheetApp.openById(id);
}
function setupKasturaSpreadsheet(){
  const ss=spreadsheet_();
  Object.entries(SHEETS).forEach(([name,headers])=>{let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.appendRow(headers);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold');});
  const first=ss.getSheets()[0];if(first.getName()==='Sheet1'&&ss.getSheets().length>1&&first.getLastRow()===0)ss.deleteSheet(first);
  Logger.log('Spreadsheet URL: '+ss.getUrl());return ss.getUrl();
}
function doGet(){return ContentService.createTextOutput(JSON.stringify({ok:true,service:'Kastura form collector'})).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  try{
    const raw=e&&e.postData&&e.postData.contents||'{}';
    const data=JSON.parse(raw);
    const ss=spreadsheet_();
    Object.entries(SHEETS).forEach(([name,headers])=>{if(!ss.getSheetByName(name)){const sh=ss.insertSheet(name);sh.appendRow(headers);sh.setFrozenRows(1);}});
    const safe=v=>String(v==null?'':v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,10000);
    const page=safe(data.page);
    let sheet,row;
    switch(data.formType){
      case 'Contact Us': sheet=ss.getSheetByName('Contact Us');row=[safe(data.submittedAt||new Date().toISOString()),safe(data.name),safe(data.email),safe(data.phone),safe(data.topic),safe(data.message),data.consent?'Yes':'No',page];break;
      case 'Callback Request':case 'Hero Callback Request': sheet=ss.getSheetByName('Callback Requests');row=[safe(data.submittedAt||new Date().toISOString()),safe(data.name),safe(data.phone),safe(data.preferredTime),safe(data.topic),data.consent?'Yes':'Not collected',page];break;
      case 'Newsletter': sheet=ss.getSheetByName('Newsletter');row=[safe(data.submittedAt||new Date().toISOString()),safe(data.email),page];break;
      case 'Checkout Order (Mock)': sheet=ss.getSheetByName('Orders (Mock)');row=[safe(data.submittedAt||new Date().toISOString()),safe(data.name),safe(data.phone),safe(data.address),safe(data.city),safe(data.pin),safe(data.paymentMethod),safe(data.items),safe(data.note),page];break;
      default: sheet=ss.getSheetByName('Other Forms');row=[safe(data.submittedAt||new Date().toISOString()),safe(data.formType||'Unknown'),safe(JSON.stringify(data)),page];
    }
    // Prevent spreadsheet formula injection from user-entered strings.
    row=row.map(v=>typeof v==='string'&&/^[=+@]/.test(v)?"'"+v:v);
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);}
}
