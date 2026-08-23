export interface ContentField {
  key: string; // unique within the page — referenced in the page component via t(key, fallback) or img(key, fallback)
  label: string; // shown to the Owner in the admin editor
  type: "text" | "textarea" | "image" | "gallery"; // "gallery" = an owner-managed list of photos (add/remove/reorder), read via list(key, fallbackArray)
  defaultValue: string; // shown as placeholder in the editor and used as the live fallback if the Owner hasn't set it. For "gallery" fields: JSON.stringify(string[]) of the current hardcoded photos.
}

export interface PageContentDef {
  pageKey: string;
  label: string;
  fields: ContentField[];
  previewPath: string; // public URL for this page, shown in the admin editor's live preview
}

// To make a new piece of text or a photo owner-editable on any page:
//   1. Add a field entry here.
//   2. In the page component, call useEditableContent("<pageKey>") and
//      replace the hardcoded text with t("<key>", "<current hardcoded text>")
//      (or <img> src with img("<key>", "<current hardcoded src>")).
// That's it — the admin editor at /admin/content picks it up automatically.
function activityPage(
  pageKey: string,
  label: string,
  heroTitle: string,
  heroSubtitle: string,
  heroImage: string,
  about1: string,
  about2: string,
  previewPath: string
): PageContentDef {
  return {
    pageKey,
    label,
    previewPath,
    fields: [
      { key: "heroImage", label: "Photo d'en-tête", type: "image", defaultValue: heroImage },
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: heroTitle },
      { key: "heroSubtitle", label: "Sous-titre", type: "text", defaultValue: heroSubtitle },
      { key: "about1", label: "À propos — paragraphe 1", type: "textarea", defaultValue: about1 },
      { key: "about2", label: "À propos — paragraphe 2", type: "textarea", defaultValue: about2 },
    ],
  };
}

