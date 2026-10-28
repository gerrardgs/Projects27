-- Quality of voice and text capture in real use. One row per filled form: which method filled it and
-- which fields, and, after the person pressed Simpan, which of those fields they changed first. The
-- spoken sentence is never stored.
create table capture_drafts (
  id uuid primary key default uuidv7(),
  entity_id uuid not null references entities (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  source text not null check (source in ('ai', 'rules')),
  model text check (model is null or length(model) <= 100),
  filled text[] not null,
  latency_ms integer not null check (latency_ms >= 0),
  created_at timestamptz not null default now(),
  outcome text check (outcome in ('saved')),
  changed text[],
  reviewed_at timestamptz,
  check ((outcome is null) = (reviewed_at is null)),
  check ((outcome is null) = (changed is null)),
  check (changed is null or changed <@ filled)
);

create index capture_drafts_entity_created on capture_drafts (entity_id, created_at desc);
