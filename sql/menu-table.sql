-- cafe hermes: جدول وضعیت آیتم‌های منو (ناموجود/موجود)
-- این رو توی SQL Editor سوپابیس پروژه‌ت اجرا کن
-- پروژه: gpscydpozepmsupsjrbw

create table if not exists public.cafe_menu_items (
    id text primary key,
    unavailable boolean not null default false,
    updated_at timestamptz not null default now()
);

alter table public.cafe_menu_items enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.cafe_menu_items to anon;

create policy "cafe_menu_items_read" on public.cafe_menu_items
    for select using (true);

create policy "cafe_menu_items_insert" on public.cafe_menu_items
    for insert with check (true);

create policy "cafe_menu_items_update" on public.cafe_menu_items
    for update using (true);

create policy "cafe_menu_items_delete" on public.cafe_menu_items
    for delete using (true);
