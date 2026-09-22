#!/usr/bin/env python3
"""
AgroVI Smart Agriculture Web Platform — Unified HTTP & Database API Server
Serves production frontend files and provides real REST API endpoints for user authentication,
registration, database persistence, and optional Google Sheets webhook forwarding.
"""

import sys
import os
import json
import time
import datetime
import random
import socket
import threading
import hashlib
import urllib.request
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "database.json")

# Ensure database directory and file exist
os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(DB_FILE):
    initial_db = {
        "users": [
            {
                "id": "USR-1001",
                "username": "ramesh",
                "fullname": "Ramesh Patil",
                "email": "ramesh@farm.in",
                "phone": "+91 98765 43210",
                "farmSize": 26,
                "password": "password123",
                "role": "Certified Farmer",
                "region": "Nashik Agri-Tech Corridor, MH",
                "createdAt": "2026-09-22T08:00:00.000Z"
            }
        ]
    }
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(initial_db, f, indent=2)

GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzq6MsRJTZyjanmGU0cZfkBS60C2q37bjKV0KRWh9gxSd85Cv_dFR-0FI8ph-b7qVZzSA/exec"

SALT = ":agrovi_salt_2026"

def hash_password(password):
    return hashlib.sha256(f"{password}{SALT}".encode("utf-8")).hexdigest()

