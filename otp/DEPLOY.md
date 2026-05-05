# 🚀 Déploiement OTP pour BABIMOB

Pour faire tourner OpenTripPlanner (OTP) de manière stable avec les données d'Abidjan, voici la recommandation d'hébergement.

## 🏢 Choix de l'hébergeur

| Critère | Hetzner (Recommandé) | Railway |
| :--- | :--- | :--- |
| **Type** | VPS (Cloud Server) | PaaS |
| **Coût** | ~4.50€ / mois (Modèle CX22) | Pay-as-you-go (Plus cher pour 2GB+ RAM) |
| **RAM** | **4 GB** (Idéal pour OTP) | Limité (Risque de crash sur plan gratuit) |
| **CPU** | 2 vCPU dédiés | Partagé |
| **Facilité** | Moyenne (Ligne de commande) | Facile (Interface web) |

**Verdict** : Utilise **Hetzner**. Pour le prix d'un café, tu as une machine dédiée qui ne plantera pas lors des calculs d'itinéraires complexes.

---

## 🛠 Procédure de déploiement (Hetzner)

1. **Créer un serveur** : Choisis `Ubuntu 22.04` ou `Docker` sur Hetzner Cloud.
2. **Installer Docker** (si pas déjà fait) :
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. **Préparer les données** :
   Sur ton PC local, lance le script pour préparer les fichiers :
   ```bash
   cd otp
   ./fetch_data.sh
   ```
4. **Envoyer sur le serveur** :
   ```bash
   rsync -avz ./otp root@TON_IP:/root/
   ```
5. **Démarrer** :
   ```bash
   ssh root@TON_IP
   cd otp
   docker compose up -d --build
   ```

## 🔌 Branchement PWA

Une fois déployé, ajoute l'URL de ton serveur dans le fichier `.env.local` de la PWA :
```env
NEXT_PUBLIC_OTP_URL=http://TON_IP:8080/otp/routers/default/index/graphql
```

---

## 💡 Notes sur la mémoire
OTP est gourmand. Si tu vois des erreurs `OutOfMemory`, modifie le `Dockerfile` ou le `docker-compose.yml` pour augmenter `-Xmx1500m` à `-Xmx2000m`.
