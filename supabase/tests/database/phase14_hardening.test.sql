begin;

select plan(4);

select ok(
  exists(
    select 1
    from pg_proc
    where proname = 'submit_spring_report'
  ),
  'submit_spring_report RPC should still exist after Phase 14 hardening'
);

select ok(
  pg_get_functiondef(
    'public.submit_spring_report(uuid, timestamptz, public.water_presence, text, uuid)'::regprocedure
  ) like '%character_length(normalized_note) > 2000%',
  'submit_spring_report should enforce the 2000 character note boundary'
);

select ok(
  exists(
    select 1
    from pg_proc
    where proname = 'reserve_report_media_slot'
  ),
  'reserve_report_media_slot RPC should still exist after Phase 14 hardening'
);

select ok(
  pg_get_functiondef(
    'public.reserve_report_media_slot(uuid, text, text, timestamptz)'::regprocedure
  ) like '%current_attachment_count >= 8%',
  'reserve_report_media_slot should enforce the max-8 attachment boundary'
);

select * from finish();

rollback;
