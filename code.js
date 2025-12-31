// SPREADSHEET_ID = "1nvgIAOcW_Zpwvv1KBCzK-5U11Mv3IFzLTgQMcgLp_R0"; 

/**
 * 🏆 O-NET M.6 MANAGEMENT SYSTEM v12.0 (Ultimate Final)
 * พัฒนาโดย: นายภัทรพล แก้วเสนา ศึกษานิเทศก์
 */

// ⚠️ [TAG: WARNING] ใส่ ID ของ Google Sheet ตรงนี้
var SPREADSHEET_ID = "1nvgIAOcW_Zpwvv1KBCzK-5U11Mv3IFzLTgQMcgLp_R0"; 

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
      .setTitle('ระบบบริหารจัดการสอบ O-NET ม.6')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==========================================
// 🔐 PART 1: AUTHENTICATION
// ==========================================
function userLogin(formObject) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Users");
    // ดึงข้อมูลถึงคอลัมน์ F (Status)
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
    var username = formObject.username.toString().trim();
    var password = formObject.password.toString().trim();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0].toString() == username && data[i][1].toString() == password) {
        
        // ⚠️ [TAG: SECURITY] เช็คสถานะ Active
        var status = data[i][5] ? data[i][5].toString() : 'Active';
        if(status === 'Inactive') {
           return { status: 'error', message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อ Admin' };
        }

        var safeRole = data[i][2].toString().toLowerCase().trim();
        return {
          status: 'success', 
          username: data[i][0], 
          role: safeRole, 
          name: data[i][3], 
          filterId: data[i][4]
        };
      }
    }
    return { status: 'error', message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
  } catch (e) { return { status: 'error', message: 'System Error: ' + e.toString() }; }
}

// ==========================================
// 🏫 PART 2: SCHOOL DATA FETCHING
// ==========================================
function getSchoolData(filterId) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("SchoolInfo");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() == filterId.toString()) {
        return { status: 'success', id: data[i][0], name: data[i][1], director: data[i][2], phone: data[i][3] };
      }
    }
    return { status: 'notfound', message: 'ไม่พบข้อมูลทั่วไป' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function getExamDetails(filterId) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("ExamDetails");
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() == filterId.toString()) {
        return { status: 'success', rooms: data[i][1], students: data[i][2], teachers: data[i][3], spec: data[i][4] };
      }
    }
    return { status: 'notfound', message: 'ยังไม่มีข้อมูลสนามสอบ' };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function getBudgetDetails(filterId) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Budget");
    var data = sheet.getDataRange().getValues();
    var result = [];
    var total = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() == filterId.toString()) {
        var amount = parseFloat(data[i][2]) || 0;
        result.push({ item: data[i][1], amount: amount, status: data[i][3], remark: data[i][4] });
        total += amount;
      }
    }
    return { status: 'success', items: result, total: total };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

