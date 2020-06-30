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

char ssid[32] = "";
char password[32] = "";

ESP8266WebServer server(80);
Adafruit_AM2320 am2320 = Adafruit_AM2320();

unsigned long previousMillis = 0; // will store last time LED was updated

long interval = 60000; // interval at which to take snapshot (milliseconds) 300000 = 5min

long heapStart = ESP.getFreeHeap();

long minHeapThreshold = 10000;

bool fileFull = false;

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
  String result = "{\"memory\": ";
  result +=  "{\"free\": ";
  result += fh;
  result += ", \"start\": ";
  result += heapStart;
  result += "},";
  result += "\"filesystem\": ";
  result +=  "{\"used\": ";
  result += fs_info.usedBytes;
  result += ", \"total\": ";
  result += fs_info.totalBytes;
  result += "}";
  result += "}";
  server.send(200, "application/json", result);
}

void handleTimeUpdateGET() {
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
  char character[2];
  char firstObj[65];
  char lastObj[65];
  char reverse[65];
  long fileSize;
  int lenReverse;
  String result;
  int i = 0;
  Serial.println("Reading from file");
  File file = LittleFS.open("/sensors.txt", "r");

  fileSize = file.size();

  while (file.available()) {
    character[0] = file.read();
    character[1] = '\0';

    firstObj[i] = character[0];
    i++;
    if (strcmp(character, "}") == 0) {
      firstObj[i] = '\0';
      break;
    }
  }

  for (i = 0; i < 65; i++) {
    file.seek(fileSize - i, SeekSet);

    character[0] = file.read();
    character[1] = '\0';

    reverse[i] = character[0];

    if (strcmp(character, "{") == 0) {
      reverse[i + 1] = '\0';
      break;
    }
  }

  lenReverse = strlen(reverse);
  for (i = 0; i < lenReverse; i++) {
    lastObj[i] = reverse[lenReverse - 1 - i];
  }

  lastObj[i - 1] = '\0';

  const size_t capacity = 3 * JSON_OBJECT_SIZE(2);
  DynamicJsonDocument doc(capacity);

  deserializeJson(doc, firstObj);
  long t1 = doc["timestamp"];

  deserializeJson(doc, lastObj);
  long t2 = doc["timestamp"];

  result += "{\"timeStart\": ";
  result += t1; //s -> ms
  result += ",\"timeLast\":";
  result += t2; //s -> ms
  result += "}";

  server.send(200, "application/json", result);
}

void handleSensorsGET() {
  if (timeStatus() == timeNotSet) {
    server.send(500, "application/json", "{\"status\": \"Time needs to be updated\"}");
  }

  String result;
  long bytesRead = 0;
  int i = 0;
  int readings = 0;
  long freeHeap;
  long fileSize;
  long offset;
  long maximum;
  char character[2];
  char sensorObj[65];
  bool maxReached = false;

  freeHeap = ESP.getFreeHeap();
  Serial.println(freeHeap);

  Serial.println("Reading from file");
  File file = LittleFS.open("/sensors.txt", "r");

  offset = server.hasArg("offset") ? server.arg("offset").toInt() : 0; // read from byte offset
  maximum = server.hasArg("maximum") ? server.arg("maximum").toInt() : -1; // read till byte maximum

  if (offset > 50) offset = findEntryPoint(offset, file); // ignore offsets less than 50b, since a data point is ~60b

  result += "{\"sensors\": [";

  // there is a ~44000b heap
  // file can be up to ~300000b
  // so we need a offset
  // we read from offset byte till our heap is at minHeapThreshold
  // after which we add "next" to result object
  // so client knows to set offset = next ( + 1 ? )

  file.seek(offset, SeekSet);

  while (file.available()) {
    freeHeap = ESP.getFreeHeap();
    character[0] = file.read();
    character[1] = '\0';

    sensorObj[i] = character[0];

    i++;
    bytesRead++;
    if (strcmp(character, "}") == 0) {
      sensorObj[i] = '\0';
      result += sensorObj;
      i = 0;
      readings++;
      if (freeHeap < minHeapThreshold || (maximum != -1 && bytesRead > maximum)) {
        maxReached = true;
        break;
      }
    }
  }

  fileSize = file.size();

  file.close();

  result += "]";

  if (maxReached) {
    result += ", \"next\": ";
    result += bytesRead;
  }
  if (fileFull) {
    result += ", \"full\": ";
    result += true;
  }

  result += ", \"size\": ";
  result += fileSize;

  result += "}";

  freeHeap = ESP.getFreeHeap();
  Serial.println(freeHeap);
  Serial.println("Got ");
  Serial.println(readings);

  server.send(200, "application/json", result);


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
  String result;

  result += "{\"interval\": ";
  result += interval;
  result += "}";

  server.send(200, "application/json", result);
}

//
// given offset and file, find's the next
// entry point (where the object ends),
// adds 3 bytes to offset (to remove the ,)
// and returns it.
//
long findEntryPoint(long offset, File &file) {
  char character[2];
  long bytes = 0;
  file.seek(offset, SeekSet);
  while (file.available()) {
    character[0] = file.read();
    character[1] = '\0';

    bytes++;
    if (strcmp(character, "}") == 0) {
      return (offset + bytes) + 3;
    }
  }
}

String dataToJSON (long timestamp = 0) {
  Serial.println("Reading sensors");
  while (isnan(am2320.readTemperature()) && isnan(am2320.readHumidity())) {
    Serial.println(am2320.readTemperature());
  }

  float temperature = am2320.readTemperature();
  float humidity = am2320.readHumidity();

  const size_t capacity = 3 * JSON_OBJECT_SIZE(2);
  DynamicJsonDocument doc(capacity);

  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["timestamp"] = now();

  serializeJson(doc, Serial);

  Serial.println("");

  return doc.as<String>();
}

void saveSensorData() {
  /*
    LittleFS.info(fs_info);
    printf("LittleFS: %lu of %lu bytes used.\n",
         fs_info.usedBytes, fs_info.totalBytes);

    if (fs_info.totalBytes - fs_info.usedBytes < 1000) {
    fileFull = true;
    return;
    }
  */

  File file = LittleFS.open("/sensors.txt", "a");
  if (!file) {
    Serial.println("Error opening file for writing");
    return;
  }

  String data = dataToJSON(previousMillis);

  if (file.size() > 1) {
    data = ',' + data;
  }

  int bytesWritten = file.println(data);

  if (bytesWritten > 0) {
    Serial.print(bytesWritten);
    Serial.print(" bytes were written.");
    Serial.println("");
  } else {
    Serial.println("File write failed");
  }
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
  server.on("/time/", HTTP_POST, handleTimeUpdateGET);
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

  /*
    File file = LittleFS.open("/sensors.txt", "w");
    if (file) {
    file.print("");
    }
    file.close();
  */

  LittleFS.info(fs_info);
  printf("LittleFS: %lu of %lu bytes used.\n",
         fs_info.usedBytes, fs_info.totalBytes);

  am2320.begin();
  setupWiFi();

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
