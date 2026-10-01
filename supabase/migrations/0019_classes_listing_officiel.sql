-- Liste des classes remplacée par les formations affichées sur les pages officielles des campus de Bordeaux
-- (ecole-du-digital.com/campus/bordeaux et espub.org/ecole-communication-bordeaux, consultées le 01/10/2026).
-- Aucun étudiant n'avait encore choisi de classe : la première liste (intitulés approximatifs) est retirée.
delete from public.classes where validee and proposee_par is null;

insert into public.classes (ecole, nom) values
  -- ESD : 3 Bachelors en 3 ans, le cycle intensif en B3, 5 Mastères en 2 ans
  ('ESD', 'B1 Création digitale & Design d''interface'), ('ESD', 'B2 Création digitale & Design d''interface'), ('ESD', 'B3 Création digitale & Design d''interface'),
  ('ESD', 'B1 Marketing digital & IA'), ('ESD', 'B2 Marketing digital & IA'), ('ESD', 'B3 Marketing digital & IA'),
  ('ESD', 'B1 Chef de projet digital'), ('ESD', 'B2 Chef de projet digital'), ('ESD', 'B3 Chef de projet digital'),
  ('ESD', 'B3 Chef de projet digital, cycle intensif'),
  ('ESD', 'M1 User Experience & Interface'), ('ESD', 'M2 User Experience & Interface'),
  ('ESD', 'M1 Digital Design & Creative Technologies'), ('ESD', 'M2 Digital Design & Creative Technologies'),
  ('ESD', 'M1 Business Developer & E-commerce'), ('ESD', 'M2 Business Developer & E-commerce'),
  ('ESD', 'M1 Data Marketing & IA'), ('ESD', 'M2 Data Marketing & IA'),
  ('ESD', 'M1 Vidéo & Digital Contents'), ('ESD', 'M2 Vidéo & Digital Contents'),
  -- ESP : tronc commun en B1 et B2, 7 spécialisations en B3, 12 Mastères en 2 ans
  ('ESP', 'B1 Communication & Marketing'), ('ESP', 'B2 Communication & Marketing'),
  ('ESP', 'B3 Stratégie de marque & communication'), ('ESP', 'B3 Stratégie de marque & communication, cycle intensif'),
  ('ESP', 'B3 Production événementielle'), ('ESP', 'B3 Marketing digital, Growth & IA'),
  ('ESP', 'B3 Création de contenu & publicité'), ('ESP', 'B3 International Brand Communication'),
  ('ESP', 'B3 Vidéo & Techniques de production'),
  ('ESP', 'M1 Planning stratégique, marques & tendances'), ('ESP', 'M2 Planning stratégique, marques & tendances'),
  ('ESP', 'M1 Communication corporate, RSE & stratégies d''impact'), ('ESP', 'M2 Communication corporate, RSE & stratégies d''impact'),
  ('ESP', 'M1 Direction artistique, publicité & média'), ('ESP', 'M2 Direction artistique, publicité & média'),
  ('ESP', 'M1 Marketing d''influence & événementiel'), ('ESP', 'M2 Marketing d''influence & événementiel'),
  ('ESP', 'M1 Global Brand Strategy & Management'), ('ESP', 'M2 Global Brand Strategy & Management'),
  ('ESP', 'M1 Marketing de l''entertainment & industries créatives'), ('ESP', 'M2 Marketing de l''entertainment & industries créatives'),
  ('ESP', 'M1 E-commerce & Digital business'), ('ESP', 'M2 E-commerce & Digital business'),
  ('ESP', 'M1 Media, Data & Growth Strategy'), ('ESP', 'M2 Media, Data & Growth Strategy'),
  ('ESP', 'M1 Vidéo, Motion & Creative Content'), ('ESP', 'M2 Vidéo, Motion & Creative Content'),
  ('ESP', 'M1 User Experience & User Interface'), ('ESP', 'M2 User Experience & User Interface'),
  ('ESP', 'M1 Brand Design & Creative Strategy'), ('ESP', 'M2 Brand Design & Creative Strategy'),
  ('ESP', 'M1 Management de talents & Marketing d''influence'), ('ESP', 'M2 Management de talents & Marketing d''influence')
on conflict (ecole, nom) do nothing;