export const PAGE_CONTENT_SCHEMA: PageContentDef[] = [
  {
    pageKey: "home",
    label: "Accueil — présentation",
    previewPath: "/",
    fields: [
      { key: "introTitle", label: "Titre — présentation du club", type: "text", defaultValue: "A Unique Sports Experience" },
      {
        key: "introText",
        label: "Texte — présentation du club",
        type: "textarea",
        defaultValue: "Le Club Gammarth offers a premium sports experience combining fitness, wellness, swimming pools, padel courts, restaurant, beach access and professional coaching.",
      },
      { key: "sport1Image", label: "Photo — Cardio & Musculation", type: "image", defaultValue: "/images/sports/musculation.jpg" },
      { key: "sport2Image", label: "Photo — Fitness Studio", type: "image", defaultValue: "/images/sports/fitness.jpg" },
      { key: "sport3Image", label: "Photo — Football Club", type: "image", defaultValue: "/images/sports/football.jpg" },
      { key: "sport4Image", label: "Photo — Piscine", type: "image", defaultValue: "/images/sports/pool.jpg" },
      { key: "relax1Image", label: "Photo — Restaurant", type: "image", defaultValue: "/images/relax/restaurant.jpg" },
      { key: "relax2Image", label: "Photo — Piscine & Terrasses", type: "image", defaultValue: "/images/relax/terrasses.jpg" },
      { key: "relax3Image", label: "Photo — Accès plage", type: "image", defaultValue: "/images/relax/plage.jpg" },
      {
        key: "galleryPreviewImages",
        label: "Galerie — aperçu sur la page d'accueil",
        type: "gallery",
        defaultValue: JSON.stringify([
          "/images/gallery/gallery1.jpg",
          "/images/gallery/gallery2.jpg",
          "/images/gallery/gallery3.jpg",
          "/images/gallery/gallery4.jpg",
          "/images/gallery/gallery5.jpg",
          "/images/gallery/gallery6.jpg",
        ]),
      },
    ],
  },
  activityPage(
    "activite-fight-club", "Activités — Fight Club",
    "Fight Club", "Boxe, MMA et arts martiaux pour tous niveaux",
    "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&h=600&fit=crop",
    "Notre Fight Club propose des cours de boxe anglaise, Muay Thai, Jiu-Jitsu et MMA. Que vous soyez débutant ou confirmé, nos coachs vous aideront à progresser.",
    "Un ring professionnel, des sacs de frappe et tout l'équipement nécessaire sont à votre disposition.",
    "/activites/fight-club"
  ),
  activityPage(
    "activite-fitness", "Activités — Fitness",
    "Fitness", "Améliorez votre condition physique avec nos programmes variés",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=600&fit=crop",
    "Nos cours de fitness sont conçus pour tous les niveaux, des débutants aux sportifs confirmés. Que vous cherchiez à perdre du poids, vous tonifier ou simplement rester en forme, nos coachs vous accompagnent dans votre progression.",
    "Avec plus de 15 cours par semaine, vous trouverez forcément un créneau qui correspond à votre emploi du temps.",
    "/activites/fitness"
  ),
  activityPage(
    "activite-foot-a-5", "Activités — Foot à 5",
    "Foot à 5", "Tournois, entraînements et matchs amicaux",
    "https://images.unsplash.com/photo-1575361204800-a2ed9e25f5ef?w=1200&h=600&fit=crop",
    "Notre terrain de foot à 5 synthétique est disponible pour les matchs amicaux, les entraînements et les tournois. Terrain de dernière génération avec éclairage pour les soirées.",
    "Des tournois sont organisés chaque mois avec des lots à gagner.",
    "/activites/foot-a-5"
  ),
  activityPage(
    "activite-kids", "Activités — Kids",
    "Kids", "Activités ludiques et sportives pour les 4-12 ans",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=1200&h=600&fit=crop",
    "Des cours spécialement conçus pour les enfants dans une ambiance ludique et sécurisée. Initiation au sport et développement des capacités motrices.",
    "Parce que le sport n'a pas d'âge, vos enfants s'amuseront tout en apprenant les bases de plusieurs disciplines.",
    "/activites/kids"
  ),
  activityPage(
    "activite-piscine", "Activités — Piscine",
    "Piscine", "Natation, aquagym et aquabike pour tous les niveaux",
    "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&h=600&fit=crop",
    "Notre piscine semi-olympique de 25m est chauffée toute l'année. Idéale pour la natation loisir, l'aquagym ou l'entraînement intensif.",
    "Des cours collectifs et particuliers sont dispensés par des maîtres-nageurs diplômés.",
    "/activites/piscine"
  ),
  activityPage(
    "activite-squash", "Activités — Squash",
    "Squash", "Terrain professionnel pour joueurs de tous niveaux",
    "https://images.unsplash.com/photo-1509475826633-fed577a2c71b?w=1200&h=600&fit=crop",
    "Notre terrain de squash est certifié pour la compétition. Mur en verre, parquet et éclairage professionnel.",
    "Cours particuliers et tournois organisés régulièrement.",
    "/activites/squash"
  ),
  {
    pageKey: "activites",
    label: "Activités",
    previewPath: "/activites",
    fields: [
      { key: "heroImage", label: "Photo d'en-tête", type: "image", defaultValue: "" },
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: "Une trentaine d'activités différentes !" },
      {
        key: "heroSubtitle",
        label: "Sous-titre",
        type: "textarea",
        defaultValue:
          "Que vous cherchiez à vous sculpter, vous dessiner, vous tonifier ou encore simplement vous amuser et vous défouler, une grande diversité de disciplines s'offrent à vous...",
      },
      {
        key: "heroQuote",
        label: "Citation",
        type: "text",
        defaultValue: "Parce que le sport n'a pas d'âge, sont également mis à votre disposition des cours pour enfants.",
      },
    ],
  },
  {
    pageKey: "actualites",
    label: "Actualités",
    previewPath: "/actualites",
    fields: [
      { key: "heroImage", label: "Photo d'en-tête", type: "image", defaultValue: "" },
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: "Restez informés" },
      {
        key: "heroSubtitle",
        label: "Sous-titre",
        type: "text",
        defaultValue: "Retrouvez toutes les dernières nouvelles, événements et annonces du club",
      },
    ],
  },
  {
    pageKey: "gallery",
    label: "Galerie",
    previewPath: "/gallery",
    fields: [
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: "Gallery" },
      { key: "heroImage", label: "Photo de couverture", type: "image", defaultValue: "/images/gallery/hero.jpg" },
      {
        key: "galleryFitness",
        label: "Photos — Fitness",
        type: "gallery",
        defaultValue: JSON.stringify([
          "/images/gallery/gallery1.jpg",
          "/images/gallery/gallery2.jpg",
          "/images/gallery/gallery3.jpg",
          "/images/gallery/gallery4.jpg",
          "/images/gallery/gallery5.jpg",
          "/images/gallery/gallery6.jpg",
        ]),
      },
      {
        key: "galleryPadel",
        label: "Photos — Padel",
        type: "gallery",
        defaultValue: JSON.stringify([
          "/images/gallery/courts-de-squash.jpg",
          "/images/gallery/salle-de-biking.jpg",
          "/images/gallery/vestiaires.jpg",
          "/images/gallery/salle-de-cross-training.jpg",
        ]),
      },
      {
        key: "galleryPool",
        label: "Photos — Piscine",
        type: "gallery",
        defaultValue: JSON.stringify([
          "/images/sports/pool.jpg",
          "/images/relax/plage.jpg",
          "/images/relax/terrasses.jpg",
        ]),
      },
    ],
  },
  {
    pageKey: "coaching",
    label: "Coaching",
    previewPath: "/coaching",
    fields: [
      { key: "heroImage", label: "Photo d'en-tête", type: "image", defaultValue: "" },
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: "Un coaching sur-mesure" },
      {
        key: "heroSubtitle",
        label: "Sous-titre",
        type: "textarea",
        defaultValue: "Nos coachs certifiés vous accompagnent vers vos objectifs, à votre rythme, avec un suivi personnalisé.",
      },
      { key: "card1Image", label: "Photo — carte 1", type: "image", defaultValue: "" },
      { key: "card1Title", label: "Titre — carte 1", type: "text", defaultValue: "Coaching individuel" },
      {
        key: "card1Text",
        label: "Texte — carte 1",
        type: "textarea",
        defaultValue: "Un programme 100% personnalisé, un suivi hebdomadaire et un coach dédié à vos objectifs.",
      },
      { key: "card2Image", label: "Photo — carte 2", type: "image", defaultValue: "" },
      { key: "card2Title", label: "Titre — carte 2", type: "text", defaultValue: "Coaching en petit groupe" },
      {
        key: "card2Text",
        label: "Texte — carte 2",
        type: "textarea",
        defaultValue: "L'énergie du collectif, l'attention en plus — des séances en groupes de 4 à 6 personnes maximum.",
      },
      { key: "card3Image", label: "Photo — carte 3", type: "image", defaultValue: "" },
      { key: "card3Title", label: "Titre — carte 3", type: "text", defaultValue: "Préparation sportive" },
      {
        key: "card3Text",
        label: "Texte — carte 3",
        type: "textarea",
        defaultValue: "Une préparation physique ciblée pour la compétition, la remise en forme ou un objectif précis.",
      },
      { key: "ctaLabel", label: "Texte du bouton", type: "text", defaultValue: "Réserver une séance découverte" },
    ],
  },
  {
    pageKey: "offres",
    label: "Offres",
    previewPath: "/offres",
    fields: [
      { key: "heroImage", label: "Photo d'en-tête", type: "image", defaultValue: "" },
      { key: "heroTitle", label: "Titre", type: "text", defaultValue: "Nos offres d'adhésion" },
      {
        key: "heroSubtitle",
        label: "Sous-titre",
        type: "textarea",
        defaultValue: "Un abonnement pour chaque besoin, sans engagement caché.",
      },
      { key: "plan1Name", label: "Nom — offre 1", type: "text", defaultValue: "Essentiel" },
      { key: "plan1Price", label: "Prix — offre 1", type: "text", defaultValue: "49 DT / mois" },
      { key: "plan1Text", label: "Description — offre 1", type: "textarea", defaultValue: "Accès illimité à la salle et aux cours collectifs." },
      { key: "plan2Name", label: "Nom — offre 2", type: "text", defaultValue: "Premium" },
      { key: "plan2Price", label: "Prix — offre 2", type: "text", defaultValue: "89 DT / mois" },
      { key: "plan2Text", label: "Description — offre 2", type: "textarea", defaultValue: "Essentiel + piscine, sauna et 2 séances de coaching par mois." },
      { key: "plan3Name", label: "Nom — offre 3", type: "text", defaultValue: "Famille" },
      { key: "plan3Price", label: "Prix — offre 3", type: "text", defaultValue: "149 DT / mois" },
      { key: "plan3Text", label: "Description — offre 3", type: "textarea", defaultValue: "Premium pour 2 adultes + accès enfants inclus." },
      { key: "ctaLabel", label: "Texte du bouton", type: "text", defaultValue: "Choisir cette offre" },
    ],
  },
];
