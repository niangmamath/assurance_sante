const workflowConfig = {
  "name": "Relance Client par Email",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "relance-client",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "849b7dee-020b-46e9-9b99-5839ebc86607",
      "name": "Réception Dashboard",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        240,
        304
      ],
      "webhookId": "ca3017ea-ae9d-4225-ba3b-28d236e0a523"
    },
    {
      "parameters": {
        "modelId": {
          "__rl": true,
          "value": "gpt-4.1-mini",
          "mode": "list",
          "cachedResultName": "GPT-4.1-MINI"
        },
        "responses": {
          "values": [
            {
              "role": "system",
              "content": "=Tu es un conseiller en assurance santé professionnel et bienveillant.\n\nUn opérateur veut envoyer un email à ce client. Rédige un email court et personnalisé à partir des informations suivantes :\n\n- Nom du client : {{ $json.body.nom }}\n- Statut : {{ $json.body.statut }}\n- Besoin exprimé : {{ $json.body.besoin }}\n- Note de l'opérateur : {{ $json.body.message }}\n- Nombre de relances déjà envoyées : {{ $json.body.nb_relances }}\n\nRègles :\n1. Maximum 5 phrases\n2. Adapter le ton selon le statut :\n   - \"contacté\" → ton d'introduction, chaleureux, présenter l'offre\n   - \"en_discussion\" → ton de suivi, rappeler le besoin, proposer un rendez-vous\n   - \"converti\" → ton de fidélisation, remercier, proposer un upsell ou un suivi\n3. Si nb_relances >= 3, adopter un ton de dernière chance, bienveillant et sans pression\n4. Intégrer naturellement la note de l'opérateur dans le message\n5. Terminer par un appel à l'action clair (répondre à cet email ou prendre RDV)\n6. Signer au nom de \"L'équipe Assurance Santé\"\n7. Répondre UNIQUEMENT avec le corps de l'email, sans objet ni balise"
            }
          ]
        },
        "builtInTools": {},
        "options": {}
      },
      "id": "b1b7c8e1-f4c5-4183-bdb0-5200869934f3",
      "name": "Génération Email IA",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "typeVersion": 2.1,
      "position": [
        464,
        304
      ],
      "credentials": {
        "openAiApi": {
          "id": "Ql3hw7O1L0KymGBP",
          "name": "n8n free OpenAI API credits"
        }
      }
    },
    {
      "parameters": {
        "sendTo": "={{ $(\"Réception Dashboard\").item.json.body.email }}",
        "subject": "={{ $(\"Réception Dashboard\").item.json.body.nom }} — suivi de votre demande",
        "emailType": "text",
        "message": "={{ $json.output[0].content[0].text }}",
        "options": {}
      },
      "id": "59e53939-8986-48de-8ce6-4ec2fbc34e6a",
      "name": "Envoi Email Gmail",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2.2,
      "position": [
        816,
        304
      ],
      "webhookId": "9af241c9-782d-4d1d-801d-fe769f9f19e7",
      "credentials": {
        "gmailOAuth2": {
          "id": "HQPLZ9ayHrBjwR5v",
          "name": "Gmail OAuth2 API"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"success\": true, \"message_envoye_a\": $(\"Réception Dashboard\").item.json.body.email, \"statut_client\": $(\"Réception Dashboard\").item.json.body.statut, \"timestamp\": $now.toISO() } }}",
        "options": {}
      },
      "id": "9ccc34ec-37fe-4e42-8c68-06094e251e90",
      "name": "Réponse Dashboard",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.5,
      "position": [
        1040,
        304
      ]
    }
  ],
  "pinData": {},
  "connections": {
    "Réception Dashboard": {
      "main": [
        [
          {
            "node": "Génération Email IA",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Génération Email IA": {
      "main": [
        [
          {
            "node": "Envoi Email Gmail",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Envoi Email Gmail": {
      "main": [
        [
          {
            "node": "Réponse Dashboard",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "binaryMode": "separate"
  },
  "versionId": "62bef693-a706-4f00-8f21-1c201e75d304",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "b4ff2a2995d39d1f78c9d81b80ff5aa4620b19f169612669712de3889b1f20f3"
  },
  "id": "xu8dlNnz5quottrJ",
  "tags": []
};

module.exports = workflowConfig;