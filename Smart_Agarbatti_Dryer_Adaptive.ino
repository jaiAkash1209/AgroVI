/*
SMART AGARBATTI DRYER - ADAPTIVE AUTOMATION
Arduino UNO

HARDWARE
--------
D9  Heater relay
D10 Fan 1 relay
D11 Fan 2 relay
D13 Alarm LED
D2  DHT22 data
A0  10K NTC divider
A4  OLED SDA
A5  OLED SCL

The DHT22 must not be installed directly inside a 220 C chamber: its specified
operating range is far lower. Put it in a suitably cooled exhaust/sample path,
or replace it with a humidity sensor rated for the actual process temperature.
Use an NTC probe rated above the 230 C safety limit.

NTC:
5V -> 10K fixed resistor -> A0 -> 10K NTC -> GND

At 220 C, a typical 10K/B3950 NTC with this 10K divider is near ADC 5.
This sketch keeps the fractional result of its 16-sample average, but a
thermocouple or a divider designed for the high-temperature range is preferable
where precise operation around 220 C is required.

AUTOMATION
----------
1. OLED-first boot
2. Sensor validation
3. Fan pre-run
4. Multi-stage temperature target
5. Adaptive heater control
6. Temperature-rate protection
7. Humidity trend monitoring
8. Thermal stability detection
9. Humidity stability detection
10. Heater effectiveness check
11. Automatic drying completion
12. Automatic cooldown
13. Independent hard 230 C lockout
14. EEPROM calibration
15. Serial diagnostics

SERIAL
------
HELP
STATUS
START
STOP
LOCK
RESETLOCK
RECIPE 1
RECIPE 2
RECIPE 3
CAL SHOW
CAL RESET
CAL T1 <reference>
CAL T2 <reference>
CAL APPLY
CAL SAVE
CAL RHOFF <offset>

IMPORTANT:
The 230 C safety cutoff is independent of the adaptive algorithm.
A physical thermal fuse/thermostat is strongly recommended in real hardware.
Relay contacts must be correctly rated and the heater/fans must use their
proper 12 V power path, not Arduino 5 V.
*/

#include <Wire.h>
#include <EEPROM.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <math.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C

#define DHTPIN 2
#define DHTTYPE DHT22

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
DHT dht(DHTPIN, DHTTYPE);

const byte HEATER_PIN = 9;
const byte FAN1_PIN = 10;
const byte FAN2_PIN = 11;
const byte ALARM_PIN = 13;
const byte NTC_PIN = A0;

const bool RELAY_ACTIVE_LOW = true;

const float NTC_NOMINAL = 10000.0;
const float NTC_TEMP_NOMINAL = 25.0;
const float NTC_BETA = 3950.0;
const float NTC_FIXED = 10000.0;

const int ADC_SAMPLES = 16;
const float EMA_ALPHA = 0.20;

const float HEAT_START_C = 210.0;
const float HEAT_TARGET_C = 220.0;
const float HARD_LIMIT_C = 230.0;

const unsigned long NTC_INTERVAL = 250UL;
const unsigned long DHT_INTERVAL = 2000UL;
const unsigned long DISPLAY_INTERVAL = 500UL;
const unsigned long FAN_PRERUN_TIME = 5000UL;
const unsigned long COOLDOWN_TIME = 30000UL;
const unsigned long MIN_HEATER_OFF = 5000UL;

const unsigned long STABLE_TIME = 60000UL;
const unsigned long RH_STABLE_TIME = 90000UL;
const unsigned long MIN_DRY_TIME = 300000UL;
const unsigned long HEATER_TEST_TIME = 60000UL;

const float STABLE_BAND = 2.0;
const float STABLE_RATE = 0.15;
const float MIN_EXPECTED_RISE = 2.0;

enum SystemState {
  IDLE,
  FAN_PRERUN,
  RUNNING,
  COOLDOWN,
  COMPLETE,
  SAFETY_LOCKOUT
};

SystemState state = IDLE;

enum ErrorCode {
  ERR_NONE,
  ERR_NTC_LOW,
  ERR_NTC_HIGH,
  ERR_NTC_RANGE,
  ERR_NTC_CALC,
  ERR_DHT,
  ERR_OVERTEMP,
  ERR_HEATER,
  ERR_EEPROM,
  ERR_OLED
};

