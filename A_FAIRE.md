# À faire — Kapsule New (thème en ligne depuis le 30/09)

Kapsule New (202251993352) est publié : les modifications ne peuvent plus être envoyées
directement. Soit dupliquer le thème et travailler sur la copie, soit coller le code à la main.

## En attente

- [x] **Marques en 2 colonnes sur mobile** — envoyé sur Kapsule New le 01/10 (thème repassé en non publié) (accueil « Les maisons de la sélection » + Boutique).
      Déjà dans `assets/kapsule.css` de cette branche (commit « Mobile: brands in a tidy
      two-column alphabetical list »), mais pas encore sur la boutique en ligne.
      Bloc à ajouter à la fin de `assets/kapsule.css` : voir la règle `@media (max-width: 699px)`
      commentée « Brands: a tidy two-column list… ».

- [ ] **Détection automatique des marques** (02/10) — prêt dans cette branche, à envoyer sur
      Kapsule New dès qu'il n'est plus publié : `snippets/kapsule-brand-handles.liquid` (nouveau),
      `snippets/kapsule-house-list.liquid`, `snippets/kapsule-brand.liquid`, `config/settings_schema.json`.
      Une collection dont les produits s'appellent « … - Marque » devient une marque automatiquement.
