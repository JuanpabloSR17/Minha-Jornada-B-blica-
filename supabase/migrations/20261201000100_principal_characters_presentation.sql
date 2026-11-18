-- Personagens bíblicos principais: só a apresentação do sexo do personagem (decisão do usuário,
-- 18/11/2026). Pela enciclopédia, as skins Lendárias e Gloriosas são os personagens principais e
-- seus momentos marcantes; elas ficam só com a apresentação padrão, que já é a do personagem
-- (Moisés e Elias masculinos, Rute e Ester femininas), nos 3 estilos. Aditiva.

update public.skins set variants = '{padrao}' where rarity in ('legendary', 'glorious');

-- seleções antigas: quem vestia a apresentação feminina de um personagem principal passa à padrão,
-- com a mesma skin e o mesmo estilo (posse e estilo intactos)
update public.user_skin_selection u set variant = 'padrao', updated_at = now()
  from public.skins s
 where s.id = u.skin_id and s.rarity in ('legendary', 'glorious') and u.variant <> 'padrao';

-- a regra vale para os próximos lotes
alter table public.skins add constraint skins_principal_single_presentation
  check (rarity not in ('legendary', 'glorious') or variants = '{padrao}');