ErrorCode lastError = ERR_NONE;

struct Recipe {
  float ramp1;
  float ramp2;
  float finalTemp;
  unsigned long minTime;
};

Recipe recipes[3] = {
  {120.0, 170.0, 220.0, 300000UL},
  {140.0, 190.0, 220.0, 240000UL},
  {100.0, 150.0, 200.0, 480000UL}
};

byte selectedRecipe = 0;

struct CalibrationData {
  uint16_t magic;
  byte version;
  float gain;
  float offset;
  float rhOffset;
  uint16_t checksum;
};

CalibrationData cal;

const uint16_t CAL_MAGIC = 0xA65C;
const byte CAL_VERSION = 2;

float calRaw1 = NAN;
float calRef1 = NAN;
float calRaw2 = NAN;
float calRef2 = NAN;

float rawTempC = NAN;
float filteredRawTempC = NAN;
float temperatureC = NAN;

float previousTemperatureC = NAN;
float humidity = NAN;
float previousHumidity = NAN;

float temperatureRate = 0.0;
float humidityRate = 0.0;

// Keep the fractional 16-sample average. Integer truncation is particularly
// inaccurate at high temperature, where the stated divider has a low ADC value.
float ntcADC = 0.0;
float ntcVoltage = 0.0;
float ntcResistance = 0.0;

unsigned long lastNTC = 0;
unsigned long lastDHT = 0;
unsigned long lastDisplay = 0;
unsigned long lastTempRate = 0;
unsigned long lastHumidityRate = 0;

unsigned long processStart = 0;
unsigned long stableStart = 0;
unsigned long humidityStableStart = 0;
unsigned long heaterStart = 0;
unsigned long heaterOffAt = 0;

float heaterTestTemperature = NAN;

bool stableTemperature = false;
bool stableHumidity = false;
bool heaterTestActive = false;

unsigned long ntcErrors = 0;
unsigned long dhtErrors = 0;
unsigned long heaterErrors = 0;

char serialBuffer[48];
byte serialIndex = 0;

bool relayIsOn(byte pin) {
  return digitalRead(pin) == (RELAY_ACTIVE_LOW ? LOW : HIGH);
}

void relayWrite(byte pin, bool on) {
  if (RELAY_ACTIVE_LOW) {
    digitalWrite(pin, on ? LOW : HIGH);
  } else {
    digitalWrite(pin, on ? HIGH : LOW);
  }
}

void heater(bool on) {
  relayWrite(HEATER_PIN, on);
  if (!on) {
    heaterOffAt = millis();
  }
}

void fan1(bool on) {
  relayWrite(FAN1_PIN, on);
}

void fan2(bool on) {
  relayWrite(FAN2_PIN, on);
}

void fans(bool on) {
  fan1(on);
  fan2(on);
}

void alarm(bool on) {
  digitalWrite(ALARM_PIN, on ? HIGH : LOW);
}

void allSafeOff() {
  heater(false);
  fans(false);
  alarm(false);
}

uint16_t calcChecksum(CalibrationData d) {
  d.checksum = 0;
  uint8_t *p = (uint8_t*)&d;
  uint16_t sum = 0;

  for (unsigned int i = 0; i < sizeof(CalibrationData); i++) {
    sum = (sum * 31) + p[i];
  }

  return sum;
}

void factoryCalibration() {
  cal.magic = CAL_MAGIC;
  cal.version = CAL_VERSION;
  cal.gain = 1.0;
  cal.offset = 0.0;
  cal.rhOffset = 0.0;
  cal.checksum = calcChecksum(cal);
}

void saveCalibration() {
  cal.magic = CAL_MAGIC;
  cal.version = CAL_VERSION;
  cal.checksum = calcChecksum(cal);
  EEPROM.put(0, cal);
  Serial.println(F("CAL: SAVED"));
}

