-- ============================================================================
-- MOLLY MARKET - Script 08 : Données initiales (Seed)
-- Base de données : mollymarket_backend
-- Exécuter APRÈS les scripts 01 à 06
-- ============================================================================

-- ============================================================================
-- UTILISATEURS (4 employés réels)
-- Mot de passe stocké en clair pour la démo (en production: pgcrypto + bcrypt)
-- ============================================================================
INSERT INTO utilisateurs (id, matricule, nom, prenom, email, mot_de_passe_hash, role, telephone, avatar_url, actif, date_embauche) VALUES
(1, 'EMP-001', 'Kouamé', 'Brunell', 'admin@mollymarket.ci', 'secret123', 'Administrateur', '07 01 02 03 04', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', TRUE, '2024-01-08'),
(2, 'EMP-002', 'Touré', 'Eden', 'directeur@mollymarket.ci', 'secret123', 'Directeur', '07 05 06 07 08', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', TRUE, '2024-03-01'),
(3, 'EMP-003', 'Koffi', 'Noam', 'vendeur@mollymarket.ci', 'secret123', 'Vendeur', '05 11 22 33 44', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', TRUE, '2025-06-15'),
(4, 'EMP-004', 'Bakayoko', 'Ayo', 'magasinier@mollymarket.ci', 'secret123', 'Magasinier', '01 22 33 44 55', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', TRUE, '2025-02-10');

SELECT setval('utilisateurs_id_seq', 4);

-- ============================================================================
-- CLIENTS (8 clients)
-- ============================================================================
INSERT INTO clients (id, code_client, nom, prenom, telephone, email, adresse, actif, date_creation) VALUES
(1, 'CLI-0001', 'Kouamé', 'Affoué', '07 08 12 34 56', 'affoue.kouame@gmail.ci', 'Cocody Angré 8ème Tranche, Abidjan', TRUE, '2026-01-15'),
(2, 'CLI-0002', 'Konan', 'Jean-Yves', '05 44 55 66 77', 'jean-yves.konan@yahoo.fr', 'Marcory Zone 4 Rue du Canal, Abidjan', TRUE, '2026-02-10'),
(3, 'CLI-0003', 'Bamba', 'Mariam', '01 02 03 04 05', 'mariam.bamba@outlook.ci', 'Plateau Avenue Chardy, Abidjan', TRUE, '2026-03-05'),
(4, 'CLI-0004', 'Yao', 'Serge', '07 77 88 99 00', 'serge.yao@gmail.com', 'Yopougon Selmer Carrefour Bel Air, Abidjan', TRUE, '2026-04-12'),
(5, 'CLI-0005', 'Traoré', 'Fatou', '05 11 22 33 44', 'fatou.traore@hotmail.com', 'Treichville Avenue 8 Rue 12, Abidjan', TRUE, '2026-05-20'),
(6, 'CLI-0006', 'Soro', 'Drissa', '07 23 45 67 89', 'drissa.soro@gmail.ci', 'Koumassi Remblais Boulevard du Gabon, Abidjan', TRUE, '2026-06-11'),
(7, 'CLI-0007', 'Diabaté', 'Aminata', '01 98 76 54 32', 'aminata.diabate@yahoo.ci', 'Riviera Palmeraie Rosiers, Abidjan', TRUE, '2026-07-04'),
(8, 'CLI-0008', 'N''Guessan', 'Thierry', '05 87 65 43 21', 'thierry.nguessan@gmail.com', 'Deux-Plateaux Vallons Rue des Jardins, Abidjan', TRUE, '2026-08-01');

SELECT setval('clients_id_seq', 8);

-- ============================================================================
-- FOURNISSEURS (3 fournisseurs)
-- ============================================================================
INSERT INTO fournisseurs (id, code_fournisseur, nom_entreprise, contact_nom, telephone, email, adresse, ville, actif) VALUES
(1, 'FRS-0001', 'SIPRA Côte d''Ivoire', 'Koffi Germain', '07 20 22 45 67', 'commandes@sipra.ci', 'Zone Industrielle de Yopougon', 'Abidjan', TRUE),
(2, 'FRS-0002', 'SANIA Cie (Huiles & Margarines)', 'Kacou Daniel', '05 21 75 88 90', 'contact@sania.ci', 'Boulevard de Vridi Port Autonome', 'Abidjan', TRUE),
(3, 'FRS-0003', 'Carré d''Or Distribution CI', 'Ibrahim Fakhry', '01 21 35 12 34', 'commercial@carredor.ci', 'Zone Industrielle de Koumassi', 'Abidjan', TRUE);

SELECT setval('fournisseurs_id_seq', 3);

-- ============================================================================
-- CATÉGORIES (16 rayons du supermarché)
-- ============================================================================
INSERT INTO categories (id, code, nom, description) VALUES
(1, 'CAT-EPICERIE-SALEE', 'Épicerie salée', 'Riz de qualité supérieure, huiles raffinées, pâtes alimentaires, farines, sel et bouillons'),
(2, 'CAT-EPICERIE-SUCREE', 'Épicerie sucrée', 'Sucres, confitures, chocolats, biscuits pour goûter, miels naturels, céréales et pâtes à tartiner'),
(3, 'CAT-BOISSONS', 'Boissons', 'Eaux minérales de source, sodas rafraîchissants, jus de fruits, bières locales, cafés et thés'),
(4, 'CAT-LAITIERS-OEUFS', 'Produits laitiers & œufs', 'Laits en poudre et concentrés, beurres pasteurisés, fromages, yaourts et plateaux d''œufs frais'),
(5, 'CAT-BOUCHERIE-VOLAILLE', 'Boucherie & volaille', 'Poulets entiers, steaks hachés, charcuteries épicées, pâtés de bœuf, volailles et viandes fumées'),
(6, 'CAT-POISSONNERIE', 'Poissonnerie', 'Tilapias frais de lagune, maquereaux, thiof (capitaine), sardines fraîches, poissons fumés et crevettes'),
(7, 'CAT-FRUITS-LEGUMES', 'Fruits et légumes', 'Fruits tropicaux de Côte d''Ivoire (bananes, ananas, mangues, papayes), agrumes et légumes frais'),
(8, 'CAT-SURGELES', 'Surgelés', 'Bâtonnets de poisson pané, frites, glaces gourmandes, crevettes, légumes surgelés et pizzas prêtes'),
(9, 'CAT-BOULANGERIE-PATISSERIE', 'Boulangerie & pâtisserie', 'Baguettes traditionnelles du jour, pains de mie tendres, viennoiseries dorées, brioches et gâteaux'),
(10, 'CAT-HYGIENE-BEAUTE', 'Hygiène & beauté', 'Savons de beauté parfumés, gels douche moussants, soins dentaires, capillaires, déodorants et rasoirs'),
(11, 'CAT-ENTRETIEN-DROGUERIE', 'Entretien & droguerie', 'Savons de ménage traditionnels, détergents en poudre, assouplissants, eau de javel et accessoires'),
(12, 'CAT-BEBE-PUERICULTURE', 'Bébé & puériculture', 'Couches culottes douces, laits infantiles de croissance, lingettes sensibles et petits pots vitaminés'),
(13, 'CAT-BAZAR-MAISON', 'Bazar & maison', 'Vaisselle durable, couverts en inox, verres d''eau, bougies d''ambiance, cordes et rangements maison'),
(14, 'CAT-PAPETERIE-FOURNITURES', 'Papeterie & fournitures', 'Cahiers quadrillés, stylos à bille, crayons graphites, enveloppes postales, adhésifs et piles alcalines'),
(15, 'CAT-ANIMALERIE', 'Animalerie', 'Croquettes équilibrées pour chiens et chats, litières minérales agglomérantes et laisses solides'),
(16, 'CAT-ELECTROMENAGER-LEGER', 'Électroménager léger', 'Bouilloires rapides sans fil, ventilateurs oscillants de table, fers à repasser vapeur et lampes torches');

SELECT setval('categories_id_seq', 16);

-- ============================================================================
-- PRODUITS (126 produits avec prix réels en FCFA)
-- Insertion SANS déclencher les triggers de stock (stock_actuel défini directement)
-- ============================================================================

-- Désactiver temporairement les triggers pour l'insertion initiale
ALTER TABLE produits DISABLE TRIGGER trg_interdire_prix_negatif;
ALTER TABLE produits DISABLE TRIGGER trg_empecher_stock_negatif;

-- 1. Épicerie salée (12 produits)
INSERT INTO produits (id, code_barre, nom, categorie_id, prix_vente, prix_achat, seuil_alerte, stock_actuel, unite_mesure) VALUES
(1, '618100000101', 'Riz Uncle Sam long grain', 1, 3450, 2750, 10, 45, 'Sac 5 kg'),
(2, '618100000102', 'Riz Uncle Sam long grain', 1, 15500, 12800, 8, 24, 'Sac 25 kg'),
(3, '618100000103', 'Riz Soleil Vert 25% brisure', 1, 9800, 7900, 8, 32, 'Sac 25 kg'),
(4, '618100000104', 'Riz parfumé Thaïlandais Delicia', 1, 3150, 2500, 10, 28, 'Sac 4,5 kg'),
(5, '618100000105', 'Huile végétale Dinor', 1, 900, 720, 15, 60, 'Bidon 1 L'),
(6, '618100000106', 'Huile végétale Dinor', 1, 4350, 3500, 10, 35, 'Bidon 5 L'),
(7, '618100000107', 'Huile de palme raffinée', 1, 1100, 880, 12, 40, 'Bidon 1 L'),
(8, '618100000108', 'Spaghetti Panzani', 1, 750, 550, 20, 75, 'Paquet 500 g'),
(9, '618100000109', 'Macaroni', 1, 650, 480, 20, 50, 'Paquet 500 g'),
(10, '618100000110', 'Farine de blé', 1, 700, 520, 15, 55, 'Paquet 1 kg'),
(11, '618100000111', 'Sel de cuisine iodé', 1, 300, 200, 25, 90, 'Paquet 1 kg'),
(12, '618100000112', 'Cube de bouillon Maggi', 1, 1200, 950, 15, 65, 'Boîte de 50'),

-- 2. Épicerie sucrée (10 produits)
(13, '618100000201', 'Sucre en poudre', 2, 875, 700, 15, 52, 'Paquet 1 kg'),
(14, '618100000202', 'Sucre en morceaux', 2, 900, 720, 15, 48, 'Carton 1 kg'),
(15, '618100000203', 'Confiture fraise', 2, 1500, 1150, 10, 30, 'Pot 400 g'),
(16, '618100000204', 'Biscuits Choco Prince', 2, 1000, 750, 15, 44, 'Paquet 300 g'),
(17, '618100000205', 'Chocolat en tablette Milka', 2, 1500, 1100, 12, 38, '100 g'),
(18, '618100000206', 'Miel naturel', 2, 3000, 2250, 8, 20, 'Pot 500 g'),
(19, '618100000207', 'Bonbons assortis', 2, 800, 550, 15, 60, 'Sachet 200 g'),
(20, '618100000208', 'Gâteau sec La Vache Qui Rit Snack', 2, 600, 420, 15, 5, 'Paquet'),
(21, '618100000209', 'Céréales Corn Flakes', 2, 2200, 1680, 10, 25, 'Boîte 500 g'),
(22, '618100000210', 'Pâte à tartiner Nutella', 2, 3800, 2950, 8, 18, 'Pot 400 g'),

-- 3. Boissons (10 produits)
(23, '618100000301', 'Eau minérale Awa', 3, 400, 280, 30, 120, 'Bouteille 1,5 L'),
(24, '618100000302', 'Coca-Cola', 3, 1000, 750, 20, 80, 'Bouteille 1,5 L'),
(25, '618100000303', 'Fanta orange', 3, 1000, 750, 20, 65, 'Bouteille 1,5 L'),
(26, '618100000304', 'Jus Mogu Mogu fraise', 3, 650, 450, 15, 42, 'Bouteille 320 ml'),
(27, '618100000305', 'Jus Pulp Orange', 3, 1200, 880, 15, 34, 'Bouteille 1 L'),
(28, '618100000306', 'Bière Ivoire', 3, 850, 620, 24, 72, 'Bouteille 65 cl'),
(29, '618100000307', 'Bière Flag', 3, 800, 580, 24, 60, 'Bouteille 65 cl'),
(30, '618100000308', 'Nescafé classique', 3, 2200, 1700, 10, 26, 'Pot 100 g'),
(31, '618100000309', 'Thé Lipton jaune', 3, 1100, 800, 15, 38, 'Boîte 25 sachets'),
(32, '618100000310', 'Sirop grenadine', 3, 1200, 900, 10, 22, 'Bouteille 75 cl'),

-- 4. Produits laitiers & œufs (8 produits)
(33, '618100000401', 'Lait en poudre Laity Bleu', 4, 1490, 1150, 15, 40, 'Sachet 360 g'),
(34, '618100000402', 'Lait concentré sucré Nestlé', 4, 1000, 760, 20, 68, 'Boîte 397 g'),
(35, '618100000403', 'Fromage Emmental Paysan Breton', 4, 2300, 1750, 8, 16, '500 g'),
(36, '618100000404', 'Crème végétale Vitala', 4, 2300, 1780, 8, 24, '1 L'),
(37, '618100000405', 'Beurre', 4, 1800, 1350, 10, 22, 'Plaquette 250 g'),
(38, '618100000406', 'Yaourt nature Djino', 4, 1000, 750, 15, 30, 'Pack de 4'),
(39, '618100000407', 'Dessert vanille Milkana', 4, 300, 210, 20, 48, '100 g'),
(40, '618100000408', 'Œufs', 4, 2500, 1950, 10, 25, 'Plateau de 30'),

-- 5. Boucherie & volaille (8 produits)
(41, '618100000501', 'Poulet entier congelé', 5, 2200, 1700, 15, 36, 'Kg'),
(42, '618100000502', 'Steak haché Sita', 5, 2800, 2150, 10, 20, '5x100 g'),
(43, '618100000503', 'Saucisson de poulet piquant', 5, 3200, 2450, 8, 15, 'Unité'),
(44, '618100000504', 'Pâté de bœuf Daara', 5, 1575, 1200, 12, 30, '320 g'),
(45, '618100000505', 'Ailes de dinde fumées', 5, 3500, 2700, 10, 18, 'Kg'),
(46, '618100000506', 'Cotis de porc fumés', 5, 5000, 3900, 6, 14, 'Kg'),
(47, '618100000507', 'Poule fumée', 5, 8000, 6300, 5, 12, 'Unité'),
(48, '618100000508', 'Viande bovine sans os', 5, 2200, 1750, 15, 28, 'Kg'),

-- 6. Poissonnerie (6 produits)
(49, '618100000601', 'Tilapia frais', 6, 2300, 1750, 12, 30, '500 g et +'),
(50, '618100000602', 'Maquereau frais', 6, 1800, 1350, 15, 35, 'Kg'),
(51, '618100000603', 'Brochet fumé', 6, 3900, 2950, 8, 16, 'Kg'),
(52, '618100000604', 'Sardine fraîche', 6, 1500, 1100, 12, 26, 'Kg'),
(53, '618100000605', 'Capitaine (thiof)', 6, 4500, 3450, 8, 14, 'Kg'),
(54, '618100000606', 'Crevettes fraîches', 6, 3500, 2650, 8, 20, '500 g'),

-- 7. Fruits et légumes (10 produits)
(55, '618100000701', 'Banane dessert', 7, 600, 400, 20, 65, 'Kg'),
(56, '618100000702', 'Ananas', 7, 800, 550, 15, 40, 'Unité'),
(57, '618100000703', 'Mangue', 7, 700, 480, 15, 35, 'Kg'),
(58, '618100000704', 'Papaye', 7, 500, 350, 12, 25, 'Unité'),
(59, '618100000705', 'Orange', 7, 600, 420, 20, 55, 'Kg'),
(60, '618100000706', 'Tomate fraîche', 7, 750, 520, 20, 48, 'Kg'),
(61, '618100000707', 'Oignon', 7, 500, 360, 25, 70, 'Kg'),
(62, '618100000708', 'Pomme de terre', 7, 700, 500, 20, 50, 'Kg'),
(63, '618100000709', 'Carotte', 7, 600, 430, 15, 42, 'Kg'),
(64, '618100000710', 'Piment frais', 7, 300, 200, 20, 60, '100 g'),

-- 8. Surgelés (8 produits)
(65, '618100000801', 'Bâtonnets de poisson pané', 8, 1800, 1350, 10, 28, 'Boîte 400 g'),
(66, '618100000802', 'Frites surgelées', 8, 1500, 1100, 12, 34, 'Sachet 1 kg'),
(67, '618100000803', 'Glace caramel Sensation', 8, 3250, 2450, 8, 15, '1 L'),
(68, '618100000804', 'Crevettes surgelées', 8, 3800, 2900, 8, 18, '500 g'),
(69, '618100000805', 'Légumes mélangés surgelés', 8, 1700, 1280, 10, 26, '1 kg'),
(70, '618100000806', 'Nuggets de poulet', 8, 2200, 1650, 10, 24, '500 g'),
(71, '618100000807', 'Bâtonnets glacés chocolat', 8, 1575, 1180, 8, 20, 'x4 Carrefour Extra'),
(72, '618100000808', 'Pizza surgelée', 8, 2900, 2200, 8, 14, 'Unité'),

-- 9. Boulangerie & pâtisserie (6 produits)
(73, '618100000901', 'Pain de mie', 9, 1200, 880, 15, 32, 'Paquet 500 g'),
(74, '618100000902', 'Baguette de pain', 9, 200, 140, 30, 110, 'Unité'),
(75, '618100000903', 'Croissant', 9, 400, 280, 15, 45, 'Unité'),
(76, '618100000904', 'Brioche', 9, 800, 580, 12, 28, 'Unité'),
(77, '618100000905', 'Gâteau quatre-quarts', 9, 1500, 1100, 10, 19, 'Unité'),
(78, '618100000906', 'Biscottes', 9, 900, 650, 12, 30, 'Paquet 300 g'),

-- 10. Hygiène & beauté (10 produits)
(79, '618100001001', 'Savon de toilette Lux', 10, 500, 360, 25, 85, 'Pain 100 g'),
(80, '618100001002', 'Gel douche', 10, 1800, 1350, 12, 32, '500 ml'),
(81, '618100001003', 'Dentifrice Signal', 10, 900, 650, 20, 50, 'Tube 100 ml'),
(82, '618100001004', 'Brosse à dents', 10, 500, 320, 20, 45, 'Unité'),
(83, '618100001005', 'Shampoing têtes noires', 10, 2000, 1520, 10, 24, '400 ml'),
(84, '618100001006', 'Déodorant', 10, 1500, 1100, 15, 35, 'Spray 150 ml'),
(85, '618100001007', 'Coton-tiges Classic', 10, 5499, 4200, 8, 16, 'Lot de 6 boîtes'),
(86, '618100001008', 'Rasoir jetable', 10, 1000, 720, 15, 40, 'Lot de 3'),
(87, '618100001009', 'Papier hygiénique Lotus', 10, 1300, 950, 20, 55, 'Pack x10'),
(88, '618100001010', 'Serviettes hygiéniques', 10, 1200, 880, 15, 42, 'Paquet'),

-- 11. Entretien & droguerie (10 produits)
(89, '618100001101', 'Savon de ménage', 11, 350, 240, 30, 95, 'Pain 200 g'),
(90, '618100001102', 'Liquide vaisselle Bresil', 11, 1725, 1300, 12, 34, '500 ml'),
(91, '618100001103', 'Détergent en poudre Omo', 11, 1500, 1120, 15, 50, 'Paquet 1 kg'),
(92, '618100001104', 'Assouplissant El Paradise Baby', 11, 2000, 1500, 10, 26, '2 L'),
(93, '618100001105', 'Eau de javel', 11, 700, 500, 20, 60, '1 L'),
(94, '618100001106', 'Essuie-tout Papyrus', 11, 2300, 1750, 10, 28, 'Rouleau jumbo'),
(95, '618100001107', 'Sac poubelle', 11, 1000, 720, 15, 40, 'Rouleau x20'),
(96, '618100001108', 'Éponge grattoir', 11, 500, 340, 20, 55, 'Lot de 3'),
(97, '618100001109', 'Insecticide spray', 11, 1800, 1350, 12, 32, 'Bombe 300 ml'),
(98, '618100001110', 'Désodorisant d''intérieur', 11, 1500, 1100, 10, 24, 'Spray'),

-- 12. Bébé & puériculture (6 produits)
(99, '618100001201', 'Couches Pampers taille 3', 12, 4500, 3600, 10, 28, 'Paquet x30'),
(100, '618100001202', 'Lait infantile Guigoz', 12, 4800, 3850, 8, 22, 'Boîte 400 g'),
(101, '618100001203', 'Lingettes bébé', 12, 1500, 1120, 15, 44, 'Paquet x80'),
(102, '618100001204', 'Savon bébé', 12, 700, 500, 15, 38, 'Pain 100 g'),
(103, '618100001205', 'Petit pot bébé légumes', 12, 900, 670, 12, 30, 'Unité 130 g'),
(104, '618100001206', 'Biberon', 12, 2000, 1450, 8, 18, 'Unité'),

-- 13. Bazar & maison (8 produits)
(105, '618100001301', 'Lot de 6 cuillères à café', 13, 2750, 2100, 8, 20, 'Lot'),
(106, '618100001302', 'Assiette plate (lot)', 13, 3000, 2300, 8, 16, 'Lot de 6'),
(107, '618100001303', 'Verre à eau (lot)', 13, 2500, 1850, 10, 24, 'Lot de 6'),
(108, '618100001304', 'Bougie', 13, 300, 180, 25, 80, 'Unité'),
(109, '618100001305', 'Allumettes', 13, 100, 60, 30, 120, 'Boîte'),
(110, '618100001306', 'Corde à linge', 13, 800, 550, 10, 25, 'Rouleau 10 m'),
(111, '618100001307', 'Cintre plastique', 13, 1000, 700, 12, 35, 'Lot de 5'),
(112, '618100001308', 'Panier de rangement', 13, 2500, 1900, 8, 15, 'Unité'),

-- 14. Papeterie & fournitures (6 produits)
(113, '618100001401', 'Cahier 100 pages', 14, 350, 240, 25, 90, 'Unité'),
(114, '618100001402', 'Stylo bille (lot)', 14, 500, 340, 20, 60, 'Lot de 4'),
(115, '618100001403', 'Crayon à papier', 14, 100, 60, 25, 75, 'Unité'),
(116, '618100001404', 'Enveloppe (lot)', 14, 500, 350, 15, 45, 'Lot de 10'),
(117, '618100001405', 'Pile AA (lot)', 14, 1200, 880, 15, 38, 'Lot de 4'),
(118, '618100001406', 'Adhésif transparent', 14, 400, 270, 15, 40, 'Rouleau'),

-- 15. Animalerie (4 produits)
(119, '618100001501', 'Croquettes pour chien', 15, 3000, 2300, 8, 20, 'Sachet 1 kg'),
(120, '618100001502', 'Croquettes pour chat', 15, 2800, 2150, 8, 18, 'Sachet 1 kg'),
(121, '618100001503', 'Litière pour chat', 15, 3500, 2650, 8, 15, 'Sac 5 kg'),
(122, '618100001504', 'Laisse pour chien', 15, 1500, 1050, 6, 12, 'Unité'),

-- 16. Électroménager léger (4 produits)
(123, '618100001601', 'Bouilloire électrique', 16, 8500, 6500, 5, 12, 'Unité'),
(124, '618100001602', 'Ventilateur de table', 16, 12000, 9200, 4, 10, 'Unité'),
(125, '618100001603', 'Fer à repasser', 16, 9500, 7300, 4, 9, 'Unité'),
(126, '618100001604', 'Lampe torche', 16, 2000, 1400, 6, 16, 'Unité');

SELECT setval('produits_id_seq', 126);

-- Réactiver les triggers
ALTER TABLE produits ENABLE TRIGGER trg_interdire_prix_negatif;
ALTER TABLE produits ENABLE TRIGGER trg_empecher_stock_negatif;
-- ============================================================================
-- VÉRIFICATION DES DONNÉES DE BASE
-- ============================================================================
SELECT 'Utilisateurs' AS table_name, COUNT(*) AS nb_rows FROM utilisateurs
UNION ALL SELECT 'Clients', COUNT(*) FROM clients
UNION ALL SELECT 'Fournisseurs', COUNT(*) FROM fournisseurs
UNION ALL SELECT 'Catégories', COUNT(*) FROM categories
UNION ALL SELECT 'Produits', COUNT(*) FROM produits
UNION ALL SELECT 'Ventes (Prêt pour tests)', COUNT(*) FROM ventes
UNION ALL SELECT 'Lignes vente', COUNT(*) FROM lignes_vente
UNION ALL SELECT 'Paiements', COUNT(*) FROM paiements
UNION ALL SELECT 'Achats', COUNT(*) FROM achats
UNION ALL SELECT 'Mouvements stock', COUNT(*) FROM mouvements_stock
ORDER BY table_name;

-- ============================================================================
-- FIN du script 08_seed_data.sql (Base propre prête pour les tests réels)
-- ============================================================================

