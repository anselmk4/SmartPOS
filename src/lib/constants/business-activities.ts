export interface BusinessActivity {
  id: string;
  name: string;
  category: string;
  icon: string;
}

export const BUSINESS_ACTIVITIES: BusinessActivity[] = [
  { id: "retail_grocery", name: "Alimentation Générale & Supérette", category: "Commerce & Distribution", icon: "🥫" },
  { id: "hardware_construction", name: "Quincaillerie & Matériaux de Construction", category: "Construction & BTP", icon: "🔨" },
  { id: "fashion_clothing", name: "Boutique Prêt-à-porter & Habillement", category: "Mode & Beauté", icon: "👗" },
  { id: "shoes_leather", name: "Boutique Chaussures & Maroquinerie", category: "Mode & Beauté", icon: "👠" },
  { id: "jewelry_luxury", name: "Bijouterie & Accessoires de Luxe", category: "Mode & Beauté", icon: "💍" },
  { id: "cosmetics_beauty", name: "Cosmétiques, Parfumerie & Soins", category: "Mode & Beauté", icon: "💄" },
  { id: "hair_salon", name: "Salon de Coiffure & Institut d'Esthétique", category: "Services & Soins", icon: "✂️" },
  { id: "restaurant_fastfood", name: "Restaurant, Fast-Food & Snack", category: "Restauration & Hôtellerie", icon: "🍽️" },
  { id: "bar_lounge", name: "Bar, Lounge, Pub & Terrasse", category: "Restauration & Hôtellerie", icon: "🍹" },
  { id: "beverage_depot", name: "Dépôt de Boissons & Grossiste", category: "Commerce & Distribution", icon: "🍺" },
  { id: "bakery_pastry", name: "Boulangerie & Pâtisserie", category: "Alimentation Spécialisée", icon: "🥖" },
  { id: "butchery_fish", name: "Boucherie, Charcuterie & Poissonnerie", category: "Alimentation Spécialisée", icon: "🥩" },
  { id: "pharmacy", name: "Pharmacie & Parapharmacie", category: "Santé & Médical", icon: "💊" },
  { id: "medical_clinic", name: "Clinique, Cabinet Médical & Laboratoire", category: "Santé & Médical", icon: "🩺" },
  { id: "optics_eyewear", name: "Magasin d'Optique & Lunetterie", category: "Santé & Médical", icon: "👓" },
  { id: "electronics_phones", name: "Électronique, Smartphones & Informatique", category: "High-Tech & Maison", icon: "📱" },
  { id: "appliances_home", name: "Électroménager & Équipements de Maison", category: "High-Tech & Maison", icon: "📺" },
  { id: "solar_electricity", name: "Matériel Électrique & Énergie Solaire", category: "Énergie & Équipement", icon: "☀️" },
  { id: "auto_moto_parts", name: "Pièces de Rechange Auto & Moto", category: "Automobile & Transport", icon: "🚗" },
  { id: "printing_cyber", name: "Imprimerie, Cybercafé & Sérigraphie", category: "Bureautique & Médias", icon: "🖨️" },
  { id: "stationery_books", name: "Librairie, Papeterie & Fournitures Scolaires", category: "Bureautique & Médias", icon: "📚" },
  { id: "furniture_decor", name: "Magasin de Meubles & Décoration Intérieure", category: "High-Tech & Maison", icon: "🛋️" },
  { id: "laundry_dryclean", name: "Blanchisserie & Pressing Moderne", category: "Services & Entretien", icon: "👔" },
  { id: "kiosk_mobile_money", name: "Kiosque Multi-Services & Transfert Mobile Money", category: "Services Financiers", icon: "💳" },
  { id: "catering_events", name: "Service Traiteur & Événementiel", category: "Restauration & Hôtellerie", icon: "🎪" },
  { id: "art_crafts", name: "Boutique d'Art & Artisanat Local", category: "Culture & Cadeaux", icon: "🎨" },
  { id: "other_activity", name: "Autre Activité Commerciale", category: "Autre", icon: "🏬" },
];
