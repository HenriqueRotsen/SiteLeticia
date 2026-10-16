-- Paciente pode ver (e a API gerencia) os próprios envios em draft, além dos publicados.
-- Análise/parecer completo continua sendo sanitizado na API até a nutricionista publicar.

drop policy if exists "lab_reports_patient_published" on public.lab_reports;

create policy "lab_reports_patient_read"
on public.lab_reports for select
using (
  public.is_nutritionist()
  or (
    patient_id = public.current_patient_id()
    and (
      status = 'published'
      or uploaded_by = 'patient'
    )
  )
);

drop policy if exists "lab_results_via_report" on public.lab_results;

create policy "lab_results_via_report"
on public.lab_results for select
using (
  exists (
    select 1 from public.lab_reports lr
    where lr.id = report_id
      and (
        public.is_nutritionist()
        or (
          lr.patient_id = public.current_patient_id()
          and (
            lr.status = 'published'
            or lr.uploaded_by = 'patient'
          )
        )
      )
  )
);
