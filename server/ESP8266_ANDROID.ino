#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include "Adafruit_Sensor.h"
#include "Adafruit_AM2320.h"
#include "LittleFS.h"

//////////////////////
// WiFi Definitions //
//////////////////////
#ifndef APSSID
#define APSSID "ESP_ap"
#define APPSK  "123123123"
#endif

const char *ssid = APSSID;
const char *password = APPSK;

WiFiEventHandler gotIpEventHandler, disconnectedEventHandler;

ESP8266WebServer server(80);
Adafruit_AM2320 am2320 = Adafruit_AM2320();

unsigned long previousMillis = 0;        // will store last time LED was updated

long interval = 60000; // interval at which to take snapshot (milliseconds) 300000 = 5min

FSInfo fs_info;

void handleSensors() {
  String result;
  Serial.println("Reading from file");
  File file = LittleFS.open("/sensors.txt", "r");

  while (file.available()) {
    result += (char)file.read();
  }

  file.close();

  result += "]}";
  server.send(200, "application/json", result);
}

void handleFrequencyPOST() {
  String result;
  if (server.hasArg("val")) {
    String arg = server.arg("val");

    interval = arg.toInt();

    result += "{\"STATUS\": \"OK\"}";
    Serial.print("Interval updated! New interval: ");
    Serial.print(interval);
    Serial.print("ms");
    Serial.println("");
    server.send(200, "application/json", result);
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

  File fileToWrite = LittleFS.open("/sensors.txt", "w");

  if (!fileToWrite) {
    Serial.println("There was an error opening the file for writing");
    return;
  }

  if (fileToWrite.print("{\"sensors\": [")) {
    Serial.println("File was written");
  } else {
    Serial.println("File write failed");
  }

  LittleFS.info(fs_info);
  printf("LittleFS: %lu of %lu bytes used.\n",
         fs_info.usedBytes, fs_info.totalBytes);

  am2320.begin();
  setupWiFi();

  Serial.println("Setup done");
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
  doc["timestamp"] = timestamp;

  serializeJson(doc, Serial);

  Serial.println("");

  return doc.as<String>();
}

void saveSensorData() {
  File file = LittleFS.open("/sensors.txt", "a");
  if (!file) {
    Serial.println("Error opening file for writing");
    return;
  }

  String data = dataToJSON(previousMillis);

  if (file.size() > 50) {
    data = ',' + data;
  }

  int bytesWritten = file.println(data);

  if (bytesWritten > 0) {
    Serial.print(bytesWritten);
    Serial.print(" bytes were written.");
    Serial.println("");

    LittleFS.info(fs_info);
    printf("LittleFS: %lu of %lu bytes used.\n",
           fs_info.usedBytes, fs_info.totalBytes);
  } else {
    Serial.println("File write failed");
  }
  file.close();
}



void setupWiFi()
{
  Serial.print("Configuring access point...");

  WiFi.softAP(ssid, password);

  IPAddress myIP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(myIP);

  // ROUTES

  server.on("/", []() {
    server.send(200, "text/plain", "This is an index page.");
  });
  server.on("/sensors/", HTTP_GET, handleSensors);
  server.on("/frequency/", HTTP_GET, handleFrequencyGET);
  server.on("/frequency/", HTTP_POST, handleFrequencyPOST);

  // END-ROUTES

  server.begin();
  Serial.println("HTTP server started");
}

void loop()
{
  server.handleClient();
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    saveSensorData();
  }
}
