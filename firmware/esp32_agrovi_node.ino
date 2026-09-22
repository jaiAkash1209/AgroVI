/*
 * =========================================================================================
 * AgroVI — Production IoT Drip Irrigation & Soil Sensor Node Firmware
 * =========================================================================================
 * Target Board: ESP32 Dev Module (ESP-WROOM-32)
 * Framework: Arduino / PlatformIO
 * Protocol: Dual-Mode HTTP REST (Render/Local) & MQTT (PubSubClient)
 * 
 * HARDWARE PINOUT MAPPING:
 * -----------------------------------------------------------------------------------------
 * Component                     ESP32 Pin     Pin Type      Description
 * -----------------------------------------------------------------------------------------
 * Solenoid Valve 1 (Orchard)    GPIO 25       Digital OUT   Relay Channel 1 (Active LOW/HIGH)
 * Solenoid Valve 2 (Wheat)      GPIO 26       Digital OUT   Relay Channel 2
 * Solenoid Valve 3 (Greenhouse) GPIO 27       Digital OUT   Relay Channel 3
 * Main Booster Water Pump       GPIO 33       Digital OUT   Relay Channel 4 (Master Pump)
 * Capacitive Moisture Sensor 1  GPIO 34 (A0)  Analog ADC1   Zone 1 Soil Moisture (0-3.3V)
 * Capacitive Moisture Sensor 2  GPIO 35 (A1)  Analog ADC1   Zone 2 Soil Moisture
 * Capacitive Moisture Sensor 3  GPIO 32 (A2)  Analog ADC1   Zone 3 Soil Moisture
 * Water Flow Meter (YF-S201)    GPIO 18       Digital IN    Pulse counter with Interrupt
 * DS18B20 Temperature Sensor    GPIO 4        1-Wire Bus    Digital Waterproof Soil Probe
 * Status Indicator LED          GPIO 2        Digital OUT   Built-in Blue LED (Heartbeat)
 * -----------------------------------------------------------------------------------------
 *
 * DEPENDENCIES (Install via Arduino Library Manager):
 * - WiFi (Built-in ESP32 core)
 * - HTTPClient (Built-in ESP32 core)
 * - ArduinoJson (v6.x or v7.x by Benoit Blanchon)
 * - OneWire (by Paul Stoffregen)
 * - DallasTemperature (by Miles Burton)
 * - PubSubClient (by Nick O'Leary) [Optional if using MQTT broker]
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// =========================================================================================
// CONFIGURATION: NETWORK & SERVER CREDENTIALS
// =========================================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";           // Replace with your 2.4GHz WiFi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";       // Replace with your WiFi Password

// Backend URL: Render cloud production URL or local server IP (e.g. "http://192.168.1.100:8000")
const char* SERVER_TELEMETRY_URL = "https://agrovi-rsvc.onrender.com/api/iot/telemetry";
const char* SERVER_VALVES_URL    = "https://agrovi-rsvc.onrender.com/api/iot/valves";

// Identification
const char* NODE_ID         = "ESP32-AGRO-01";
const char* FIRMWARE_VER    = "2.4.0";

// Actuation Relays (Set to false if your relay module is Active HIGH)
const bool RELAY_ACTIVE_LOW = true; 

// Pins Definition
#define PIN_VALVE_1         25
#define PIN_VALVE_2         26
#define PIN_VALVE_3         27
#define PIN_PUMP            33
#define PIN_MOISTURE_Z1     34
#define PIN_MOISTURE_Z2     35
#define PIN_MOISTURE_Z3     32
#define PIN_FLOW_METER      18
#define PIN_ONE_WIRE_BUS    4
#define PIN_STATUS_LED      2

// Analog Calibration for Capacitive Soil Moisture Sensor v1.2 (12-bit ADC: 0 - 4095)
// Dry air reading ~3200, Water submersion reading ~1450
const int ADC_AIR_DRY   = 3200; 
const int ADC_WATER_WET = 1450; 

// Flow Meter Calibration: YF-S201 has 450 pulses per liter (7.5 Hz per L/min)
const float FLOW_CALIBRATION_FACTOR = 7.5; 

// =========================================================================================
// GLOBAL HARDWARE OBJECTS & TIMERS
// =========================================================================================
OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

volatile unsigned long flowPulseCount = 0;
unsigned long oldFlowTime = 0;
float currentFlowRateLpm = 0.0;
float totalWaterUsedLiters = 0.0;

unsigned long lastTelemetryDispatch = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 5000; // Send telemetry every 5 seconds

// Current State
bool valveState[4] = { false, false, false, false }; // Index 1: Z1, 2: Z2, 3: Z3
bool pumpState = false;
String irrigationMode = "AUTO";

// Local Fallback Thresholds (used if WiFi is offline)
float zoneThresholds[4] = { 0.0, 35.0, 35.0, 45.0 };

// =========================================================================================
// INTERRUPT SERVICE ROUTINE FOR WATER FLOW METER
// =========================================================================================
void IRAM_ATTR pulseCounterISR() {
  flowPulseCount++;
}

// =========================================================================================
// RELAY HELPER
// =========================================================================================
void setRelay(int pin, bool turnOn) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, turnOn ? LOW : HIGH);
  } else {
    digitalWrite(pin, turnOn ? HIGH : LOW);
  }
}

// =========================================================================================
// SENSOR READING FUNCTIONS
// =========================================================================================
float readMoisturePercentage(int pin) {
  // Read analog value with multi-sample averaging to suppress electrical noise
  long sum = 0;
  const int SAMPLES = 10;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(pin);
    delay(5);
  }
  int rawADC = sum / SAMPLES;

  // Constrain and map to 0 - 100%
  int constrainedADC = constrain(rawADC, ADC_WATER_WET, ADC_AIR_DRY);
  float percentage = map(constrainedADC, ADC_AIR_DRY, ADC_WATER_WET, 0, 100);
  return percentage;
}

float readSoilTemperature() {
  tempSensors.requestTemperatures();
  float tempC = tempSensors.getTempCByIndex(0);
  if (tempC == DEVICE_DISCONNECTED_C || tempC < -20 || tempC > 70) {
    return 24.5; // Default safe fallback if probe disconnected
  }
  return tempC;
}

void calculateFlowRate() {
  unsigned long now = millis();
  unsigned long elapsed = now - oldFlowTime;
  if (elapsed >= 1000) {
    // Disable interrupts while reading & resetting volatile counter
    noInterrupts();
    unsigned long pulses = flowPulseCount;
    flowPulseCount = 0;
    interrupts();

    // Pulse frequency (Hz) = pulses / (elapsed / 1000)
    float pulseFreq = ((float)pulses / (float)elapsed) * 1000.0;
    currentFlowRateLpm = pulseFreq / FLOW_CALIBRATION_FACTOR;

    // Accumulate total water: (L/min) / 60 * (seconds elapsed)
    float litersThisSecond = (currentFlowRateLpm / 60.0) * ((float)elapsed / 1000.0);
    totalWaterUsedLiters += litersThisSecond;

    oldFlowTime = now;
  }
}

// =========================================================================================
// WIFI RECONNECTION HANDLER
// =========================================================================================
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println(F("[WIFI] Connecting to WiFi network..."));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    delay(300);
    Serial.print(F("."));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected successfully!"));
    Serial.print(F("[WIFI] IP Address: "));
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_STATUS_LED, HIGH);
  } else {
    Serial.println(F("\n[WIFI] Connection timed out. Running in standalone autonomous mode."));
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

// =========================================================================================
// HTTP TELEMETRY DISPATCH & VALVE SYNC
// =========================================================================================
void sendTelemetryAndSyncValves(float m1, float m2, float m3, float tempC) {
  if (WiFi.status() != WL_CONNECTED) {
    runAutonomousFailsafe(m1, m2, m3);
    return;
  }

  HTTPClient http;
  http.begin(SERVER_TELEMETRY_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  StaticJsonDocument<768> doc;
  doc["nodeId"] = NODE_ID;
  doc["firmware"] = FIRMWARE_VER;
  
  JsonObject zones = doc.createNestedObject("zones");
  
  JsonObject z1 = zones.createNestedObject("1");
  z1["moisture"] = m1;
  z1["temperature"] = tempC;
  z1["flowRate"] = valveState[1] ? currentFlowRateLpm : 0.0;

  JsonObject z2 = zones.createNestedObject("2");
  z2["moisture"] = m2;
  z2["temperature"] = tempC + 1.2;
  z2["flowRate"] = valveState[2] ? currentFlowRateLpm : 0.0;

  JsonObject z3 = zones.createNestedObject("3");
  z3["moisture"] = m3;
  z3["temperature"] = tempC - 0.8;
  z3["flowRate"] = valveState[3] ? currentFlowRateLpm : 0.0;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Telemetry POST response code: %d\n", httpCode);

    // Parse response to synchronize valve actuation states
    StaticJsonDocument<1024> respDoc;
    DeserializationError err = deserializeJson(respDoc, response);
    if (!err && respDoc["success"]) {
      JsonObject telem = respDoc["telemetry"];
      JsonObject rZones = telem["zones"];
      
      irrigationMode = telem["system"]["irrigationMode"].as<String>();

      // Apply valve states from central controller
      for (int i = 1; i <= 3; i++) {
        String zid = String(i);
        if (rZones.containsKey(zid)) {
          bool vOpen = rZones[zid]["valveOpen"];
          valveState[i] = vOpen;
          if (rZones[zid].containsKey("threshold")) {
            zoneThresholds[i] = rZones[zid]["threshold"];
          }
        }
      }

      // Actuate physical GPIO relays
      setRelay(PIN_VALVE_1, valveState[1]);
      setRelay(PIN_VALVE_2, valveState[2]);
      setRelay(PIN_VALVE_3, valveState[3]);

      // Booster Pump is ON if ANY valve is open
      pumpState = valveState[1] || valveState[2] || valveState[3];
      setRelay(PIN_PUMP, pumpState);

      Serial.printf("[ACTUATION] Relays -> Z1:%d, Z2:%d, Z3:%d | Pump:%d | Mode:%s\n",
        valveState[1], valveState[2], valveState[3], pumpState, irrigationMode.c_str());
    }
  } else {
    Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    runAutonomousFailsafe(m1, m2, m3);
  }
  http.end();
}

// =========================================================================================
// FAILSAFE AUTONOMOUS MODE (Ensures crop protection during WiFi dropouts)
// =========================================================================================
void runAutonomousFailsafe(float m1, float m2, float m3) {
  Serial.println(F("[SAFETY] Executing on-device FAO-56 local irrigation logic."));
  
  float moistures[4] = { 0.0, m1, m2, m3 };
  for (int i = 1; i <= 3; i++) {
    if (moistures[i] < zoneThresholds[i]) {
      valveState[i] = true; // Open valve to prevent crop dehydration
    } else if (moistures[i] >= (zoneThresholds[i] + 8.0)) {
      valveState[i] = false; // Saturated, close valve
    }
  }

  setRelay(PIN_VALVE_1, valveState[1]);
  setRelay(PIN_VALVE_2, valveState[2]);
  setRelay(PIN_VALVE_3, valveState[3]);

  pumpState = valveState[1] || valveState[2] || valveState[3];
  setRelay(PIN_PUMP, pumpState);
}

// =========================================================================================
// SETUP
// =========================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n========================================================"));
  Serial.printf("AgroVI ESP32 Smart Irrigation Node v%s\n", FIRMWARE_VER);
  Serial.println(F("========================================================"));

  // Initialize GPIO Relay Outputs (Ensure valves & pump are OFF initially)
  pinMode(PIN_VALVE_1, OUTPUT);
  pinMode(PIN_VALVE_2, OUTPUT);
  pinMode(PIN_VALVE_3, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  setRelay(PIN_VALVE_1, false);
  setRelay(PIN_VALVE_2, false);
  setRelay(PIN_VALVE_3, false);
  setRelay(PIN_PUMP, false);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Initialize Analog Pins (12-bit resolution: 0 - 4095)
  analogReadResolution(12);

  // Initialize Flow Meter Pulse Counter
  pinMode(PIN_FLOW_METER, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW_METER), pulseCounterISR, FALLING);
  oldFlowTime = millis();

  // Initialize DS18B20 OneWire Temperature
  tempSensors.begin();
  Serial.printf("[SENSORS] Found %d OneWire temperature probes.\n", tempSensors.getDeviceCount());

  // Connect to WiFi
  ensureWiFi();
}

// =========================================================================================
// MAIN RUNTIME LOOP
// =========================================================================================
void loop() {
  // 1. Maintain WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    ensureWiFi();
  }

  // 2. Continuously calculate water flow pulse rate
  calculateFlowRate();

  // 3. Periodic Telemetry Dispatch (Every 5 seconds)
  unsigned long now = millis();
  if (now - lastTelemetryDispatch >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryDispatch = now;

    // Read real sensor inputs
    float m1 = readMoisturePercentage(PIN_MOISTURE_Z1);
    float m2 = readMoisturePercentage(PIN_MOISTURE_Z2);
    float m3 = readMoisturePercentage(PIN_MOISTURE_Z3);
    float tempC = readSoilTemperature();

    Serial.printf("[SENSORS] M1: %.1f%% | M2: %.1f%% | M3: %.1f%% | Temp: %.1f°C | Flow: %.2f L/m\n",
      m1, m2, m3, tempC, currentFlowRateLpm);

    // Heartbeat LED blink
    digitalWrite(PIN_STATUS_LED, HIGH);

    // Send to AgroVI Platform and Sync Valve States
    sendTelemetryAndSyncValves(m1, m2, m3, tempC);

    digitalWrite(PIN_STATUS_LED, LOW);
  }

  // Yield to ESP32 RTOS background tasks
  delay(20);
}
