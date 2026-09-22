/**
 * AgroVI Configuration Module
 * Manages API endpoints, local database sync, and Google Sheets integration.
 */

export const CONFIG = {
  // Google Spreadsheet ID provided by the user
  GOOGLE_SHEET_ID: '1N0IpFr02qMJDGb3t-zwneWXvonPJNSSB-DCe2_oQVmQ',

  // Google Apps Script Web App Deployment URL
  // Paste your deployed Apps Script URL here once you deploy it via Extensions > Apps Script
  // Example: 'https://script.google.com/macros/s/AKfycb.../exec'
  GOOGLE_SHEET_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbzq6MsRJTZyjanmGU0cZfkBS60C2q37bjKV0KRWh9gxSd85Cv_dFR-0FI8ph-b7qVZzSA/exec',

  // Local Backend API Endpoint
  API_BASE_URL: window.location.origin
};