// ==========================================
// 📁 PART 3: DOCUMENT MANAGEMENT
// ==========================================
function getDocuments(userRole) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Documents");
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var target = data[i][4].toString().toLowerCase();
      var isAllowed = false;
      if (target === 'all') isAllowed = true;
      else if (target === 'school' && (userRole === 'school' || userRole === 'admin')) isAllowed = true;
      else if (target === 'admin' && userRole === 'admin') isAllowed = true;
      
      if (isAllowed) {
        result.push({ id: data[i][0], name: data[i][1], category: data[i][2], link: data[i][3], target: target });
      }
    }
    return { status: 'success', items: result };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function addDocument(docObj) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Documents");
    var newId = 'D-' + new Date().getTime().toString().substr(-8);
    sheet.appendRow([newId, docObj.name, docObj.category, docObj.link, docObj.target]);
    return { status: 'success' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function deleteDocument(docId) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Documents");
    var data = sheet.getDataRange().getValues();
    for(var i=1; i<data.length; i++){
       if(data[i][0].toString() == docId.toString()) {
          sheet.deleteRow(i+1);
          return { status: 'success' };
       }
    }
    return { status: 'error', message: 'ไม่พบเอกสารนี้' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

// ==========================================
// 👑 PART 4: ADMIN DASHBOARD (STATS)
// ==========================================
function getAdminStats() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var schoolSheet = ss.getSheetByName("SchoolInfo");
    var totalSchools = (schoolSheet.getLastRow() > 1) ? schoolSheet.getLastRow() - 1 : 0;

    var examSheet = ss.getSheetByName("ExamDetails");
    var totalStudents = 0, totalRooms = 0, totalTeachers = 0;
    if (examSheet.getLastRow() > 1) {
      var data = examSheet.getRange(2, 1, examSheet.getLastRow() - 1, 5).getValues();
      for (var i = 0; i < data.length; i++) {
        totalRooms += parseInt(data[i][1]) || 0;
        totalStudents += parseInt(data[i][2]) || 0;
        totalTeachers += parseInt(data[i][3]) || 0;
      }
    }

    var budgetSheet = ss.getSheetByName("Budget");
    var totalBudget = 0;
    if (budgetSheet.getLastRow() > 1) {
       var bData = budgetSheet.getRange(2, 3, budgetSheet.getLastRow() - 1, 1).getValues();
       for (var j = 0; j < bData.length; j++) totalBudget += parseFloat(bData[j][0]) || 0;
    }
    return { status: 'success', schools: totalSchools, students: totalStudents, rooms: totalRooms, teachers: totalTeachers, budget: totalBudget };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function getAllExamDetailsForAdminTable() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var schoolSheet = ss.getSheetByName("SchoolInfo");
    var schoolData = schoolSheet.getDataRange().getValues();
    var schoolMap = {};
    for (var i = 1; i < schoolData.length; i++) schoolMap[schoolData[i][0].toString()] = schoolData[i][1].toString();

    var examSheet = ss.getSheetByName("ExamDetails");
    var examData = examSheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < examData.length; i++) {
      var schoolId = examData[i][0].toString();
      result.push({
        id: schoolId, name: schoolMap[schoolId] ? schoolMap[schoolId] : ('ID: ' + schoolId),
        rooms: parseInt(examData[i][1]) || 0,
        students: parseInt(examData[i][2]) || 0,
        teachers: parseInt(examData[i][3]) || 0
      });
    }
    return { status: 'success', data: result };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

function getAllBudgetsForAdminTable() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var schoolSheet = ss.getSheetByName("SchoolInfo");
    var schoolData = schoolSheet.getDataRange().getValues();
    var schoolMap = {};
    for (var i = 1; i < schoolData.length; i++) schoolMap[schoolData[i][0].toString()] = schoolData[i][1].toString();

    var budgetSheet = ss.getSheetByName("Budget");
    var budgetData = budgetSheet.getDataRange().getValues();
    var summary = {}; 
    for (var i = 1; i < budgetData.length; i++) {
      var schoolId = budgetData[i][0].toString();
      var amount = parseFloat(budgetData[i][2]) || 0;
      if (!summary[schoolId]) summary[schoolId] = { total: 0, count: 0 };
      summary[schoolId].total += amount;
      summary[schoolId].count += 1;
    }
    var result = [];
    for (var id in summary) {
      result.push({ id: id, name: schoolMap[id] ? schoolMap[id] : ('ID: ' + id), total: summary[id].total, count: summary[id].count });
    }
    return { status: 'success', data: result };
  } catch (e) { return { status: 'error', message: e.toString() }; }
}

// ==========================================
// 🛠️ PART 5: USER & SETTINGS MANAGEMENT
// ==========================================
function getAllUsers() {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Users");
    var data = sheet.getDataRange().getValues();
    var users = [];
    for(var i=1; i<data.length; i++){
       var status = (data[i][5]) ? data[i][5].toString() : 'Active'; 
       users.push({ row: i+1, username: data[i][0], password: data[i][1], role: data[i][2], name: data[i][3], filterId: data[i][4], status: status });
    }
    return { status: 'success', users: users };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function toggleUserStatus(username, currentStatus) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Users");
    var data = sheet.getDataRange().getValues();
    for(var i=1; i<data.length; i++){
       if(data[i][0].toString() == username.toString()) {
          var newStatus = (currentStatus === 'Active') ? 'Inactive' : 'Active';
          sheet.getRange(i+1, 6).setValue(newStatus);
          return { status: 'success', newStatus: newStatus };
       }
    }
    return { status: 'error', message: 'User not found' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function addUser(userObj) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("Users");
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
      for(var i=0; i<data.length; i++){
         if(data[i][0].toString() === userObj.username.toString()) {
             return { status: 'error', message: 'Username นี้มีอยู่ในระบบแล้ว' };
         }
      }
    }
    sheet.appendRow([userObj.username, userObj.password, userObj.role, userObj.name, userObj.filterId, 'Active']);
    return { status: 'success' };
  } catch(e) { return { status: 'error', message: 'System Error: ' + e.toString() }; }
}

function deleteUser(username) {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Users");
    var data = sheet.getDataRange().getValues();
    for(var i=1; i<data.length; i++){
       if(data[i][0] == username) {
          sheet.deleteRow(i+1);
          return { status: 'success' };
       }
    }
    return { status: 'error', message: 'ไม่พบผู้ใช้นี้' };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function getSystemSettings() {
  try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Settings");
    var data = sheet.getDataRange().getValues();
    var settings = [];
    for(var i=1; i<data.length; i++){ settings.push({ key: data[i][0], value: data[i][1] }); }
    return { status: 'success', settings: settings };
  } catch(e) { return { status: 'error', message: e.toString() }; }
}

function saveSystemSettings(settingsArray) {
   try {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Settings");
    if(sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow()-1, 2).clearContent();
    var rows = settingsArray.map(function(s){ return [s.key, s.value]; });
    if(rows.length > 0) sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    return { status: 'success' };
   } catch(e) { return { status: 'error', message: e.toString() }; }
}
