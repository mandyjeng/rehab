/**
 * RehabFlow Smart - 終極整合版後端腳本
 * 包含：動作清單讀取、歷史紀錄讀取、防重複更新邏輯
 */

// --- 1. 處理讀取請求 (GET) ---
function doGet(e) {
  var type = e.parameter.type; // 接收參數：?type=history 或預設
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (type === 'history') {
    // 讀取【復健記錄】分頁
    return getSheetData(ss, "復健記錄", ["date", "content"]);
  } else {
    // 預設讀取【動作清單】分頁
    return getSheetData(ss, "動作清單", ["id", "name", "category", "isUnilateral", "mode", "defaultUnit", "defaultQuantity"]);
  }
}

// 輔助函式：將分頁轉為 JSON
function getSheetData(ss, sheetName, keys) {
  var sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
  var data = sheet.getDataRange().getDisplayValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    keys.forEach(function(key, index) {
      var val = data[i][index];
      // 特殊處理布林值 (針對單側運動)
      if (key === 'isUnilateral') {
        val = (val === "TRUE" || val === "true" || val === "是" || val === true);
      }
      obj[key] = val;
    });
    result.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- 2. 處理寫入請求 (POST) ---
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 取得寫入權限，避免多人同時寫入出錯
    lock.waitLock(10000); 

    var data = JSON.parse(e.postData.contents);
    var targetDate = data.date.toString().trim(); // 前端傳來的 "2026-02-04"
    var newContent = data.content;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("復健記錄") || ss.getSheets()[0];

    // 強效防重複比對：使用顯示值 (DisplayValues)
    var displayValues = sheet.getDataRange().getDisplayValues();
    var foundRow = -1;

    for (var i = 1; i < displayValues.length; i++) {
      var rowDateText = displayValues[i][0].toString().trim();
      // 只要格子文字包含 "2026-02-04" 就視為同一天
      if (rowDateText.indexOf(targetDate) !== -1) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > -1) {
      // 更新現有列
      sheet.getRange(foundRow, 2).setValue(newContent);
      return ContentService.createTextOutput("SUCCESS: Updated Row " + foundRow);
    } else {
      // 新增一列 (確保日期欄位存入的是純文字字串，防止 Sheet 自動轉格式)
      sheet.appendRow([targetDate, newContent]);
      // 額外保險：將新增的那一格強制設為文字格式
      sheet.getRange(sheet.getLastRow(), 1).setNumberFormat('@');
      return ContentService.createTextOutput("SUCCESS: Inserted New Row");
    }

  } catch (error) {
    return ContentService.createTextOutput("ERROR: " + error.toString());
  } finally {
    lock.releaseLock();
  }
}