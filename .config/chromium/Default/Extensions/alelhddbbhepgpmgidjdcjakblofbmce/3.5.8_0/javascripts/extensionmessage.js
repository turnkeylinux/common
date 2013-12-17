/*
 *  Extension Message Pass workers
 *  2011-11
 */

/*==For release ===*/
var RLF_ID = 'decdfngdidijkdjgbknlnepdljfaepji';
var AW_ID ='alelhddbbhepgpmgidjdcjakblofbmce';
var QN_ID ='mijlebbfndhelmdpmllgcfadlkankhok';
var DIIGO_ID='oojbgadfejifecebmdnhhkbhdjaphole';
/*==For Test ====*/

/*==For crx Test ====*/

/*==For listener other extension's setting about searchO ===*/
/*for send data format:
{
  action:'getoption' // 'setoption'
  key:'true' // 'false'
}
*/
chrome.extension.onRequestExternal.addListener(function(request, sender, sendResponse) {
    switch(request.action){
        case 'getoption':
            //var key = Prefs.get('prefs.SearchO');
            sendResponse({key:key});
            break;
        case 'setoption':
            //var key = request.key;
            //Prefs.set({'prefs.SearchO': key});
            sendResponse({message:'Awesome Screenshot is Done'});
            break;
    }
});

/*== For send searchO setting to other extension==*/
//key = 'true' or 'false'  !! type of key == String
function sendsettingtoother(key){
    chrome.extension.sendRequest(AW_ID, {action:'setoption',key:key},function(res) {console.log(res.message);});
    chrome.extension.sendRequest(QN_ID, {action:'setoption',key:key},function(res) {console.log(res.message);});
    chrome.extension.sendRequest(RLF_ID, {action:'setoption',key:key},function(res) {console.log(res.message);});
}

/*== For frist install get option==*/
//in other function set SearchO setting default is true;
function getsettingformother(){
    chrome.extension.sendRequest(AW_ID, {action:'getoption'},function(res) {if(res.key=='false'){Prefs.set({'prefs.SearchO': false});}});
    chrome.extension.sendRequest(QN_ID, {action:'getoption'},function(res) {if(res.key=='false'){Prefs.set({'prefs.SearchO': false});}});
    chrome.extension.sendRequest(RLF_ID, {action:'getoption'},function(res) {if(res.key=='false'){Prefs.set({'prefs.SearchO': false});}});
}

