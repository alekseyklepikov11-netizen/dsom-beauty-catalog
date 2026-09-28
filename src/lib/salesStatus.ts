import { LAUNCH_CONFIG, isCheckoutEnabled } from "@/lib/launchConfig";

/**
 * Открыты ли продажи (для разметки Offer.availability, формы отзывов и т. п.).
 * true, если включено оформление заказа на сайте ИЛИ наступила LAUNCH_CONFIG.launchDate.
 * До этого момента товар — предзаказ: schema.org/PreOrder, форма отзывов скрыта.
 * Точную дату в публичный текст не выводим — только используем как переключатель.
 */
/**
 * schema.org availability для Offer. InStock — только когда на сайте реально открыт заказ
 * (isCheckoutEnabled), а не по календарной дате: launchDate — техническая граница фаз промокода,
 * и после неё без живого канала продаж InStock в разметке был бы ложным. Общая для карточки и каталога.
 */
export function offerAvailability(): string {
  return isCheckoutEnabled() ? "https://schema.org/InStock" : "https://schema.org/PreOrder";
}

export function isSalesOpen(today: Date = new Date()): boolean {
  if (isCheckoutEnabled()) return true;
  const start = new Date(`${LAUNCH_CONFIG.launchDate}T00:00:00`);
  return !Number.isNaN(start.getTime()) && today >= start;
}