void loadCalibration() {
  EEPROM.get(0, cal);

  bool valid =
    cal.magic == CAL_MAGIC &&
    cal.version == CAL_VERSION &&
    isfinite(cal.gain) &&
    isfinite(cal.offset) &&
    isfinite(cal.rhOffset) &&
    cal.gain > 0.001 &&
    cal.gain < 10.0 &&
    cal.checksum == calcChecksum(cal);

  if (!valid) {
    factoryCalibration();
    lastError = ERR_EEPROM;
    Serial.println(F("EEPROM invalid: factory calibration"));
  }
}

float adcToTemperature(float adc) {
  if (adc <= 3 || adc >= 1020) return NAN;

  // Wiring is 5 V -> fixed resistor -> ADC -> NTC -> GND.  Therefore the
  // NTC resistance is Rfixed * ADC / (1023 - ADC), not its reciprocal.
  float resistance =
    NTC_FIXED * ((float)adc / (1023.0 - (float)adc));

  if (resistance <= 0.0 || resistance > 10000000.0) {
    return NAN;
  }

  float steinhart = resistance / NTC_NOMINAL;
  steinhart = log(steinhart);
  steinhart /= NTC_BETA;
  steinhart += 1.0 / (NTC_TEMP_NOMINAL + 273.15);
  steinhart = 1.0 / steinhart;
  steinhart -= 273.15;

  return steinhart;
}

void invalidateNTC(ErrorCode error) {
  // Do not leave an old, plausible temperature available after a sensor fault.
  // The running-state safety check sees NAN and immediately locks the heater.
  ntcErrors++;
  lastError = error;
  rawTempC = NAN;
  filteredRawTempC = NAN;
  temperatureC = NAN;
  temperatureRate = 0.0;
}

bool updateNTC() {
  if (millis() - lastNTC < NTC_INTERVAL) return true;
  lastNTC = millis();

  long sum = 0;

  for (int i = 0; i < ADC_SAMPLES; i++) {
    sum += analogRead(NTC_PIN);
    delayMicroseconds(300);
  }

  ntcADC = (float)sum / (float)ADC_SAMPLES;

  if (ntcADC <= 3) {
    invalidateNTC(ERR_NTC_LOW);
    return false;
  }

  if (ntcADC >= 1019) {
    invalidateNTC(ERR_NTC_HIGH);
    return false;
  }

  ntcVoltage = ntcADC * 5.0 / 1023.0;
  ntcResistance =
    NTC_FIXED * ((float)ntcADC / (1023.0 - (float)ntcADC));

  rawTempC = adcToTemperature(ntcADC);

  if (isnan(rawTempC) || !isfinite(rawTempC)) {
    invalidateNTC(ERR_NTC_CALC);
    return false;
  }

  if (rawTempC < -20.0 || rawTempC > 280.0) {
    invalidateNTC(ERR_NTC_RANGE);
    return false;
  }

  if (isnan(filteredRawTempC)) {
    filteredRawTempC = rawTempC;
  } else {
    filteredRawTempC =
      EMA_ALPHA * rawTempC +
      (1.0 - EMA_ALPHA) * filteredRawTempC;
  }

  temperatureC =
    filteredRawTempC * cal.gain + cal.offset;

  unsigned long now = millis();

  if (!isnan(previousTemperatureC) && lastTempRate != 0) {
    float dt = (now - lastTempRate) / 1000.0;

    if (dt > 0.0 && dt < 10.0) {
      temperatureRate =
        (temperatureC - previousTemperatureC) / dt;
    }
  }

  previousTemperatureC = temperatureC;
  lastTempRate = now;

  return true;
}

void updateDHT() {
  if (millis() - lastDHT < DHT_INTERVAL) return;
  lastDHT = millis();

  float h = dht.readHumidity();

  if (isnan(h) || !isfinite(h)) {
    dhtErrors++;
    lastError = ERR_DHT;
    // A failed DHT reading is not a stable humidity reading. Clear the last
    // value so automatic drying completion cannot use stale sensor data.
    humidity = NAN;
    stableHumidity = false;
    humidityStableStart = 0;
    return;
  }

  previousHumidity = humidity;
  humidity = h + cal.rhOffset;

  if (humidity < 0.0) humidity = 0.0;
  if (humidity > 100.0) humidity = 100.0;

  if (!isnan(previousHumidity) && lastHumidityRate != 0) {
    float dt = (millis() - lastHumidityRate) / 1000.0;

    if (dt > 0.0 && dt < 20.0) {
      humidityRate =
        (humidity - previousHumidity) / dt;
    }
  }

  lastHumidityRate = millis();
}

