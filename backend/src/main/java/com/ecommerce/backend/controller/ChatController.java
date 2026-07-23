package com.ecommerce.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Value("${ai.api.key}")
    private String apiKey;

    @PostMapping
    public ResponseEntity<?> chatWithAI(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");

        try {
            
            String prompt = "Ești un asistent virtual prietenos pentru un magazin online de top. " +
                    "Răspunde scurt, la obiect, prietenos și în limba română. " +
                    "Mesajul clientului este: " + userMessage;

            
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> parts = Map.of("parts", List.of(textPart));
            Map<String, Object> bodyMap = Map.of("contents", List.of(parts));

            
            ObjectMapper objectMapper = new ObjectMapper();
            String requestBody = objectMapper.writeValueAsString(bodyMap);

            
            String modelName = "gemini-3.5-flash"; 
            
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey.trim();

            
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            
            HttpResponse<String> httpResponse = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            
            Map<String, Object> responseMap = objectMapper.readValue(httpResponse.body(), Map.class);

            
            if (responseMap.containsKey("error")) {
                System.err.println("Eroare oficială de la Google API: " + responseMap.get("error"));
                return ResponseEntity.ok(Map.of("reply", "Eroare de configurare API. Te rog să te uiți în consola de Java!"));
            }

            
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseMap.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
            String aiResponseText = (String) resParts.get(0).get("text");

            return ResponseEntity.ok(Map.of("reply", aiResponseText));

        } catch (Exception e) {
            System.err.println("Eroare de sistem la AI: ");
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("reply", "Ne pare rău, asistentul nostru întâmpină dificultăți tehnice."));
        }
    }
}