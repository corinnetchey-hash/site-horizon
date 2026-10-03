# À faire — Kapsule New (thème en ligne depuis le 30/09)

Kapsule New (202251993352) est publié : les modifications ne peuvent plus être envoyées
directement. Soit dupliquer le thème et travailler sur la copie, soit coller le code à la main.

## En attente

- [x] **Marques en 2 colonnes sur mobile** — envoyé sur Kapsule New le 01/10 (thème repassé en non publié) (accueil « Les maisons de la sélection » + Boutique).
      Déjà dans `assets/kapsule.css` de cette branche (commit « Mobile: brands in a tidy
      two-column alphabetical list »), mais pas encore sur la boutique en ligne.
      Bloc à ajouter à la fin de `assets/kapsule.css` : voir la règle `@media (max-width: 699px)`
      commentée « Brands: a tidy two-column list… ».

- [x] **Détection automatique des marques** (02/10) — envoyé sur Kapsule New le 02/10 : `snippets/kapsule-brand-handles.liquid` (nouveau),
      `snippets/kapsule-house-list.liquid`, `snippets/kapsule-brand.liquid`, `config/settings_schema.json`.
      Une collection dont les produits s'appellent « … - Marque » devient une marque automatiquement.

- [x] **Noms de marque écrits différemment** (03/10) — « … - ThreeDaysLove » dans la collection
      3DAYSLOVE n'était pas reconnu. Corrigé (`snippets/kapsule-brand-key.liquid`) et envoyé sur la copie
      **« Kapsule New — mise à jour 03/10 »** (202824581384), à publier à la place de Kapsule New.
      Méthode retenue : quand le thème est en ligne, dupliquer, corriger la copie, puis publier la copie.
