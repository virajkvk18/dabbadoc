insert into public.health_index (user_id, score, score_breakdown, streak_count, badges)
select
  id,
  72,
  '{"processedFood":58,"sugarLoad":55,"sodiumLoad":61,"friedFood":68,"proteinAdequacy":73,"wholeFoods":78,"swapsAdopted":66,"streakConsistency":64,"labelTruthScore":70}'::jsonb,
  4,
  '["Family health starter","3-day tracker badge","Smart swap badge","Label aware badge"]'::jsonb
from public.profiles
on conflict do nothing;