float currentTarget() {
  Recipe &r = recipes[selectedRecipe];

  unsigned long elapsed = millis() - processStart;

  if (elapsed < 90000UL) return r.ramp1;
  if (elapsed < 180000UL) return r.ramp2;

  return r.finalTemp;
}

void updateTemperatureStability() {
  if (state != RUNNING) {
    stableTemperature = false;
    stableStart = 0;
    return;
  }

  float target = currentTarget();

  if (fabs(temperatureC - target) <= STABLE_BAND &&
      fabs(temperatureRate) <= STABLE_RATE) {

    if (stableStart == 0) stableStart = millis();

    if (millis() - stableStart >= STABLE_TIME) {
      stableTemperature = true;
    }
  } else {
    stableStart = 0;
    stableTemperature = false;
  }
}

void updateHumidityStability() {
  if (state != RUNNING || isnan(humidity)) {
    stableHumidity = false;
    humidityStableStart = 0;
    return;
  }

  if (fabs(humidityRate) < 0.003) {
    if (humidityStableStart == 0) humidityStableStart = millis();

    if (millis() - humidityStableStart >= RH_STABLE_TIME) {
      stableHumidity = true;
    }
  } else {
    humidityStableStart = 0;
    stableHumidity = false;
  }
}

void safetyLock(ErrorCode error) {
  heater(false);
  fans(true);
  alarm(true);

  state = SAFETY_LOCKOUT;
  lastError = error;

  Serial.print(F("SAFETY LOCKOUT E"));
  Serial.println((int)error);
}

bool sensorsSafe() {
  if (isnan(temperatureC) || !isfinite(temperatureC)) return false;
  if (temperatureC < -20.0 || temperatureC > 280.0) return false;
  return true;
}

void adaptiveHeater() {
  if (state != RUNNING) {
    heater(false);
    return;
  }

  if (temperatureC >= HARD_LIMIT_C) {
    safetyLock(ERR_OVERTEMP);
    return;
  }

  float target = currentTarget();

  // Rapid temperature rise protection.
  if (temperatureRate > 1.5) {
    heater(false);
    return;
  }

  // Above target.
  if (temperatureC >= target) {
    heater(false);
    return;
  }

  // Minimum OFF time protects the relay/heater from rapid cycling.
  if (millis() - heaterOffAt < MIN_HEATER_OFF) return;

  // Far below target: continuous heating.
  if (temperatureC < target - 8.0) {
    heater(true);
    return;
  }

  // Medium approach: 5 second ON / 5 second OFF time-proportional control.
  if (temperatureC < target - 3.0) {
    unsigned long phase = millis() % 10000UL;

    if (phase < 5000UL) heater(true);
    else heater(false);

    return;
  }

  // Final approach: let thermal inertia carry the chamber to target.
  heater(false);
}

void heaterEffectivenessCheck() {
  if (state != RUNNING) return;

  if (!heaterTestActive) {
    if (relayIsOn(HEATER_PIN)) {
      heaterTestActive = true;
      heaterStart = millis();
      heaterTestTemperature = temperatureC;
    }
    return;
  }

  if (millis() - heaterStart >= HEATER_TEST_TIME) {
    if (!isnan(heaterTestTemperature) &&
        temperatureC - heaterTestTemperature < MIN_EXPECTED_RISE &&
        temperatureC < currentTarget() - 10.0) {

      heaterErrors++;
      safetyLock(ERR_HEATER);
      return;
    }

    heaterTestActive = false;
  }
}

void startProcess() {
  if (state == SAFETY_LOCKOUT) {
    Serial.println(F("START DENIED: safety lock"));
    return;
  }

  if (!sensorsSafe()) {
    Serial.println(F("START DENIED: NTC invalid"));
    return;
  }

  processStart = millis();
  stableStart = 0;
  humidityStableStart = 0;
  stableTemperature = false;
  stableHumidity = false;
  heaterTestActive = false;

  heater(false);
  fans(true);
  alarm(false);

  state = FAN_PRERUN;

  Serial.println(F("START -> FAN PRE-RUN"));
}

