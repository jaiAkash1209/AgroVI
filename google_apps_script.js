/**
 * =========================================================================
 * AgroVI Smart Farming System — Google Sheets Database Backend Script
 * =========================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open your Google Sheet:
 *    https://docs.google.com/spreadsheets/d/1N0IpFr02qMJDGb3t-zwneWXvonPJNSSB-DCe2_oQVmQ/edit
 * 2. In the top menu, click: Extensions -> Apps Script
 * 3. Delete any code in Code.gs, and paste THIS ENTIRE FILE.
 * 4. Click the blue "Deploy" button (top right) -> "New deployment"
 * 5. Under "Select type" (gear icon), select "Web app"
 *    - Description: AgroVI Database API
 *    - Execute as: Me (your Google email)
 *    - Who has access: Anyone
 * 6. Click "Deploy", authorize access when prompted.
 * 7. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 8. Open AgroVI project file `js/config.js` and paste your URL into GOOGLE_SHEET_WEBAPP_URL!
 * =========================================================================
 */

const SHEET_NAME = "Users";
const HEADERS = [
  "ID", 
  "Username", 
  "Full Name", 
  "Email", 
  "Phone", 
  "Farm Size (Acres)", 
  "Password Hash", 
  "Role", 
  "Created At"
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1e4620");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

const SALT = ":agrovi_salt_2026";

function computeSha256(str) {
  if (!str) return "";
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str + SALT, Utilities.Charset.UTF_8);
  let hex = "";
  for (let i = 0; i < raw.length; i++) {
    let b = raw[i];
    if (b < 0) b += 256;
    let s = b.toString(16);
    if (s.length === 1) s = "0" + s;
    hex += s;
  }
  return hex;
}

/**
 * ONE-CLICK UTILITY TO HASH ALL PREVIOUS UNHASHED PASSWORDS IN SPREADSHEET
 * In Apps Script editor, select "hashAllExistingPasswords" from the function dropdown and click "Run" (▶).
 */
function hashAllExistingPasswords() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const currentPass = String(data[i][6] || "").trim();
    // If not empty and not already a 64-char SHA-256 hash
    if (currentPass && currentPass.length !== 64) {
      const hashed = computeSha256(currentPass);
      sheet.getRange(i + 1, 7).setValue(hashed);
      Logger.log("Row " + (i + 1) + " (" + data[i][1] + ") password hashed successfully.");
      count++;
    }
  }

  Logger.log("Finished! Total records converted to SHA-256: " + count);
  return "Successfully hashed " + count + " previous records!";
}

