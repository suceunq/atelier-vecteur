# Atelier Vecteur

Atelier Vecteur est un éditeur vectoriel de bureau construit avec React, TypeScript et Tauri. Il permet de créer et modifier des illustrations SVG sans dépendre d'un service en ligne.

## Fonctionnalités

- rectangles, ellipses, lignes, polygones, plume et texte ;
- sélection, déplacement, rotation, redimensionnement et édition de nœuds ;
- calques, groupes et plans de travail multiples ;
- remplissages, contours, dégradés, motifs, flou et ombres ;
- import d'images PNG, JPEG, GIF et WebP, avec vectorisation ;
- conversion du texte en tracés ;
- export SVG et PNG ;
- historique annuler/rétablir et sauvegarde de récupération ;
- thème sombre, grille, magnétisme et mises à jour signées ;
- interface localisée en français, anglais, espagnol et allemand, avec détection de la langue système.
- fenêtre de bienvenue facultative et soutien du projet via PayPal.

## Langues

Au premier lancement, Atelier Vecteur utilise la langue du système si elle est prise en charge, sinon l’anglais. La langue peut être changée immédiatement depuis **Affichage > Paramètres**. La préférence est conservée localement.

Tous les nouveaux textes visibles doivent être ajoutés aux quatre catalogues de `src/i18n/index.ts`. Le test i18n vérifie qu’aucune clé ne manque dans une langue.

## Configuration des dons

Le bouton de don n’accepte que les adresses HTTPS officielles `paypal.com` et `paypal.me`. Le lien partagé par défaut se trouve dans `public/runtime-config.json`. L’application relit automatiquement ce fichier depuis la branche `master` sur GitHub au démarrage : modifier puis publier uniquement ce fichier suffit donc à changer la destination pour tous les utilisateurs, sans recompiler ni republier l’installateur.

Chaque installation peut également définir un remplacement local dans **Affichage > Paramètres > Soutien du projet**. Un champ vide utilise le lien partagé. Si l’application est hors ligne, le remplacement local continue de fonctionner ; sans remplacement, le bouton reste désactivé jusqu’à ce que la configuration partagée soit accessible.

## Développement

Prérequis : Node.js, npm, Rust et les dépendances système de [Tauri 2](https://v2.tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev
```

Commandes utiles :

```bash
npm test                 # tests TypeScript
npm run build            # type-check et build web
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build      # application et installateurs
```

## Raccourcis principaux

| Action | Raccourci |
| --- | --- |
| Sélection, rectangle, ellipse, ligne | `V`, `R`, `E`, `L` |
| Polygone, plume, texte | `G`, `P`, `T` |
| Enregistrer | `Ctrl+S` |
| Annuler / rétablir | `Ctrl+Z` / `Ctrl+Y` |
| Copier / coller / dupliquer | `Ctrl+C` / `Ctrl+V` / `Ctrl+D` |
| Grouper / dégrouper | `Ctrl+G` / `Ctrl+Maj+G` |
| Supprimer | `Suppr` ou `Retour arrière` |

Sur macOS, utiliser `Cmd` à la place de `Ctrl`.

## Format de projet

Les fichiers `.svgatelier` sont des archives ZIP contenant :

- `manifest.json`, avec la version du format et celle de l'application ;
- `scene.json`, avec les plans de travail, calques, objets et ressources.

Le chargeur refuse les versions de format plus récentes que celles prises en charge et valide les identifiants, références et propriétés essentielles avant d'ouvrir une scène.

## Architecture

- `src/tools` : outils d'interaction ;
- `src/canvas` : rendu et manipulation du canevas ;
- `src/scene` : modèle, géométrie, validation et sérialisation SVG ;
- `src/store` : état Zustand, historique et commandes ;
- `src/panels` : panneaux de propriétés ;
- `src/io` : projets, exports, images et mises à jour ;
- `src-tauri` : fichiers natifs, rendu PNG, polices et vectorisation.

Les versions applicatives de `package.json`, `src-tauri/Cargo.toml` et `src-tauri/tauri.conf.json` doivent rester synchronisées lors d'une publication.

## Publication

Les mises à jour sont distribuées par les releases GitHub et signées par Tauri. Ne jamais publier la clé privée de signature ; seule la clé publique appartient au dépôt.
