-- LELE PFM COICOP Category Seeding
-- System-wide COICOP category definitions

INSERT INTO category_configs (user_id, poste_n1_code, label_n1, is_system) VALUES
('system', '01', 'Alimentation et boissons non alcoolisées', true),
('system', '02', 'Transport', true),
('system', '03', 'Logement, eau, électricité, gaz', true),
('system', '04', 'Santé', true),
('system', '05', 'Loisirs et culture', true),
('system', '06', 'Éducation', true),
('system', '07', 'Assurances', true),
('system', '08', 'Autres dépenses', true);
