-- Referências laboratoriais alinhadas ao guia clínico (SBC/SBEM + ideais preventivos).
-- interpretation_notes inclui ideal e prazo de reavaliação.
insert into public.lab_reference_ranges (marker_key, name, unit, ref_min, ref_max, interpretation_notes) values
  ('glucose_fasting', 'Glicemia de Jejum', 'mg/dL', 70, 99, 'Ideal ≤90. Pré-diabetes 100–125. Reavaliar 3–6 meses se alterada.'),
  ('insulin_fasting', 'Insulina Basal', 'µUI/mL', 2.6, 24.9, 'Ideal ≤8. Marcador precoce de resistência à insulina. Reavaliar 3 meses pós-intervenção.'),
  ('homa_ir', 'HOMA-IR', '', null, 2.15, 'Ideal ≤1.5. Cálculo Glicemia × Insulina / 405. Reavaliar 3 meses.'),
  ('hba1c', 'Hemoglobina Glicada (HbA1c)', '%', null, 5.7, 'Ideal ≤5.2. >6,5% sugere diabetes (SBEM). Reavaliar 3–4 meses.'),
  ('total_cholesterol', 'Colesterol Total', 'mg/dL', null, 190, 'Ideal ≤190. Avaliar com frações (SBC). Reavaliar 6–12 meses.'),
  ('triglycerides', 'Triglicerídeos', 'mg/dL', null, 150, 'Ideal ≤100. Elevados: dieta, estilo de vida ou metabolismo. Reavaliar 3–6 meses.'),
  ('hdl', 'HDL Colesterol', 'mg/dL', 40, null, 'Ideal ≥50. Reavaliar 6–12 meses.'),
  ('ldl', 'LDL Colesterol', 'mg/dL', null, 130, 'Ideal ≤100 (metas variam com risco CV). Reavaliar 6–12 meses.'),
  ('apo_b', 'Apo B', 'mg/dL', null, 90, 'Ideal ≤90. Marcador de partículas aterogênicas. Reavaliar 6–12 meses.'),
  ('tgp', 'TGP (ALT)', 'U/L', null, 41, 'Ideal ≤30. Marcador hepático; correlacionar com esteatose. Reavaliar 3 meses se alterada.'),
  ('tgo', 'TGO (AST)', 'U/L', null, 40, 'Ideal ≤30. Elevações isoladas exigem contexto clínico. Reavaliar 3 meses se alterada.'),
  ('ggt', 'Gama-GT', 'U/L', null, 60, 'Ideal ≤25. Sensível a álcool e esteatose. Reavaliar 3 meses se alterada.'),
  ('creatinine', 'Creatinina', 'mg/dL', 0.7, 1.2, 'Interpretar com TFG estimada. Reavaliar conforme clínica.'),
  ('egfr', 'TFG estimada (eGFR)', 'mL/min', 60, null, 'Ideal ≥90. Função renal. Reavaliar conforme clínica.'),
  ('uric_acid', 'Ácido Úrico', 'mg/dL', null, 7, 'Ideal ≤5.5. Relacionado a síndrome metabólica. Reavaliar 3–6 meses.'),
  ('tsh', 'TSH', 'mUI/L', 0.4, 4.5, 'Ideal 1–2,5. Interpretar com T4 livre e sintomas. Reavaliar 6–12 semanas se em ajuste.'),
  ('free_t4', 'T4 Livre', 'ng/dL', 0.9, 1.7, 'Ideal 1.1–1.4. Interpretar junto com TSH. Reavaliar conforme clínica.'),
  ('anti_tpo', 'Anti-TPO', 'UI/mL', null, 34, 'Positividade sugere autoimunidade tireoidiana. Reavaliar conforme clínica.'),
  ('vitamin_b12', 'Vitamina B12', 'pg/mL', 200, 900, 'Ideal 500–800. Sintomas neurológicos possíveis <400. Reavaliar 3–6 meses pós-reposição.'),
  ('vitamin_d', 'Vitamina D (25-OH)', 'ng/mL', 20, null, 'Ideal 40–60. Reposição individualizada. Reavaliar 3 meses após ataque.'),
  ('ferritin', 'Ferritina', 'ng/mL', 30, 300, 'Ideal 70–150. Fase aguda: correlacionar com PCR. Reavaliar 3 meses.'),
  ('hs_crp', 'PCR Ultrasensível', 'mg/L', null, 3, 'Ideal ≤1. Inflamação de baixo grau / risco CV. Reavaliar conforme necessidade.')
on conflict (marker_key) do update set
  name = excluded.name,
  unit = excluded.unit,
  ref_min = excluded.ref_min,
  ref_max = excluded.ref_max,
  interpretation_notes = excluded.interpretation_notes;
