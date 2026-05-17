# 🛠️ Refactoring LiveKit - Guide de résolution

## Problème identifié
LiveKit ne fonctionne pas actuellement dans l'application. Quand un utilisateur ouvre un salon vocal, la connexion échoue.

## Causes probables

### 1. Variables d'environnement manquantes
Le fichier `.env` n'existe pas dans le dossier `/workspace/pwa/`. Les variables suivantes sont requises :

```env
LIVEKIT_API_KEY=votre_clé_api
LIVEKIT_API_SECRET=votre_secret_api
NEXT_PUBLIC_LIVEKIT_URL=wss://votre-projet.livekit.cloud
```

### 2. Configuration LiveKit
- Vérifiez que votre projet LiveKit est actif sur https://cloud.livekit.io
- Générez une nouvelle paire de clés API si nécessaire
- Assurez-vous que l'URL WebSocket est correcte

## Modifications apportées

### ✅ VoiceRoomUI.tsx refactorisé
- **Suppression des hooks LiveKit non utilisés** : `useLocalParticipant` et `useRemoteParticipants` ont été retirés car ils causaient des erreurs quand LiveKit n'est pas connecté
- **Gestion locale de l'état de parole** : L'état `speakingStates` permet maintenant de gérer l'affichage visuel sans dépendre directement de LiveKit
- **Code plus robuste** : Le composant peut maintenant s'afficher même si LiveKit n'est pas configuré

### ✅ .env.example mis à jour
Ajout des variables LiveKit nécessaires avec des commentaires explicatifs.

## Étapes pour résoudre le problème

### Étape 1 : Créer un compte LiveKit (si ce n'est pas fait)
1. Rendez-vous sur https://cloud.livekit.io
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez vos identifiants API

### Étape 2 : Configurer les variables d'environnement
Créez un fichier `.env.local` dans `/workspace/pwa/` :

```bash
cd /workspace/pwa
cp .env.example .env.local
```

Puis éditez `.env.local` avec vos vraies valeurs :
```env
LIVEKIT_API_KEY=AKxxxxxx...
LIVEKIT_API_SECRET=votre_secret_complet
NEXT_PUBLIC_LIVEKIT_URL=wss://votre-projet.livekit.cloud
```

### Étape 3 : Redémarrer l'application
```bash
npm run dev
```

### Étape 4 : Tester un salon vocal
1. Allez dans l'onglet Gbairai
2. Cliquez sur "Lancer un salon"
3. Entrez un titre et choisissez un mode
4. Cliquez sur "LANCER LE GBAIRAI"
5. Vous devriez maintenant pouvoir rejoindre le salon sans erreur

## Architecture actuelle

```
VoiceRoomProvider (Context)
    ├── Génère le token LiveKit via generateLiveKitToken()
    ├── Connecte LiveKitRoom quand token + URL sont présents
    └── Fournit isMuted, joined, activeRoom aux composants

VoiceRoomPageClient
    ├── Utilise useVoiceRoom hook pour données métier (Supabase)
    ├── Utilise useVoiceRoom context pour état LiveKit
    └── Affiche VoiceRoomUI ou écrans de chargement/erreur

VoiceRoomUI
    ├── Affiche les participants, chat, contrôles
    ├── Gère l'état de parole localement (pour l'UI)
    └── Ne dépend plus directement des hooks LiveKit
```

## Prochaines améliorements possibles

1. **WebAudio API** : Ajouter une détection audio réelle pour l'animation des visualiseurs
2. **Reconnexion automatique** : Gérer les déconnexions réseau
3. **Qualité réseau** : Afficher l'état de connexion (bandeau orange/rouge)
4. **Enregistrement** : Permettre d'enregistrer les salons
5. **Partage d'écran** : Pour les modes "Hot Seat" et "Débat"

## Dépannage avancé

### Erreur "Configuration serveur incomplète"
→ Vérifiez que LIVEKIT_API_KEY et LIVEKIT_API_SECRET sont bien définies cōté serveur (.env.local)

### Erreur de connexion WebSocket
→ Vérifiez que NEXT_PUBLIC_LIVEKIT_URL commence par `wss://`
→ Testez l'URL dans un navigateur avec un outil comme https://www.websocket.org/echo.html

### Token expiré
→ Les tokens sont valides 2h. Si le problème persiste après 2h, rafraîchissez la page

### Participants ne se voient pas
→ Vérifiez que tous les utilisateurs utilisent la MÊME URL LiveKit
→ Vérifiez les logs console pour des erreurs CORS

## Contact
Pour toute question supplémentaire, consultez la documentation officielle :
- LiveKit : https://docs.livekit.io
- Supabase Realtime : https://supabase.com/docs/guides/realtime