void stopProcess() {
  if (state == IDLE) return;

  heater(false);
  fans(true);
  state = COOLDOWN;
  processStart = millis();

  Serial.println(F("STOP -> COOLDOWN"));
}

void runStateMachine() {
  if (state == SAFETY_LOCKOUT) {
    heater(false);
    fans(true);
    alarm(true);
    return;
  }

  if (state == FAN_PRERUN) {
    heater(false);
    fans(true);

    if (millis() - processStart >= FAN_PRERUN_TIME) {
      processStart = millis();
      state = RUNNING;
      Serial.println(F("PRE-RUN COMPLETE -> RUNNING"));
    }

    return;
  }

  if (state == RUNNING) {
    fans(true);

    if (!sensorsSafe()) {
      safetyLock(ERR_NTC_CALC);
      return;
    }

    if (temperatureC >= HARD_LIMIT_C) {
      safetyLock(ERR_OVERTEMP);
      return;
    }

    adaptiveHeater();
    if (state == SAFETY_LOCKOUT) return;

    heaterEffectivenessCheck();
    if (state == SAFETY_LOCKOUT) return;

    updateTemperatureStability();
    updateHumidityStability();

    unsigned long elapsed = millis() - processStart;

    if (elapsed >= recipes[selectedRecipe].minTime &&
        stableTemperature &&
        stableHumidity) {

      heater(false);
      state = COMPLETE;

      Serial.println(F("DRYING COMPLETE"));
    }

    return;
  }

  if (state == COOLDOWN) {
    heater(false);
    fans(true);

    if (millis() - processStart >= COOLDOWN_TIME) {
      fans(false);
      alarm(false);
      state = IDLE;
      Serial.println(F("COOLDOWN COMPLETE -> IDLE"));
    }

    return;
  }

  if (state == COMPLETE) {
    heater(false);

    if (!isnan(temperatureC) && temperatureC > 50.0) {
      fans(true);
    } else {
      fans(false);
    }

    if (!isnan(temperatureC) && temperatureC <= 45.0) {
      state = IDLE;
      Serial.println(F("PROCESS FINISHED -> IDLE"));
    }

    return;
  }

  if (state == IDLE) {
    heater(false);
    fans(false);
    alarm(false);
  }
}

const __FlashStringHelper* stateText() {
  switch (state) {
    case IDLE: return F("IDLE");
    case FAN_PRERUN: return F("PRE-RUN");
    case RUNNING: return F("RUN");
    case COOLDOWN: return F("COOL");
    case COMPLETE: return F("DONE");
    case SAFETY_LOCKOUT: return F("SAFETY");
  }
  return F("?");
}

void displayBoot() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(8, 10);
  display.println(F("AGARBATTI"));
  display.setCursor(20, 34);
  display.println(F("DRYER"));
  display.display();
}

void updateDisplay() {
  if (millis() - lastDisplay < DISPLAY_INTERVAL) return;
  lastDisplay = millis();

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print(F("T:"));
  if (isnan(temperatureC)) display.print(F("--"));
  else display.print(temperatureC, 1);

  display.print(F("C RH:"));
  if (isnan(humidity)) display.print(F("--"));
  else display.print(humidity, 0);
  display.println(F("%"));

  display.setCursor(0, 11);
  display.print(F("TR:"));
  display.print(temperatureRate, 2);
  display.print(F("C/s R"));
  display.print(selectedRecipe + 1);

  display.setCursor(0, 22);
  display.print(F("H:"));
  display.print(relayIsOn(HEATER_PIN) ? F("ON") : F("OFF"));
  display.print(F(" F1:"));
  display.print(relayIsOn(FAN1_PIN) ? F("ON") : F("OFF"));
  display.print(F(" F2:"));
  display.print(relayIsOn(FAN2_PIN) ? F("ON") : F("OFF"));

  display.setCursor(0, 34);
  display.print(F("SYS:"));
  display.print(stateText());

  display.setCursor(0, 45);
  display.print(F("TS:"));
  display.print(stableTemperature ? F("Y") : F("N"));
  display.print(F(" RHS:"));
  display.print(stableHumidity ? F("Y") : F("N"));

  display.setCursor(0, 56);

  if (state == SAFETY_LOCKOUT) {
    display.print(F("FAULT E"));
    display.print((int)lastError);
  } else {
    display.print(F("NTC "));
    display.print(ntcADC);
    display.print(F(" E"));
    display.print(ntcErrors);
  }

  display.display();
}