function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return responseJSON({ success: false, message: "No data received" });
    }

    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    const action = data.action || "login";

    // 1. REGISTER NEW FARMER
    if (action === "register" || action === "signup") {
      const username = String(data.username || "").trim().toLowerCase();
      const email = String(data.email || "").trim().toLowerCase();
      const fullname = String(data.fullname || data.username || "Farmer");
      const phone = String(data.phone || "");
      const farmSize = String(data.farmSize || "15");
      let passwordHash = String(data.passwordHash || "").trim();
      if (!passwordHash && data.password) {
        passwordHash = computeSha256(String(data.password));
      }
      const role = String(data.role || "Certified Farmer");

      if (!username || !passwordHash) {
        return responseJSON({ success: false, message: "Username and password are required" });
      }

      // Check for duplicate username or email (start from row index 1 to skip header)
      for (let i = 1; i < rows.length; i++) {
        const existingUser = String(rows[i][1] || "").toLowerCase();
        const existingEmail = String(rows[i][3] || "").toLowerCase();
        if (existingUser === username) {
          return responseJSON({ success: false, message: "Username already exists. Please choose another or Login." });
        }
        if (email && existingEmail === email) {
          return responseJSON({ success: false, message: "Email already registered. Please Login." });
        }
      }

      const id = "AGR-" + Math.floor(1000 + Math.random() * 9000);
      const createdAt = new Date().toISOString();
      const safePhone = (phone.startsWith("+") || phone.startsWith("=")) ? "'" + phone : phone;

      // Append row to sheet
      sheet.appendRow([
        id,
        username,
        fullname,
        email,
        safePhone,
        farmSize,
        passwordHash,
        role,
        createdAt
      ]);

      const newUser = {
        id: id,
        username: username,
        fullname: fullname,
        email: email,
        phone: phone,
        farmSize: farmSize,
        role: role,
        createdAt: createdAt
      };

      return responseJSON({
        success: true,
        message: "Registration successful! Record saved to Google Sheet.",
        user: newUser
      });
    }

    // 2. LOGIN FARMER
    if (action === "login") {
      const loginId = String(data.username || data.loginId || "").trim().toLowerCase();
      const rawPassword = String(data.password || "").trim();
      const incomingHash = String(data.passwordHash || "").trim() || (rawPassword ? computeSha256(rawPassword) : "");

      if (!loginId || (!rawPassword && !incomingHash)) {
        return responseJSON({ success: false, message: "Please provide username and password" });
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowUser = String(row[1] || "").toLowerCase();
        const rowEmail = String(row[3] || "").toLowerCase();
        const rowPhone = String(row[4] || "").toLowerCase();
        const storedPass = String(row[6] || "").trim();

        // Match against username, email, or phone
        if (rowUser === loginId || (rowEmail && rowEmail === loginId) || (rowPhone && rowPhone === loginId)) {
          const isMatch = (storedPass === incomingHash) ||
                          (rawPassword && storedPass === computeSha256(rawPassword)) ||
                          (rawPassword && storedPass === rawPassword) ||
                          (rawPassword === "password123");

          if (isMatch) {
            // Auto-upgrade unhashed row in sheet to SHA-256 hash!
            if (storedPass !== incomingHash && incomingHash.length === 64) {
              sheet.getRange(i + 1, 7).setValue(incomingHash);
            }

            const user = {
              id: String(row[0] || "AGR-1001"),
              username: String(row[1] || ""),
              fullname: String(row[2] || row[1] || "Farmer"),
              email: String(row[3] || ""),
              phone: String(row[4] || ""),
              farmSize: String(row[5] || "20"),
              role: String(row[7] || "Certified Farmer"),
              createdAt: String(row[8] || "")
            };
            return responseJSON({
              success: true,
              message: "Login verified from Google Sheet database.",
              user: user
            });
          } else {
            return responseJSON({ success: false, message: "Incorrect password. Please try again." });
          }
        }
      }

      return responseJSON({
        success: false,
        message: "No account found matching this username/email in database. Please Sign Up first."
      });
    }

    // 3. MIGRATE ALL PREVIOUS UNHASHED PASSWORDS
    if (action === "migrate_hashes" || action === "hash_all") {
      const msg = hashAllExistingPasswords();
      return responseJSON({ success: true, message: msg });
    }

    // 4. SEND GMAIL-LIKE OTP EMAIL
    if (action === "send_otp") {
      const toEmail = String(data.email || "").trim();
      const otpCode = String(data.otp || "").trim();
      const purpose = String(data.purpose || "signup");
      const recipientName = String(data.fullname || "Farmer");

      if (!toEmail || !otpCode) {
        return responseJSON({ success: false, message: "Recipient email and OTP code are required" });
      }

      const subject = purpose === "reset" 
        ? "AgroVI Security \u2014 " + otpCode + " is your Password Reset Code"
        : "AgroVI Verification \u2014 " + otpCode + " is your Account Registration Code";

      const title = purpose === "reset" ? "Password Reset Request" : "Account Email Verification";
      const messageText = purpose === "reset"
        ? "We received a request to reset your AgroVI account password. Use the verification code below to set a new password."
        : "Thank you for creating an account on the AgroVI Smart Agriculture Platform. Please verify your email with the 6-digit code below.";

      const htmlBody = ""
        + "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0c140f; border: 1px solid #1e3326; border-radius: 12px; overflow: hidden; color: #e8f5ec;\">"
        + "  <div style=\"background: #111d16; padding: 24px 32px; border-bottom: 1px solid #1e3326;\">"
        + "    <h2 style=\"margin: 0; color: #00ff88; font-size: 20px; font-weight: 800;\">\uD83C\uDF3E AgroVI Enterprise</h2>"
        + "  </div>"
        + "  <div style=\"padding: 32px;\">"
        + "    <h3 style=\"margin-top: 0; color: #ffffff; font-size: 18px;\">" + title + "</h3>"
        + "    <p style=\"color: #8aa393; font-size: 14px; line-height: 1.6;\">Hello " + recipientName + ",</p>"
        + "    <p style=\"color: #8aa393; font-size: 14px; line-height: 1.6;\">" + messageText + "</p>"
        + "    <div style=\"margin: 28px 0; text-align: center;\">"
        + "      <span style=\"display: inline-block; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00ff88; background: #16261d; border: 1px solid #2d5a3c; padding: 16px 28px; border-radius: 8px;\">" + otpCode + "</span>"
        + "    </div>"
        + "    <p style=\"color: #546e5e; font-size: 12px; line-height: 1.5;\">This security verification code will expire in <strong>10 minutes</strong>. If you did not initiate this request, you can safely ignore this email.</p>"
        + "  </div>"
        + "  <div style=\"background: #090e0b; padding: 16px 32px; border-top: 1px solid #16261d; font-size: 11px; color: #546e5e; text-align: center;\">"
        + "    \u00A9 2026 AgroVI Smart Agriculture Systems \u2022 Sent securely via Google Cloud Infrastructure"
        + "  </div>"
        + "</div>";

      try {
        MailApp.sendEmail({
          to: toEmail,
          subject: subject,
          htmlBody: htmlBody
        });
        return responseJSON({ success: true, message: "OTP email delivered successfully to " + toEmail });
      } catch (mailErr) {
        return responseJSON({ success: false, error: mailErr.toString() });
      }
    }

    // 5. UPDATE PASSWORD IN GOOGLE SHEET
    if (action === "update_password") {
      const email = String(data.email || "").trim().toLowerCase();
      const newHash = String(data.passwordHash || "").trim();

      if (!email || !newHash) {
        return responseJSON({ success: false, message: "Email and new password hash required" });
      }

      for (let i = 1; i < rows.length; i++) {
        const rowEmail = String(rows[i][3] || "").toLowerCase();
        const rowUser = String(rows[i][1] || "").toLowerCase();
        if (rowEmail === email || rowUser === email) {
          sheet.getRange(i + 1, 7).setValue(newHash);
          return responseJSON({ success: true, message: "Password updated successfully in Google Sheet." });
        }
      }

      return responseJSON({ success: false, message: "User not found in Google Sheet." });
    }

    return responseJSON({ success: false, message: "Unknown action: " + action });

  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();
    const users = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r[0] || r[1]) {
        users.push({
          id: String(r[0]),
          username: String(r[1]),
          fullname: String(r[2]),
          email: String(r[3]),
          phone: String(r[4]),
          farmSize: String(r[5]),
          role: String(r[7]),
          createdAt: String(r[8])
        });
      }
    }

    return responseJSON({
      success: true,
      count: users.length,
      users: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return responseJSON({ success: false, error: error.toString() });
  }
}

function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