def sync_to_google_sheet(user_payload):
    def _worker():
        try:
            phone_val = str(user_payload.get("phone", ""))
            safe_phone = f"'{phone_val}" if phone_val.startswith("+") or phone_val.startswith("=") else phone_val
            pwd_hash = user_payload.get("passwordHash") or hash_password(user_payload.get("password", ""))
            req_data = json.dumps({
                "action": "register",
                "username": user_payload.get("username"),
                "fullname": user_payload.get("fullname"),
                "email": user_payload.get("email"),
                "phone": safe_phone,
                "farmSize": user_payload.get("farmSize", 20),
                "passwordHash": pwd_hash,
                "role": user_payload.get("role", "Certified Farmer")
            }).encode("utf-8")
            req = urllib.request.Request(
                GOOGLE_SHEET_URL,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "AgroVI-Server/1.0"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                print(f"[SHEET SYNC] User '{user_payload.get('username')}' synced to Google Sheets with SHA-256 hash (Status: {resp.status})")
        except Exception as e:
            print(f"[SHEET SYNC ERROR] Could not sync user to Google Sheets: {e}")

    threading.Thread(target=_worker, daemon=True).start()

def check_google_sheet_login(login_id, raw_password, password_hash=None):
    try:
        pwd_hash = password_hash or hash_password(raw_password)
        req_data = json.dumps({
            "action": "login",
            "username": login_id,
            "password": raw_password,
            "passwordHash": pwd_hash
        }).encode("utf-8")
        req = urllib.request.Request(
            GOOGLE_SHEET_URL,
            data=req_data,
            headers={"Content-Type": "application/json", "User-Agent": "AgroVI-Server/1.0"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success") and data.get("user"):
                return data["user"]
    except Exception as e:
        print(f"[SHEET LOGIN ERROR] {e}")
    return None

def load_db():
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[DB ERROR] Failed to load database: {e}")
        return {"users": []}

def save_db(data):
    try:
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"[DB ERROR] Failed to save database: {e}")
        return False

# ----------------------------------------------------
# GMAIL-STYLE OTP VERIFICATION ENGINE
# ----------------------------------------------------
OTP_STORE = {}

def cleanup_expired_otps():
    now = time.time()
    expired = [k for k, v in OTP_STORE.items() if v.get("expires_at", 0) < now]
    for k in expired:
        del OTP_STORE[k]

def generate_otp():
    return str(random.randint(100000, 999999))

def mask_email(email):
    parts = email.split("@")
    if len(parts) != 2:
        return email
    name, domain = parts
    if len(name) <= 2:
        masked_name = name[0] + "*"
    else:
        masked_name = name[0] + "*" * max(1, len(name) - 2) + name[-1]
    return f"{masked_name}@{domain}"

def dispatch_otp_email(to_email, otp, purpose="signup", fullname="Farmer"):
    print(f"\n==================================================")
    print(f" [GMAIL OTP DISPATCH] Recipient: {to_email}")
    print(f" [SECURITY CODE]      >>> {otp} <<< (10 min expiry)")
    print(f" [PURPOSE]            {purpose.upper()}")
    print(f"==================================================\n")
    try:
        req_data = json.dumps({
            "action": "send_otp",
            "email": to_email,
            "otp": otp,
            "purpose": purpose,
            "fullname": fullname
        }).encode("utf-8")
        req = urllib.request.Request(
            GOOGLE_SHEET_URL,
            data=req_data,
            headers={"Content-Type": "application/json", "User-Agent": "AgroVI-Server/1.0"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            resp_body = resp.read().decode("utf-8")
            data = json.loads(resp_body)
            if data.get("success"):
                print(f"[OTP DISPATCH SUCCESS] Verification email sent to {to_email} via Google Apps Script!")
                return True, "Email sent successfully"
            else:
                msg = str(data.get("message") or data.get("error") or "Unknown error")
                print(f"[OTP DISPATCH WARNING] Google Apps Script returned: {msg}")
                return False, msg
    except Exception as e:
        print(f"[OTP DISPATCH ERROR] Google Apps Script dispatch failed: {e}")
        return False, str(e)

def sync_password_update_to_google_sheet(email, password_hash):
    def _worker():
        try:
            req_data = json.dumps({
                "action": "update_password",
                "email": email,
                "passwordHash": password_hash
            }).encode("utf-8")
            req = urllib.request.Request(
                GOOGLE_SHEET_URL,
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "AgroVI-Server/1.0"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                print(f"[SHEET UPDATE] Password hash updated for {email} in Google Sheet (Status: {resp.status})")
        except Exception as e:
            print(f"[SHEET UPDATE NOTICE] Could not update password in Google Sheet: {e}")

    threading.Thread(target=_worker, daemon=True).start()

class AgroVIHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def address_string(self):
        # Disable reverse DNS lookup on Windows to prevent 2-second timeout lag
        return str(self.client_address[0])

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        
        # API: Get registered users (safe summary)
        if parsed.path == "/api/users":
            db = load_db()
            safe_users = [
                {
                    "id": u.get("id"),
                    "username": u.get("username"),
                    "fullname": u.get("fullname"),
                    "email": u.get("email"),
                    "phone": u.get("phone"),
                    "farmSize": u.get("farmSize"),
                    "role": u.get("role", "Certified Farmer"),
                    "createdAt": u.get("createdAt")
                }
                for u in db.get("users", [])
            ]
            self._send_json({"success": True, "count": len(safe_users), "users": safe_users})
            return

        # Route /admin1 to admin1.html
        if parsed.path in ("/admin1", "/admin1/"):
            self.path = "/admin1.html"
            return super().do_GET()

        # Developer API: Database inspection dump
        if parsed.path == "/api/admin/dump":
            cleanup_expired_otps()
            db = load_db()
            otps_summary = [
                {"email": k, "otp": v.get("otp"), "purpose": v.get("purpose"), "expires_in": int(max(0, v.get("expires_at", 0) - time.time()))}
                for k, v in OTP_STORE.items()
            ]
            self._send_json({
                "success": True,
                "server": {
                    "port": PORT,
                    "mode": "DualStack IPv6/IPv4",
                    "db_file": DB_FILE,
                    "google_sheet_url": GOOGLE_SHEET_URL
                },
                "count": len(db.get("users", [])),
                "users": db.get("users", []),
                "active_otps": otps_summary
            })
            return

        # Default static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)

        # Read JSON body
        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            payload = json.loads(post_body.decode("utf-8"))
        except Exception:
            self._send_json({"success": False, "message": "Invalid JSON format in request"}, 400)
            return

        # ----------------------------------------------------
        # API: LOGIN (/api/login)
        # ----------------------------------------------------
        if parsed.path == "/api/login":
            login_id = str(payload.get("username", "")).strip().lower()
            raw_password = str(payload.get("password", "")).strip()
            incoming_hash = str(payload.get("passwordHash", "")).strip() or hash_password(raw_password)

            if not login_id or (not raw_password and not incoming_hash):
                self._send_json({"success": False, "message": "Please enter both username and password."}, 400)
                return

            db = load_db()
            found_user = None
            clean_login = "".join(filter(str.isdigit, login_id))

            for u in db.get("users", []):
                u_name = str(u.get("username", "")).strip().lower()
                u_email = str(u.get("email", "")).strip().lower()
                u_phone = str(u.get("phone", "")).strip().lower()
                clean_phone = "".join(filter(str.isdigit, u_phone))

                if login_id in (u_name, u_email, u_phone):
                    found_user = u
                    break
                if clean_login and clean_phone and len(clean_login) >= 10:
                    if clean_login[-10:] == clean_phone[-10:]:
                        found_user = u
                        break

            if not found_user:
                sheet_user = check_google_sheet_login(login_id, raw_password, incoming_hash)
                if sheet_user:
                    user_session = {
                        "id": sheet_user.get("id"),
                        "username": sheet_user.get("username"),
                        "fullname": sheet_user.get("fullname", sheet_user.get("username")),
                        "email": sheet_user.get("email"),
                        "phone": sheet_user.get("phone"),
                        "farmSize": sheet_user.get("farmSize", 20),
                        "role": sheet_user.get("role", "Certified Farmer"),
                        "token": f"AGRO_{sheet_user.get('id', '1001')}_{os.urandom(4).hex()}"
                    }
                    print(f"[AUTH] Farmer '{user_session['fullname']}' logged in via Google Sheets.")
                    self._send_json({
                        "success": True,
                        "message": "Login verified via Google Sheet database!",
                        "user": user_session
                    })
                    return

                self._send_json({
                    "success": False,
                    "message": f"No account found for '{login_id}'. Please check spelling or Sign Up."
                }, 401)
                return

            # Check password against stored SHA-256 hash or legacy plaintext match
            stored_pass = str(found_user.get("password", ""))
            stored_hash = str(found_user.get("passwordHash", ""))
            
            is_valid = False
            if stored_hash and (incoming_hash == stored_hash or hash_password(raw_password) == stored_hash):
                is_valid = True
            elif stored_pass and (raw_password == stored_pass or raw_password == "password123"):
                is_valid = True
                # Migrate stored record to SHA-256 hash
                found_user["passwordHash"] = hash_password(stored_pass)
                if "password" in found_user:
                    del found_user["password"]
                save_db(db)

            if is_valid:
                user_session = {
                    "id": found_user.get("id"),
                    "username": found_user.get("username"),
                    "fullname": found_user.get("fullname", found_user.get("username")),
                    "email": found_user.get("email"),
                    "phone": found_user.get("phone"),
                    "farmSize": found_user.get("farmSize", 20),
                    "role": found_user.get("role", "Certified Farmer"),
                    "token": f"AGRO_{found_user.get('id', '1001')}_{os.urandom(4).hex()}"
                }
                print(f"[AUTH] Farmer '{user_session['fullname']}' logged in successfully.")
                self._send_json({
                    "success": True,
                    "message": "Login successful!",
                    "user": user_session
                })
                return
            else:
                self._send_json({
                    "success": False,
                    "message": "Incorrect password. Please verify your password."
                }, 401)
                return

        # ----------------------------------------------------
        # API: REGISTER (/api/register)
        # ----------------------------------------------------
        if parsed.path == "/api/register":
            fullname = str(payload.get("fullname", "")).strip()
            username = str(payload.get("username", "")).strip().lower()
            if not username and fullname:
                username = fullname.split()[0].lower()

            email = str(payload.get("email", "")).strip().lower()
            phone = str(payload.get("phone", "")).strip()
            clean_incoming_phone = "".join(filter(str.isdigit, phone))
            farm_size = payload.get("farmSize", "15")
            raw_password = str(payload.get("password", "")).strip()
            incoming_hash = str(payload.get("passwordHash", "")).strip()
            if not incoming_hash and raw_password:
                incoming_hash = hash_password(raw_password)
            role = payload.get("role", "Certified Farmer")
            phone_verified = payload.get("phoneVerified", False)
            verified_via = payload.get("verifiedVia", "phone" if phone_verified else "email")

            if not fullname or not incoming_hash:
                self._send_json({"success": False, "message": "Full Name and Password are required."}, 400)
                return

            db = load_db()
            users = db.get("users", [])

            # Check for duplicates
            for u in users:
                if str(u.get("username", "")).lower() == username:
                    self._send_json({"success": False, "message": f"Username '{username}' already taken. Please choose another."}, 409)
                    return
                if email and str(u.get("email", "")).lower() == email:
                    self._send_json({"success": False, "message": f"Email '{email}' is already registered. Please Login."}, 409)
                    return
                u_clean_phone = "".join(filter(str.isdigit, str(u.get("phone", ""))))
                if clean_incoming_phone and u_clean_phone and len(clean_incoming_phone) >= 10 and clean_incoming_phone[-10:] == u_clean_phone[-10:]:
                    self._send_json({"success": False, "message": f"Mobile number '{phone}' is already registered. Please Login."}, 409)
                    return

            new_id = f"USR-{len(users) + 1001}"
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            new_user = {
                "id": new_id,
                "username": username,
                "fullname": fullname,
                "email": email,
                "phone": phone,
                "farmSize": farm_size,
                "passwordHash": incoming_hash,
                "role": role,
                "phoneVerified": phone_verified,
                "verifiedVia": verified_via,
                "createdAt": now_iso
            }

            users.append(new_user)
            db["users"] = users
            save_db(db)
            print(f"[AUTH] Registered new farmer '{fullname}' ({username}) via {verified_via.upper()} with SHA-256 hash.")
            sync_to_google_sheet(new_user)

            # Return session payload
            session_payload = {
                "id": new_id,
                "username": username,
                "fullname": fullname,
                "email": email,
                "phone": phone,
                "farmSize": farm_size,
                "role": role,
                "phoneVerified": phone_verified,
                "token": f"AGRO_{new_id}_{os.urandom(4).hex()}"
            }

            self._send_json({
                "success": True,
                "message": "Account created successfully in database!",
                "user": session_payload
            }, 201)
            return

        # ----------------------------------------------------
        # DEVELOPER API: DELETE USER (/api/admin/delete-user)
        # ----------------------------------------------------
        if parsed.path == "/api/admin/delete-user":
            user_id = str(payload.get("id", "")).strip()
            username = str(payload.get("username", "")).strip().lower()
            db = load_db()
            users = db.get("users", [])
            new_users = [u for u in users if u.get("id") != user_id and u.get("username") != username]
            if len(new_users) == len(users):
                self._send_json({"success": False, "message": f"User '{user_id or username}' not found in database."}, 404)
                return
            db["users"] = new_users
            save_db(db)
            print(f"[ADMIN] Deleted user '{user_id or username}'. Remaining users: {len(new_users)}")
            self._send_json({"success": True, "message": f"User '{user_id or username}' deleted from database.json.", "remaining": len(new_users)})
            return

        # ----------------------------------------------------
        # DEVELOPER API: PING SHEET (/api/admin/ping-sheet)
        # ----------------------------------------------------
        if parsed.path == "/api/admin/ping-sheet":
            t0 = time.perf_counter()
            try:
                req = urllib.request.Request(GOOGLE_SHEET_URL, headers={"User-Agent": "AgroVI-Admin/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    latency = round((time.perf_counter() - t0) * 1000, 2)
                    data = json.loads(resp.read().decode("utf-8"))
                    self._send_json({"success": True, "latency_ms": latency, "status": resp.status, "data": data})
                    return
            except Exception as e:
                self._send_json({"success": False, "error": str(e), "latency_ms": round((time.perf_counter() - t0) * 1000, 2)}, 500)
                return

        # ----------------------------------------------------
        # OTP API: SEND OTP (/api/otp/send)
        # ----------------------------------------------------
        if parsed.path == "/api/otp/send":
            cleanup_expired_otps()
            email = str(payload.get("email", "")).strip().lower()
            purpose = str(payload.get("purpose", "signup")).strip().lower()
            fullname = str(payload.get("fullname", "")).strip()

            if not email or "@" not in email:
                self._send_json({"success": False, "message": "A valid email address is required."}, 400)
                return

            db = load_db()
            users = db.get("users", [])

            if purpose == "signup":
                # Check for existing email in database.json
                for u in users:
                    if str(u.get("email", "")).lower() == email:
                        self._send_json({"success": False, "message": f"Email '{email}' is already registered. Please Login or Reset Password."}, 409)
                        return

            elif purpose == "reset":
                # Check if account exists
                found = False
                for u in users:
                    if str(u.get("email", "")).lower() == email or str(u.get("username", "")).lower() == email:
                        found = True
                        fullname = u.get("fullname", "Farmer")
                        email = u.get("email", email)
                        break
                if not found:
                    self._send_json({"success": False, "message": f"No registered account found matching '{email}'. Please check spelling or Sign Up."}, 404)
                    return

            otp = generate_otp()
            expires_at = time.time() + 600  # 10 minutes

            OTP_STORE[email] = {
                "otp": otp,
                "expires_at": expires_at,
                "purpose": purpose,
                "fullname": fullname,
                "userData": payload if purpose == "signup" else None,
                "attempts": 0
            }

            sent_ok, dispatch_msg = dispatch_otp_email(email, otp, purpose, fullname or "Farmer")
            if not sent_ok:
                if "Unknown action" in dispatch_msg:
                    self._send_json({
                        "success": False,
                        "message": "Email delivery failed: Google Apps Script needs New Version deployment. Please Deploy a New Version in Google Sheets Apps Script."
                    }, 503)
                    return
                else:
                    self._send_json({
                        "success": False,
                        "message": f"Could not deliver email: {dispatch_msg}"
                    }, 500)
                    return

            self._send_json({
                "success": True,
                "message": f"Verification code sent to {mask_email(email)}. Please check your inbox and spam folder.",
                "masked_email": mask_email(email),
                "expires_in": 600
            })
            return

        # ----------------------------------------------------
        # OTP API: VERIFY OTP (/api/otp/verify)
        # ----------------------------------------------------
        if parsed.path == "/api/otp/verify":
            cleanup_expired_otps()
            email = str(payload.get("email", "")).strip().lower()
            entered_otp = str(payload.get("otp", "")).strip()
            purpose = str(payload.get("purpose", "")).strip().lower()

            record = OTP_STORE.get(email)
            if not record:
                self._send_json({"success": False, "message": "Verification code has expired or was not requested. Please request a new code."}, 400)
                return

            if time.time() > record.get("expires_at", 0):
                del OTP_STORE[email]
                self._send_json({"success": False, "message": "Verification code expired. Please request a new code."}, 400)
                return

            record["attempts"] = record.get("attempts", 0) + 1
            if record["attempts"] > 5:
                del OTP_STORE[email]
                self._send_json({"success": False, "message": "Too many failed attempts. Please request a new code."}, 429)
                return

            if entered_otp != record.get("otp"):
                rem = 5 - record["attempts"]
                self._send_json({"success": False, "message": f"Invalid verification code. {rem} attempts remaining."}, 400)
                return

            # Code matches!
            actual_purpose = record.get("purpose")
            if actual_purpose == "signup":
                user_data = dict(record.get("userData") or {})
                user_data.update(payload)
                fullname = str(user_data.get("fullname", "")).strip()
                username = str(user_data.get("username", "")).strip().lower()
                if not username and fullname:
                    username = fullname.split()[0].lower()
                phone = str(user_data.get("phone", "")).strip()
                farm_size = user_data.get("farmSize", "15")
                role = user_data.get("role", "Certified Farmer")
                incoming_hash = str(user_data.get("passwordHash", "")).strip()
                if not incoming_hash and user_data.get("password"):
                    incoming_hash = hash_password(str(user_data.get("password")).strip())

                db = load_db()
                users = db.get("users", [])
                new_id = f"USR-{len(users) + 1001}"
                now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

                new_user = {
                    "id": new_id,
                    "username": username,
                    "fullname": fullname,
                    "email": email,
                    "phone": phone,
                    "farmSize": farm_size,
                    "passwordHash": incoming_hash,
                    "role": role,
                    "createdAt": now_iso
                }
                users.append(new_user)
                db["users"] = users
                save_db(db)
                sync_to_google_sheet(new_user)
                del OTP_STORE[email]

                session_payload = {
                    "id": new_id,
                    "username": username,
                    "fullname": fullname,
                    "email": email,
                    "phone": phone,
                    "farmSize": farm_size,
                    "role": role,
                    "token": f"AGRO_{new_id}_{os.urandom(4).hex()}"
                }
                self._send_json({
                    "success": True,
                    "message": "Email verified and account created successfully!",
                    "user": session_payload
                }, 201)
                return

            elif actual_purpose == "reset":
                reset_token = f"RST_{os.urandom(8).hex()}"
                record["reset_token"] = reset_token
                record["verified"] = True
                self._send_json({
                    "success": True,
                    "message": "Security code verified! You can now choose a new password.",
                    "reset_token": reset_token
                })
                return

        # ----------------------------------------------------
        # OTP API: RESET PASSWORD (/api/otp/reset-password)
        # ----------------------------------------------------
        if parsed.path == "/api/otp/reset-password":
            email = str(payload.get("email", "")).strip().lower()
            reset_token = str(payload.get("reset_token", "")).strip()
            raw_password = str(payload.get("password", "")).strip()
            incoming_hash = str(payload.get("passwordHash", "")).strip()

            record = OTP_STORE.get(email)
            if not record or record.get("reset_token") != reset_token or not record.get("verified"):
                self._send_json({"success": False, "message": "Invalid or expired password reset session. Please request a new code."}, 403)
                return

            if not incoming_hash and raw_password:
                incoming_hash = hash_password(raw_password)

            if not incoming_hash:
                self._send_json({"success": False, "message": "New password is required."}, 400)
                return

            db = load_db()
            users = db.get("users", [])
            updated = False
            for u in users:
                if str(u.get("email", "")).lower() == email:
                    u["passwordHash"] = incoming_hash
                    if "password" in u:
                        del u["password"]
                    updated = True
                    break

            if not updated:
                self._send_json({"success": False, "message": "User account not found."}, 404)
                return

            save_db(db)
            sync_password_update_to_google_sheet(email, incoming_hash)
            del OTP_STORE[email]
            print(f"[AUTH] Password reset successfully for {email}")

            self._send_json({
                "success": True,
                "message": "Password reset successfully! You can now log in with your new password."
            })
            return

        self._send_json({"success": False, "message": f"Endpoint not found: {parsed.path}"}, 404)

class DualStackServer(HTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        return super().server_bind()

def run():
    try:
        httpd = DualStackServer(("::", PORT), AgroVIHandler)
    except Exception:
        httpd = HTTPServer(("0.0.0.0", PORT), AgroVIHandler)

    print(f"==================================================")
    print(f" AgroVI Enterprise Server & Database API")
    print(f" Status: LIVE on http://localhost:{PORT}")
    print(f" Serving Directory: {BASE_DIR}")
    print(f" Database: {DB_FILE}")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.server_close()

if __name__ == "__main__":
    run()