void showCalibration() {
  Serial.print(F("GAIN="));
  Serial.println(cal.gain, 6);

  Serial.print(F("OFFSET="));
  Serial.println(cal.offset, 3);

  Serial.print(F("RH OFFSET="));
  Serial.println(cal.rhOffset, 2);

  Serial.print(F("T1 RAW="));
  Serial.print(calRaw1);
  Serial.print(F(" REF="));
  Serial.println(calRef1);

  Serial.print(F("T2 RAW="));
  Serial.print(calRaw2);
  Serial.print(F(" REF="));
  Serial.println(calRef2);
}

void printStatus() {
  Serial.println(F("\n===== DRYER STATUS ====="));
  Serial.print(F("STATE: "));
  Serial.println(stateText());

  Serial.print(F("RECIPE: "));
  Serial.println(selectedRecipe + 1);

  Serial.print(F("TEMP: "));
  Serial.println(temperatureC, 2);

  Serial.print(F("RAW: "));
  Serial.println(rawTempC, 2);

  Serial.print(F("FILTERED RAW: "));
  Serial.println(filteredRawTempC, 2);

  Serial.print(F("ADC: "));
  Serial.println(ntcADC);

  Serial.print(F("VOLTAGE: "));
  Serial.println(ntcVoltage, 3);

  Serial.print(F("NTC OHMS: "));
  Serial.println(ntcResistance, 1);

  Serial.print(F("TEMP RATE: "));
  Serial.println(temperatureRate, 3);

  Serial.print(F("RH: "));
  Serial.println(humidity, 2);

  Serial.print(F("RH RATE: "));
  Serial.println(humidityRate, 5);

  Serial.print(F("TARGET: "));
  Serial.println(currentTarget(), 1);

  Serial.print(F("TEMP STABLE: "));
  Serial.println(stableTemperature ? F("YES") : F("NO"));

  Serial.print(F("RH STABLE: "));
  Serial.println(stableHumidity ? F("YES") : F("NO"));

  Serial.print(F("NTC ERRORS: "));
  Serial.println(ntcErrors);

  Serial.print(F("DHT ERRORS: "));
  Serial.println(dhtErrors);

  Serial.print(F("HEATER ERRORS: "));
  Serial.println(heaterErrors);

  Serial.print(F("LAST ERROR: E"));
  Serial.println((int)lastError);

  Serial.println(F("========================"));
}

bool parseFloatManual(const char *s, float &value) {
  while (*s == ' ') s++;

  bool negative = false;

  if (*s == '-') {
    negative = true;
    s++;
  }

  if (!isdigit(*s) && *s != '.') return false;

  float result = 0.0;
  float fraction = 0.0;
  float divisor = 1.0;
  bool decimal = false;

  while (*s) {
    if (*s >= '0' && *s <= '9') {
      int digit = *s - '0';

      if (!decimal) {
        result = result * 10.0 + digit;
      } else {
        fraction = fraction * 10.0 + digit;
        divisor *= 10.0;
      }
    } else if (*s == '.' && !decimal) {
      decimal = true;
    } else {
      break;
    }

    s++;
  }

  result += fraction / divisor;
  if (negative) result = -result;

  value = result;
  return true;
}

void help() {
  Serial.println(F("\nCOMMANDS"));
  Serial.println(F("HELP"));
  Serial.println(F("STATUS"));
  Serial.println(F("START"));
  Serial.println(F("STOP"));
  Serial.println(F("LOCK"));
  Serial.println(F("RESETLOCK"));
  Serial.println(F("RECIPE 1"));
  Serial.println(F("RECIPE 2"));
  Serial.println(F("RECIPE 3"));
  Serial.println(F("CAL SHOW"));
  Serial.println(F("CAL RESET"));
  Serial.println(F("CAL T1 <reference>"));
  Serial.println(F("CAL T2 <reference>"));
  Serial.println(F("CAL APPLY"));
  Serial.println(F("CAL SAVE"));
  Serial.println(F("CAL RHOFF <offset>"));
}

