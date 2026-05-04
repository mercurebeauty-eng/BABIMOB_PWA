# Protocole d'Excellence Babimob (Standard de Rigueur)

Ce document définit le standard de qualité et de réflexion pour toutes les interventions sur la Babimob PWA.

## 1. Phase de Réflexion (Avant toute modification)
- **Analyse du Contexte** : Lire au moins 50 lignes au-dessus et en-dessous de la zone ciblée.
- **Audit des Dépendances** : Identifier tous les imports nécessaires (Supabase client, providers, hooks, icônes).
- **Simulation d'Impact** :
    - Comment ce changement affecte-t-il le rendu sur mobile (iPhone SE) ?
    - Y a-t-il des conteneurs parents avec `overflow: hidden` ou `position: relative` ?
    - Ce changement nécessite-t-il une mise à jour de la base de données (RLS, Triggers) ?

## 2. Phase d'Implémentation
- **Zéro Doublon** : Vérifier manuellement qu'aucune propriété CSS ou variable n'est définie deux fois.
- **Typage Strict** : S'assurer que chaque nouvelle variable ou état est correctement typé (TypeScript).
- **Fallback UI** : Toujours prévoir un état de chargement ou une valeur par défaut pour les données asynchrones.

## 3. Phase de Vérification (Avant Commit)
- **Auto-Linter** : Relire le bloc de code final pour détecter les erreurs d'inattention (points-virgules manquants, parenthèses non fermées).
- **Vérification du Build** : Anticiper les erreurs de compilation (fichiers manquants, imports circulaires).
- **Cohérence Design** : Vérifier que les couleurs et espacements respectent le système de design premium (couleurs HSL, variables CSS).

## 4. Communication & Sync
- **Commit Granulaire** : Un commit par correction logique.
- **Transparence** : Expliquer *pourquoi* une solution technique a été choisie plutôt qu'une autre.
- **Pull/Push** : Toujours synchroniser avec `main` pour éviter les conflits.

---
*Ce protocole est activé et doit être consulté avant chaque action.*
