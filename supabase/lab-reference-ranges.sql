-- Referências laboratoriais (nutrição clínica — orientativo)
insert into public.lab_reference_ranges (marker_key, name, unit, ref_min, ref_max, interpretation_notes) values
  ('glucose_fasting', 'Glicemia de jejum', 'mg/dL', 70, 99, 'Valores acima de 100 mg/dL em jejum merecem avaliação clínica integrada.'),
  ('hba1c', 'Hemoglobina glicada', '%', 4, 5.6, 'Acima de 5,7% sugere risco aumentado para alterações glicêmicas.'),
  ('total_cholesterol', 'Colesterol total', 'mg/dL', null, 200, 'Interpretar junto com LDL, HDL e triglicerídeos.'),
  ('ldl', 'LDL colesterol', 'mg/dL', null, 130, 'Metas podem variar conforme risco cardiovascular.'),
  ('hdl', 'HDL colesterol', 'mg/dL', 40, null, 'Valores baixos podem indicar maior risco cardiometabólico.'),
  ('triglycerides', 'Triglicerídeos', 'mg/dL', null, 150, 'Elevados podem refletir dieta, estilo de vida ou condições metabólicas.'),
  ('ferritin', 'Ferritina', 'ng/mL', 24, 336, 'Baixos estoques são comuns em mulheres; correlacionar com ferro sérico.'),
  ('vitamin_d', 'Vitamina D', 'ng/mL', 30, 100, 'Deficiência é frequente; conduta depende de sintomas e contexto.'),
  ('vitamin_b12', 'Vitamina B12', 'pg/mL', 200, 900, 'Valores limítrofes podem justificar investigação clínica.'),
  ('tsh', 'TSH', 'mUI/L', 0.4, 4.0, 'Interpretar com T4 livre e sintomas tireoidianos.'),
  ('tgo', 'TGO (AST)', 'U/L', null, 40, 'Marcador hepático; elevações isoladas exigem contexto clínico.'),
  ('tgp', 'TGP (ALT)', 'U/L', null, 41, 'Marcador hepático; correlacionar com esteatose e medicamentos.')
on conflict (marker_key) do update set
  name = excluded.name,
  unit = excluded.unit,
  ref_min = excluded.ref_min,
  ref_max = excluded.ref_max,
  interpretation_notes = excluded.interpretation_notes;
