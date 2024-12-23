#include "DHTesp.h"
#include <WiFi.h>
#include <HTTPClient.h>


//Дані Wi-Fi 
#define WIFI_SSID "o2-WLAN-AE70"
#define WIFI_PASSWORD "8274TYKDKP3X7LD4"

//Серійний номер пристрою
const char* serialNumber = "IOT-12345";

//URL серверу
const char* serverUrl = "http://192.168.1.10:3001/api/iot/data";

//Папаметри датчика
const int DHT_PIN = 15;
DHTesp dhtSensor;

//Підключеня
void setup() {
  Serial.begin(115200);
  //Підключення до Wi-Fi 
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println(" Connected!");

  //Друк айпі
   Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  //Підключення датчика
  dhtSensor.setup(DHT_PIN, DHTesp::DHT22);
}

void loop() {
  //Зчитуємо дані
  TempAndHumidity  data = dhtSensor.getTempAndHumidity();
  Serial.println("Temp: " + String(data.temperature, 2) + "°C");
  Serial.println("Humidity: " + String(data.humidity, 1) + "%");
  Serial.println("---");

//Визначаємо тип шкіри
  String skinType = determineSkinType(data.humidity); // Определяем тип кожи (пример функции ниже)
Serial.println("Type"+ skinType);
//Надсилаємо данні
if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Открываем соединение с сервером
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Формируем JSON-пейлоад
    String payload = "{";
    payload += "\"serialNumber\": \"" + String(serialNumber) + "\",";
    payload += "\"temperature\": " + String(data.temperature, 2) + ",";
    payload += "\"moisture\": " + String(data.humidity, 1) + ",";
    payload += "\"skinType\": \"" + skinType + "\"";
    payload += "}";

    // Отправка POST-запроса
    int httpResponseCode = http.POST(payload);

    // Логируем ответ сервера
    Serial.print("Response code: ");
    Serial.println(httpResponseCode);

    http.end(); // Закрываем соединение
  } else {
    Serial.println("WiFi not connected");
  }

  delay(10000); // Периодическая отправка каждые 5 секунд
}

// Функция для определения типа кожи
String determineSkinType(float moisture) {
  if (moisture > 70) {
    return "Oily";
  } else if (moisture < 40) {
    return "Dry";
  } else {
    return "Normal";
  }
}