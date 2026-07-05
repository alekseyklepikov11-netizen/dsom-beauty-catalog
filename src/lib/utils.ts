import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Переписывает URL ассетов с new.dsom.ru на боевой домен dsom.ru.
 * Путь /storage/v1/object/public/* сохраняется — nginx на dsom.ru отдаёт
 * его как статику. Нужно для schema.org / og:image (Google не любит
 * картинки на «чужом» поддомене).
 */
export function toPublicAssetUrl(url: string): string {
  return url.replace(/^https?:\/\/new\.dsom\.ru\//, "https://dsom.ru/");
}
