# Google Search Console, Bing Webmaster Tools & Analytics — KREOVYA

## Préparation technique (déjà en place côté site)

- ✅ `sitemap.xml` à jour avec les 10 pages réelles du site
- ✅ `robots.txt` pointe vers le sitemap, autorise le crawl complet
- ✅ Balises `canonical` uniques sur chaque page
- ✅ HTTPS actif (kreovya.com)
- ✅ Aucune redirection cassée détectée
- ✅ Metadata (title/description) unique par page
- ✅ Données structurées (JSON-LD) en place

## Étapes à faire dans Google Search Console

1. Va sur [search.google.com/search-console](https://search.google.com/search-console)
2. Clique **"Ajouter une propriété"** → choisis **"Préfixe d'URL"** → entre `https://kreovya.com/`
3. Vérifie la propriété — méthode recommandée : **balise HTML** (Google te donne une balise `<meta>` à coller dans le `<head>` de `index.html`, ou fichier HTML à uploader à la racine). Dis-le-moi et je l'ajoute.
4. Une fois vérifié, va dans **Sitemaps** → colle `sitemap.xml` → Envoyer
5. Attends quelques jours, puis vérifie l'état d'indexation sous **Pages** (Couverture)
6. Utilise **Inspection de l'URL** pour vérifier manuellement que `/`, `/creation-site-internet-sherbrooke.html`, `/services.html` et `/demarrer-projet.html` sont bien indexées — au besoin, clique **"Demander une indexation"**
7. Après quelques semaines de données, surveille sous **Performances** :
   - Impressions (combien de fois le site apparaît dans les résultats)
   - Clics
   - CTR (taux de clic)
   - Position moyenne
8. Repère les **requêtes** qui génèrent des impressions mais peu de clics — ce sont des opportunités d'améliorer les titres/descriptions
9. Repère les **pages** qui reçoivent le plus de trafic — ce sont tes meilleures pages à renforcer avec plus de contenu/liens internes

## Bing Webmaster Tools

Bing partage une partie de son index avec les résultats DuckDuckGo/Yahoo — vaut la peine pour un effort minimal.

1. Va sur [bing.com/webmasters](https://www.bing.com/webmasters)
2. La méthode la plus rapide : **importer directement depuis Google Search Console** (Bing propose cette option — connecte ton compte Google, ça copie automatiquement la propriété vérifiée et le sitemap)
3. Sinon, vérification manuelle similaire à Google (balise HTML)
4. Soumets `https://kreovya.com/sitemap.xml`

Aucune stratégie différente nécessaire — la compatibilité technique du site (sitemap propre, HTML valide, HTTPS) suffit pour les deux moteurs.

---

## Google Analytics 4 (GA4)

**Pas encore installé** — le code du site a déjà un système d'événements prêt (`trackEvent()` dans `app.js`), mais il ne pousse nulle part tant que GA4 n'est pas branché.

### Ce qu'il te faut de mon côté

1. Crée un compte GA4 sur [analytics.google.com](https://analytics.google.com) (gratuit)
2. Crée une propriété "KREOVYA" → un flux de données "Web" → URL `https://kreovya.com`
3. Copie ton **ID de mesure** (format `G-XXXXXXXXXX`)
4. Envoie-le-moi — j'ajoute le script GA4 sur toutes les pages et je branche les événements suivants, déjà prévus dans le code :

| Événement | Déclenché quand |
|---|---|
| `start_project` | Clic sur "Démarrer un projet" (header, hero, CTA final, etc.) |
| `project_view` | Consultation d'une page service |
| `form_submit` | Soumission réussie du formulaire (contact ou démarrer-projet) |
| `contact_click` | Clic sur un lien courriel/téléphone |

Des événements additionnels (`phone_click`, `service_view`, `form_start`, `form_step`) peuvent être ajoutés facilement une fois GA4 branché — ils suivent le même système.

### UTM pour le trafic Google Business

Une fois les liens Google Business configurés (site web, bouton "Réserver", posts), ajoute des paramètres UTM pour les distinguer dans GA4 :

```
https://kreovya.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp_profile
```

Je peux préparer les liens UTM exacts pour chaque emplacement (fiche principale, posts, etc.) une fois la fiche Google Business créée.
