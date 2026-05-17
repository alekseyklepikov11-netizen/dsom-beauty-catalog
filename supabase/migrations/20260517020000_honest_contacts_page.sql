-- Rewrite contacts page with only real working channels.
--
-- The previous content listed several email aliases that are not
-- actually configured (science@, b2b@, care@, press@). Only
-- hello@dsom.ru is set up via Lovable. This avoids the situation
-- where a customer sends an inquiry to a non-existent address
-- and never gets a reply.

UPDATE public.pages
SET content = jsonb_build_object('body', $body$СВЯЗЬ С НАМИ

Мы строим открытый диалог с каждым, кто выбирает DSOM. Команда отвечает в течение одного рабочего дня — на русском и английском языках.

По всем вопросам — hello@dsom.ru

В теме письма укажите, что именно вас интересует:
— «Состав» — вопросы по формулам и INCI
— «B2B» — оптовые поставки и партнёрство
— «Сотрудничество» — пресса, инфлюенсеры, коллаборации
— «Поддержка» — проблема с заказом, претензия, обратная связь

Telegram: @dsom_official


РЕКВИЗИТЫ КОМПАНИИ

Полное наименование: Общество с ограниченной ответственностью «ВАЛКЭНДВИР»

Сокращённое наименование: ООО «ВАЛКЭНДВИР»

Юридический и почтовый адрес: 127006, г. Москва, вн.тер.г. муниципальный округ Тверской, ул. Краснопролетарская, д. 7, помещение 1н

Адрес производства: 420095, Республика Татарстан, г. Казань, ул. Восстания, тер. Химград, д. 121, корпус 312

ОГРН: 1257700213968
ИНН: 9707045838


COMPANY DETAILS / INTERNATIONAL

Full name: Limited Liability Company «VALKENDWIR»
Short name: VALKENDWIR LLC

Registered address: 127006, Russian Federation, Moscow, Tverskoy district, Krasnoproletarskaya street, 7, room 1н

Production address: 420095, Russian Federation, Republic of Tatarstan, Kazan, Vosstaniya street, Khimgrad area, 121, building 312

OGRN: 1257700213968
INN: 9707045838


НА КАРТЕ

г. Москва, ул. Краснопролетарская, д. 7, помещение 1н, Тверской район, 127006.$body$),
    updated_at = now()
WHERE slug = 'contacts';
