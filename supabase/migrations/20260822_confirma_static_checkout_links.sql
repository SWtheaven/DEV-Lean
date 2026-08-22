alter table public.confirma_packages
  add column if not exists static_checkout_url text;

update public.confirma_packages
set static_checkout_url = case code
  when 'PACKAGE_5' then 'https://mpago.la/2Lx9LMH'
  when 'PACKAGE_20' then 'https://mpago.la/2h6RnfF'
  when 'PACKAGE_50' then 'https://mpago.la/141bUc2'
  else static_checkout_url
end
where code in ('PACKAGE_5','PACKAGE_20','PACKAGE_50');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'confirma_packages_static_checkout_url_check'
      and conrelid = 'public.confirma_packages'::regclass
  ) then
    alter table public.confirma_packages
      add constraint confirma_packages_static_checkout_url_check
      check (
        static_checkout_url is null
        or static_checkout_url ~ '^https://mpago\.la/[A-Za-z0-9]+$'
      );
  end if;
end $$;
