#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include "Adafruit_Sensor.h"
#include "Adafruit_AM2320.h"
#include "LittleFS.h"
#include <TimeLib.h>
#include <EEPROM.h>

const char *softAP_ssid = "ESP_ap";
const char *softAP_password = "123123123";

const size_t sensorsCapacity = JSON_ARRAY_SIZE(1) + 2 * JSON_OBJECT_SIZE(3);
const size_t timeCapacity = JSON_OBJECT_SIZE(2);

char ssid[32] = "";
char password[32] = "";

ESP8266WebServer server(80);
Adafruit_AM2320 am2320 = Adafruit_AM2320();

unsigned long previousMillis = 0; // will store last time LED was updated

long interval = 60000; // interval at which to take snapshot (milliseconds) 300000 = 5min

long heapStart = ESP.getFreeHeap();

long minHeapThreshold = 10000;

long maxFileSize = 40000;

int fileIterations = 0;

bool fileFull = false;

String currentTime = (String)day() + "-" + (String)month() + "-" + (String)year();

FSInfo fs_info;

/** Load WLAN credentials from EEPROM */
void loadCredentials() {
  EEPROM.begin(512);
  EEPROM.get(0, ssid);
  EEPROM.get(0 + sizeof(ssid), password);
  char ok[2 + 1];
  EEPROM.get(0 + sizeof(ssid) + sizeof(password), ok);
  EEPROM.end();
  if (String(ok) != String("OK")) {
    ssid[0] = 0;
    password[0] = 0;
  }
  Serial.println("Recovered credentials:");
  Serial.println(ssid);
  Serial.println(strlen(password) > 0 ? "********" : "<no password>");
}

/** Store WLAN credentials to EEPROM */
void saveCredentials() {
  EEPROM.begin(512);
  EEPROM.put(0, ssid);
  EEPROM.put(0 + sizeof(ssid), password);
  char ok[2 + 1] = "OK";
  EEPROM.put(0 + sizeof(ssid) + sizeof(password), ok);
  EEPROM.commit();
  EEPROM.end();
}

void handleAccessPointPOST() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    Serial.println("wifi save");
    server.arg("ssid").toCharArray(ssid, sizeof(ssid) - 1);
    server.arg("password").toCharArray(password, sizeof(password) - 1);
    saveCredentials();
    if (strlen(ssid) > 0 && strlen(password) > 0) {
      WiFi.softAPdisconnect(true);
      WiFi.softAP(ssid, password);
    }
  }
}

void handleSystemInfoGET() {
  long fh = ESP.getFreeHeap();
  LittleFS.info(fs_info);
  printf("LittleFS: %lu of %lu bytes used.\n",
         fs_info.usedBytes, fs_info.totalBytes);
         
  const size_t capacity = 3 * JSON_OBJECT_SIZE(2);
  DynamicJsonDocument doc(capacity);

  JsonObject memory = doc.createNestedObject("memory");
  memory["free"] = fh;
  memory["start"] = heapStart;

  JsonObject filesystem = doc.createNestedObject("filesystem");
  filesystem["used"] = fs_info.usedBytes;
  filesystem["total"] = fs_info.totalBytes;

  server.send(200, "application/json", doc.as<String>());
}

void handleTimeUpdatePOST() {
  if (server.hasArg("val")) {
    long arg = server.arg("val").toInt();
    Serial.println(arg);

    setTime(arg);

    Serial.print("Time updated!");
    server.send(200, "application/json", "{\"STATUS\": \"OK\"}");
  } else {
    server.send(500, "application/json", "{\"status\": \"No args found\"}");
  }
}

void handleSensorTimesGET() {
  int i = 0;
  long oldest = 99999999999;
  long newest = 0;
  String firstAndLast[1];

  Serial.println("TIME GET");

  Dir dir = LittleFS.openDir("/");
  while (dir.next()) {
    Serial.print(dir.fileName());
    long creationTime = dir.fileCreationTime();
    if (creationTime < oldest) {
      oldest = creationTime;
      firstAndLast[0] = dir.fileName();
    }
    if (creationTime > newest) {
      newest = creationTime;
      firstAndLast[1] = dir.fileName();
    }
  }

  Serial.println(oldest);
  Serial.println(newest);
  Serial.println(firstAndLast[0] + " " + firstAndLast[1]);

  Serial.println("Reading from file");
  File file = LittleFS.open("/" + firstAndLast[0], "r");

  if (!file) {
    Serial.println("Error opening file for reading");
    return;
  }
  
  long t1 = readTimestamp(file, 0, false);
  file.close();

  Serial.println("Reading from file");
  file = LittleFS.open("/" + firstAndLast[1], "r");

  if (!file) {
    Serial.println("Error opening file for reading");
    return;
  }
  
  long t2 = readTimestamp(file, 2, true);

  file.close();

  DynamicJsonDocument doc(timeCapacity);

  doc["timeStart"] = t1;
  doc["timeLast"] = t2;

  server.send(200, "application/json", doc.as<String>());
}

long readTimestamp(File &file, int index, bool fromMax) {
  long fileSize = file.size();

  DynamicJsonDocument doc(fileSize);
  deserializeJson(doc, file);

  JsonArray sensorsArr = doc["sensors"];
  JsonObject sensors;
  sensors = fromMax ? sensorsArr[sensorsArr.size() - index] : sensorsArr[index];

  return sensors["timestamp"];
}

