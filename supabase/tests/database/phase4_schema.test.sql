begin;

select plan(24);

select has_type('public', 'user_role', 'user_role enum should exist');
select has_type('public', 'report_moderation_status', 'report moderation enum should exist');
select has_type('public', 'water_presence', 'water presence enum should exist');
select has_type('public', 'projection_freshness', 'projection freshness enum should exist');
select has_type('public', 'projection_confidence', 'projection confidence enum should exist');

select has_table('public', 'user_profiles', 'user_profiles table should exist');
select has_table('public', 'user_role_assignments', 'user_role_assignments table should exist');
select has_table('public', 'springs', 'springs table should exist');
select has_table('public', 'spring_reports', 'spring_reports table should exist');
select has_table('public', 'report_media', 'report_media table should exist');
select has_table('public', 'moderation_actions', 'moderation_actions table should exist');
select has_table('public', 'spring_status_projections', 'spring_status_projections table should exist');
select has_table('public', 'audit_entries', 'audit_entries table should exist');

select has_view('public', 'user_profile_role_summary', 'user_profile_role_summary view should exist');

select has_column('public', 'springs', 'location', 'springs.location should exist');
select has_column('public', 'spring_reports', 'location_evidence', 'spring_reports.location_evidence should exist');
select has_column('public', 'spring_reports', 'moderation_status', 'spring_reports.moderation_status should exist');
select has_column('public', 'spring_status_projections', 'derived_from_report_ids', 'projection source report ids should exist');
select has_column('public', 'user_profile_role_summary', 'primary_role', 'profile summary should expose primary_role');
select has_column('public', 'user_profile_role_summary', 'role_set', 'profile summary should expose role_set');

select has_index('public', 'springs', 'springs_location_gix', 'springs location gist index should exist');
select has_index('public', 'spring_reports', 'spring_reports_public_projection_idx', 'projection read index should exist');
select has_index('public', 'spring_reports', 'spring_reports_pending_queue_idx', 'pending queue index should exist');
select has_index('public', 'user_role_assignments', 'user_role_assignments_active_user_role_idx', 'active role uniqueness index should exist');

select * from finish();

rollback;
