-- Core ledger schema. Invariants follow .agents/rules/17-financial-integrity.md:
-- exact money (bigint minor units), balanced entries enforced by the database,
-- immutable lines and posted entries, closed periods, append-only audit events.

create table currencies (
  code char(3) primary key,
  minor_units smallint not null check (minor_units between 0 and 4),
  name text not null
);

-- ISO 4217 list one (SIX, published 2026-09-17): IDR, number 360, 2 minor units.
insert into currencies (code, minor_units, name) values ('IDR', 2, 'Rupiah');

create table users (
  id uuid primary key default uuidv7(),
  email text not null check (length(email) between 3 and 254),
  display_name text not null check (length(display_name) between 1 and 120),
  password_hash text not null,
  totp_secret bytea,
  totp_enabled boolean not null default false,
  totp_last_step bigint,
  created_at timestamptz not null default now()
);
create unique index users_email_key on users (lower(email));

create table sessions (
  id uuid primary key default uuidv7(),
  user_id uuid not null references users (id),
  token_hash bytea not null unique,
  client text not null check (client in ('web', 'native')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index sessions_user_idx on sessions (user_id);

create table entities (
  id uuid primary key default uuidv7(),
  kind text not null check (kind in ('individual', 'company')),
  name text not null check (length(name) between 1 and 200),
  functional_currency char(3) not null references currencies (code),
  time_zone text not null default 'Asia/Jakarta',
  approval_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table memberships (
  entity_id uuid not null references entities (id),
  user_id uuid not null references users (id),
  role text not null check (role in ('owner', 'controller', 'accountant', 'approver', 'preparer', 'viewer', 'auditor')),
  created_at timestamptz not null default now(),
  primary key (entity_id, user_id)
);

create table accounts (
  id uuid primary key default uuidv7(),
  entity_id uuid not null references entities (id),
  code text not null check (code ~ '^[0-9]{3,6}$'),
  name text not null check (length(name) between 1 and 120),
  type text not null check (type in ('asset', 'liability', 'equity', 'income', 'expense')),
  postable boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (entity_id, code),
  unique (entity_id, id)
);

create table periods (
  entity_id uuid not null references entities (id),
  year smallint not null check (year between 1900 and 9999),
  month smallint not null check (month between 1 and 12),
  status text not null check (status in ('open', 'closed')),
  changed_at timestamptz not null default now(),
  changed_by uuid references users (id),
  reason text,
  primary key (entity_id, year, month)
);

create table journal_entries (
  id uuid primary key default uuidv7(),
  entity_id uuid not null references entities (id),
  entry_date date not null,
  description text not null check (length(description) between 1 and 500),
  counterparty text check (length(counterparty) <= 200),
  source text not null check (source in ('manual', 'transaction', 'import', 'reversal')),
  status text not null check (status in ('submitted', 'posted', 'reversed', 'rejected')),
  idempotency_key text check (length(idempotency_key) between 1 and 200),
  request_hash bytea,
  reverses_entry_id uuid references journal_entries (id),
  reversed_by_entry_id uuid references journal_entries (id),
  reason text check (length(reason) <= 500),
  created_by uuid not null references users (id),
  created_at timestamptz not null default now(),
  posted_by uuid references users (id),
  posted_at timestamptz,
  unique (entity_id, idempotency_key),
  unique (entity_id, id)
);
create index journal_entries_date_idx on journal_entries (entity_id, entry_date);

create table journal_lines (
  id uuid primary key default uuidv7(),
  entry_id uuid not null,
  entity_id uuid not null,
  line_no smallint not null check (line_no >= 1),
  account_id uuid not null,
  debit_minor bigint not null default 0 check (debit_minor >= 0),
  credit_minor bigint not null default 0 check (credit_minor >= 0),
  currency char(3) not null references currencies (code),
  memo text check (length(memo) <= 500),
  check ((debit_minor > 0) <> (credit_minor > 0)),
  unique (entry_id, line_no),
  foreign key (entity_id, entry_id) references journal_entries (entity_id, id),
  foreign key (entity_id, account_id) references accounts (entity_id, id)
);
create index journal_lines_account_idx on journal_lines (entity_id, account_id);

-- Every entry has at least two lines and balances. Checked at commit (deferred), so an
-- entry and its lines can be inserted in any order inside one transaction.
create function assert_entry_balanced(p_entry uuid) returns void
language plpgsql as $$
declare
  total_debit bigint;
  total_credit bigint;
  line_count integer;
begin
  select coalesce(sum(debit_minor), 0), coalesce(sum(credit_minor), 0), count(*)
    into total_debit, total_credit, line_count
    from journal_lines where entry_id = p_entry;
  if line_count < 2 then
    raise exception 'journal entry % has % line(s); at least 2 are required', p_entry, line_count
      using errcode = '23514';
  end if;
  if total_debit <> total_credit then
    raise exception 'journal entry % is not balanced: debits %, credits %', p_entry, total_debit, total_credit
      using errcode = '23514';
  end if;
end $$;

create function trg_line_balanced() returns trigger
language plpgsql as $$
begin
  perform assert_entry_balanced(new.entry_id);
  return null;
end $$;

create function trg_entry_balanced() returns trigger
language plpgsql as $$
begin
  perform assert_entry_balanced(new.id);
  return null;
end $$;

create constraint trigger journal_lines_balanced
  after insert on journal_lines deferrable initially deferred
  for each row execute function trg_line_balanced();

create constraint trigger journal_entries_balanced
  after insert on journal_entries deferrable initially deferred
  for each row execute function trg_entry_balanced();

-- Lines never change; corrections are reversing entries.
create function trg_forbid_change() returns trigger
language plpgsql as $$
begin
  raise exception '% is append-only; % is not allowed', tg_table_name, lower(tg_op)
    using errcode = '42501';
end $$;

create trigger journal_lines_immutable
  before update or delete on journal_lines
  for each row execute function trg_forbid_change();

create trigger journal_lines_no_truncate
  before truncate on journal_lines
  for each statement execute function trg_forbid_change();

-- Entries: only the allowed status transitions, and nothing else changes.
create function trg_entry_transition() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'journal entries cannot be deleted; post a reversal instead' using errcode = '42501';
  end if;
  if (new.entity_id, new.entry_date, new.description, new.counterparty, new.source, new.idempotency_key,
      new.request_hash, new.reverses_entry_id, new.created_by, new.created_at)
     is distinct from
     (old.entity_id, old.entry_date, old.description, old.counterparty, old.source, old.idempotency_key,
      old.request_hash, old.reverses_entry_id, old.created_by, old.created_at) then
    raise exception 'journal entry % content is immutable', old.id using errcode = '42501';
  end if;
  if not (
    (old.status = 'submitted' and new.status in ('posted', 'rejected'))
    or (old.status = 'posted' and new.status = 'reversed' and new.reversed_by_entry_id is not null
        and old.reversed_by_entry_id is null)
  ) then
    raise exception 'journal entry % cannot change from % to %', old.id, old.status, new.status
      using errcode = '42501';
  end if;
  if old.status = 'posted' and (new.posted_by, new.posted_at, new.reason) is distinct from (old.posted_by, old.posted_at, old.reason) then
    raise exception 'journal entry % posting data is immutable', old.id using errcode = '42501';
  end if;
  return new;
end $$;

create trigger journal_entries_transition
  before update or delete on journal_entries
  for each row execute function trg_entry_transition();

create trigger journal_entries_no_truncate
  before truncate on journal_entries
  for each statement execute function trg_forbid_change();

-- No new entry, and no posting, inside a closed period.
create function trg_period_open() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and not (old.status = 'submitted' and new.status = 'posted') then
    return new;
  end if;
  if exists (
    select 1 from periods p
     where p.entity_id = new.entity_id
       and p.year = extract(year from new.entry_date)
       and p.month = extract(month from new.entry_date)
       and p.status = 'closed'
  ) then
    raise exception 'period %-% is closed for entity %', extract(year from new.entry_date),
      lpad(extract(month from new.entry_date)::text, 2, '0'), new.entity_id
      using errcode = '23514';
  end if;
  return new;
end $$;

create trigger journal_entries_period_open
  before insert or update on journal_entries
  for each row execute function trg_period_open();

-- Append-only, hash-chained audit trail. hash = SHA-256(prev_hash || canonical), computed
-- by the application under an advisory lock per chain; verified by GET .../audit/verify.
create table audit_events (
  seq bigint generated always as identity primary key,
  chain_key text not null,
  entity_id uuid references entities (id),
  actor_user_id uuid references users (id),
  action text not null,
  object_type text not null,
  object_id text,
  at timestamptz not null,
  canonical text not null,
  prev_hash bytea,
  hash bytea not null unique
);
create index audit_events_chain_idx on audit_events (chain_key, seq);

create trigger audit_events_immutable
  before update or delete on audit_events
  for each row execute function trg_forbid_change();

create trigger audit_events_no_truncate
  before truncate on audit_events
  for each statement execute function trg_forbid_change();

-- Reports frozen when a period closes; exports read from here.
create table report_snapshots (
  id uuid primary key default uuidv7(),
  entity_id uuid not null references entities (id),
  kind text not null,
  year smallint not null,
  month smallint not null,
  result jsonb not null,
  content_hash bytea not null,
  created_by uuid not null references users (id),
  created_at timestamptz not null default now()
);
create index report_snapshots_period_idx on report_snapshots (entity_id, year, month);

create trigger report_snapshots_immutable
  before update or delete on report_snapshots
  for each row execute function trg_forbid_change();