void handleSensorsGET() {
  if (timeStatus() == timeNotSet) {
    server.send(500, "application/json", "{\"status\": \"Time needs to be updated\"}");
  }
  int iterations = 0;
  int fileNumber = server.hasArg("number") ? server.arg("number").toInt() : 0;
  String date = server.hasArg("date") ? server.arg("date") : "";

  String fileName = "/" + date + ":" + fileNumber + ".json";

  for (int i = 1; i < 10; i++) {
    if (LittleFS.exists("/" + date + ":" + i + ".json")) iterations++;
  }

  Serial.println(fileName);

  Serial.println("Reading from file");
  File file = LittleFS.open(fileName, "r");
  if (!file) {
    Serial.println("Error opening file for writing");
    server.send(500, "application/json", "{\"status\": \"File not found\"}");
    return;
  }

  DynamicJsonDocument doc(ESP.getMaxFreeBlockSize() - 100);
  deserializeJson(doc, file);

  doc["next"] = iterations;

  doc.shrinkToFit();

  server.send(200, "application/json", doc.as<String>());
}

void handleFrequencyPOST() {
  if (server.hasArg("val")) {
    String arg = server.arg("val");

    interval = arg.toInt();

    Serial.print("Interval updated! New interval: ");
    Serial.print(interval);
    Serial.print("ms");
    Serial.println("");
    server.send(200, "application/json", "{\"STATUS\": \"OK\"}");
  } else {
    server.send(500, "application/json", "{\"status\": \"No args found\"}");
  }
}

void handleFrequencyGET() {
  const size_t capacity = JSON_OBJECT_SIZE(1);
  DynamicJsonDocument doc(capacity);

  doc["interval"] = interval;

  server.send(200, "application/json", doc.as<String>());
}

void saveSensorData() {
  Serial.println("Free max block heap");
  Serial.println(ESP.getMaxFreeBlockSize());

  String saveTime = (String)day() + "-" + (String)month() + "-" + (String)year();
  if (currentTime != saveTime) {
    currentTime = saveTime;
    fileIterations = 0;
  };
  String fileName = "/" + saveTime + ":" + fileIterations + ".json";
  Serial.println(fileName);

  File file = LittleFS.open(fileName, "r");
  if (!file) {
    Serial.println("File doesn't exist yet");
  } else {
    if (file.size() > maxFileSize) {
      Serial.println("File " + fileName + " is over " + maxFileSize + "!");
      fileIterations++;
      fileName = "/" + saveTime + ":" + fileIterations + ".json";
      file.close();
    }
  }

  file = LittleFS.open(fileName, "a+");
  if (!file) {
    Serial.println("Error opening file for writing");
    return;
  }

  Serial.println("Reading sensors");
  while (isnan(am2320.readTemperature()) && isnan(am2320.readHumidity())) {
  }

  float temperature = am2320.readTemperature();
  float humidity = am2320.readHumidity();

  if (file.size() != 0) {
    DynamicJsonDocument doc(ESP.getMaxFreeBlockSize() - sensorsCapacity);
    deserializeJson(doc, file);

    JsonArray sensorsArr = doc["sensors"];

    JsonObject sensorsObj = sensorsArr.createNestedObject();
    sensorsObj["temperature"] = temperature;
    sensorsObj["humidity"] = humidity;
    sensorsObj["timestamp"] = now();
    doc["fileSize"] = file.size();

    file.close();
    file = LittleFS.open(fileName, "w");
    if (!file) {
      Serial.println("Error opening file for writing");
      return;
    }

    serializeJson(doc, file);
  } else {
    DynamicJsonDocument doc(sensorsCapacity);

    JsonArray sensorsArr = doc.createNestedArray("sensors");

    JsonObject sensorsObj = sensorsArr.createNestedObject();
    sensorsObj["temperature"] = temperature;
    sensorsObj["humidity"] = humidity;
    sensorsObj["timestamp"] = now();
    doc["fileSize"] = sensorsCapacity;
    doc["next"] = 0;

    serializeJson(doc, file);
  }

  Serial.println(file.size());

  file.close();
}

void setupWiFi()
{
  Serial.print("Configuring access point...");

  loadCredentials();

  WiFi.softAP(strlen(ssid) > 0 ? ssid : softAP_ssid, strlen(password) > 0 ? password : softAP_password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);

  // ROUTES

  server.on("/", []() {
    server.send(200, "text/plain", "This is an index page.");
  });
  server.on("/sensors/", HTTP_GET, handleSensorsGET);
  server.on("/frequency/", HTTP_GET, handleFrequencyGET);
  server.on("/frequency/", HTTP_POST, handleFrequencyPOST);
  server.on("/time/", HTTP_POST, handleTimeUpdatePOST);
  server.on("/systeminfo/", HTTP_GET, handleSystemInfoGET);
  server.on("/accesspoint/", HTTP_POST, handleAccessPointPOST);
  server.on("/sensors/time", HTTP_GET, handleSensorTimesGET);

  // END-ROUTES

  server.begin();
  Serial.println("HTTP server started");
}

void setup()
{
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.setTimeout(2000);
  while (!Serial) {}
  Serial.println("Setup start");

  bool success = LittleFS.begin();

  if (success) {
    Serial.println("File system mounted with success");
  } else {
    Serial.println("Error mounting the file system");
  }

  bool format = LittleFS.format();

  if (format) Serial.println("filesystem was formatted");

  LittleFS.info(fs_info);
  printf("LittleFS: %lu of %lu bytes used.\n",
         fs_info.usedBytes, fs_info.totalBytes);

  am2320.begin();
  setupWiFi();

  setSyncInterval(86400);

  Serial.println("Setup done");
}

void loop()
{
  server.handleClient();
  unsigned long currentMillis = millis();

  if (timeStatus() != timeNotSet && currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    if (!fileFull) saveSensorData();
  }
}