void processCalibration(char *cmd) {
  if (!strcmp(cmd, "CAL SHOW")) {
    showCalibration();
    return;
  }

  if (!strcmp(cmd, "CAL RESET")) {
    factoryCalibration();
    Serial.println(F("Factory calibration loaded"));
    return;
  }

  if (!strcmp(cmd, "CAL SAVE")) {
    saveCalibration();
    return;
  }

  if (!strncmp(cmd, "CAL T1 ", 7)) {
    float ref;

    if (parseFloatManual(cmd + 7, ref)) {
      calRaw1 = filteredRawTempC;
      calRef1 = ref;

      Serial.print(F("T1 RAW="));
      Serial.print(calRaw1, 3);
      Serial.print(F(" REF="));
      Serial.println(calRef1, 3);
    }

    return;
  }

  if (!strncmp(cmd, "CAL T2 ", 7)) {
    float ref;

    if (parseFloatManual(cmd + 7, ref)) {
      calRaw2 = filteredRawTempC;
      calRef2 = ref;

      Serial.print(F("T2 RAW="));
      Serial.print(calRaw2, 3);
      Serial.print(F(" REF="));
      Serial.println(calRef2, 3);
    }

    return;
  }

  if (!strcmp(cmd, "CAL APPLY")) {
    if (isnan(calRaw1) ||
        isnan(calRaw2) ||
        fabs(calRaw2 - calRaw1) < 0.001) {

      Serial.println(F("CAL APPLY FAILED"));
      return;
    }

    cal.gain =
      (calRef2 - calRef1) /
      (calRaw2 - calRaw1);

    cal.offset =
      calRef1 -
      cal.gain * calRaw1;

    Serial.print(F("GAIN="));
    Serial.println(cal.gain, 6);

    Serial.print(F("OFFSET="));
    Serial.println(cal.offset, 3);
    return;
  }

  if (!strncmp(cmd, "CAL RHOFF ", 10)) {
    float offset;

    if (parseFloatManual(cmd + 10, offset)) {
      cal.rhOffset = offset;
      Serial.print(F("RH OFFSET="));
      Serial.println(cal.rhOffset, 2);
    }

    return;
  }

  Serial.println(F("Unknown CAL command"));
}

void processCommand(char *cmd) {
  for (byte i = 0; cmd[i]; i++) {
    cmd[i] = toupper((unsigned char)cmd[i]);
  }

  if (!strcmp(cmd, "HELP")) {
    help();
    return;
  }

  if (!strcmp(cmd, "STATUS")) {
    printStatus();
    return;
  }

  if (!strcmp(cmd, "START")) {
    startProcess();
    return;
  }

  if (!strcmp(cmd, "STOP")) {
    stopProcess();
    return;
  }

  if (!strcmp(cmd, "LOCK")) {
    safetyLock(ERR_NONE);
    return;
  }

  if (!strcmp(cmd, "RESETLOCK")) {
    if (state == SAFETY_LOCKOUT) {
      if (!isnan(temperatureC) && temperatureC < 50.0) {
        alarm(false);
        fans(false);
        state = IDLE;
        lastError = ERR_NONE;
        Serial.println(F("SAFETY LOCK RESET"));
      } else {
        Serial.println(F("RESET DENIED: temperature high"));
      }
    }
    return;
  }

  if (!strncmp(cmd, "RECIPE ", 7)) {
    int r = atoi(cmd + 7);

    if (r >= 1 && r <= 3) {
      selectedRecipe = r - 1;
      Serial.print(F("RECIPE SELECTED: "));
      Serial.println(r);
    }

    return;
  }

  if (!strncmp(cmd, "CAL ", 4)) {
    processCalibration(cmd);
    return;
  }

  Serial.println(F("Unknown command. Type HELP"));
}

void serialTask() {
  while (Serial.available()) {
    char c = Serial.read();

    if (c == '\n' || c == '\r') {
      if (serialIndex > 0) {
        serialBuffer[serialIndex] = '\0';
        processCommand(serialBuffer);
        serialIndex = 0;
      }
    } else if (serialIndex < sizeof(serialBuffer) - 1) {
      serialBuffer[serialIndex++] = c;
    }
  }
}

void configureOutputsSafe() {
  pinMode(HEATER_PIN, OUTPUT);
  pinMode(FAN1_PIN, OUTPUT);
  pinMode(FAN2_PIN, OUTPUT);
  pinMode(ALARM_PIN, OUTPUT);
  allSafeOff();
}

void setup() {
  Serial.begin(115200);

  // Preload inactive relay levels while the pins are inputs. This keeps
  // active-low relay inputs safe until output configuration below.
  digitalWrite(HEATER_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  digitalWrite(FAN1_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  digitalWrite(FAN2_PIN, RELAY_ACTIVE_LOW ? HIGH : LOW);
  digitalWrite(ALARM_PIN, LOW);

  // Display is the first initialized subsystem.
  Wire.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    pinMode(ALARM_PIN, OUTPUT);
    digitalWrite(ALARM_PIN, HIGH);
    while (true) {}
  }

  displayBoot();
  delay(800);

  // Configure outputs, calibration storage, and sensors after the boot screen.
  configureOutputsSafe();

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("SYSTEM CHECK"));
  display.println(F("OUTPUTS: SAFE"));
  display.println(F("LOAD CALIBRATION"));
  display.display();

  loadCalibration();
  dht.begin();

  delay(1000);

  updateNTC();
  updateDHT();

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("SYSTEM READY"));
  display.print(F("NTC: "));
  display.println(sensorsSafe() ? F("OK") : F("ERROR"));
  display.print(F("DHT: "));
  display.println(isnan(humidity) ? F("ERROR") : F("OK"));
  display.display();

  delay(1000);

  heaterOffAt = millis();
  state = IDLE;

  Serial.println(F("\nSMART AGARBATTI DRYER"));
  Serial.println(F("ADAPTIVE AUTOMATION"));
  Serial.println(F("115200 baud"));
  Serial.println(F("Type HELP"));
}

void loop() {
  serialTask();

  updateNTC();
  updateDHT();

  // Independent hard safety.
  if (state != SAFETY_LOCKOUT &&
      !isnan(temperatureC) &&
      temperatureC >= HARD_LIMIT_C) {
    safetyLock(ERR_OVERTEMP);
  }

  // NTC must never be allowed to control a running heater when invalid.
  if ((state == RUNNING || state == FAN_PRERUN) &&
      !sensorsSafe()) {
    safetyLock(ERR_NTC_CALC);
  }

  runStateMachine();
  updateDisplay();
}


/*
===============================================================================
QUICK COMMISSIONING CHECKLIST
===============================================================================

1. Upload with heater power disconnected.
2. Open Serial Monitor at 115200 baud.
3. Confirm OLED boot screen.
4. Confirm NTC is around room temperature.
5. Confirm DHT humidity appears.
6. Confirm relay polarity with no dangerous load connected.
7. Test START.
8. Verify fans turn on during pre-run.
9. Verify heater output only after pre-run.
10. Test STOP.
11. Verify cooldown.
12. Test LOCK.
13. Verify heater is OFF in safety lock.
14. Test RESETLOCK while temperature is safe.
15. Only after all tests connect the real 12 V loads.

NTC TEST:
Room-temperature NTC should normally produce a sensible ADC value rather than
0 or 1023. With a 10K fixed resistor and a nominal 10K NTC, the divider should
be near the middle of the ADC range at approximately 25 C.

CALIBRATION:
CAL T1 25.0
CAL T2 100.0
CAL APPLY
CAL SAVE

The two reference temperatures should come from a trustworthy reference
measurement. Do not calibrate against a guessed temperature.

RECIPES:
Recipe 1 = normal
Recipe 2 = faster
Recipe 3 = gentler / lower final temperature

SAFETY:
Never bypass the 230 C software cutoff.
Never remove physical thermal protection.
Never connect mains voltage directly to the Arduino relay module unless the
entire electrical design is appropriately rated, enclosed, fused, and safe.
===============================================================================
*/
