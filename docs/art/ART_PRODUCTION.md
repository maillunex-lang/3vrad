# Производство графики — журнал

**Стиль:** Paradise Premium Stylized 2D (GDD-15).  
**Каталог runtime:** `apps/client/public/assets/`  
**Инструменты:** Cursor GenerateImage + Pillow process; procedural buildings v2.

## Сводка (факт)

| Группа | Нужно (ориентир) | Есть в игре | Статус |
|--------|------------------|-------------|---------|
| B01 эталон (5 спрайтов) | 5 | 5 webp | integrated, needs visual QA vs design A |
| B02–B20 состояния | ~80 | S0+S1+S3 tropical **и** S3 luxury/fantasy (v2 procedural) для всех B02–B20 | **WIP** — не Premium |
| Match-3 фишки | 5 | 5 | integrated |
| Match-3 усилители | 4 | 4 | integrated |
| UI кнопки/иконки/nav | 15+ | 15 | integrated (procedural original) |
| Зоны ландшафта | 7+sil | 8 | integrated (procedural WIP) |
| Препятствия Match-3 | 6+ | 2 TEMP (crate/ice) | integrated |
| Персонажи | 4+ | 4 TEMP portraits (Клеш/Майя-робот/Кеф/Исследователь) | **TEMP concepts** — CHAR names not final canon |
| VFX атласы | 3+ | 3 webp (clear/zone/star) + code sparkles | TEMP integrated |

## Что обновлено 2026-11-21 (art pass)
- `tools/art/generate_buildings_v2.py` — уникальные силуэты B02–B20 по роли.
- GenerateImage → process: B03/B05/B10/B20 tropical S3; chars/*; vfx/*.
- StoryOverlay показывает TEMP-портрет по speaker.
- BoardView clear использует `vfx/clear_burst.webp` (+ particle sparkles).

## Лицензии
- Все текущие файлы в `public/assets` — оригинальные ресурсы проекта (генерация/процедурная графика).

## Ограничения
- GenerateImage → JPG без альфы → flood-fill WebP.
- Не объявлять Premium Stylized / CHAR канон завершёнными.
- Luxury/fantasy S3 есть как v2 procedural webp; это не финальный Premium pass.

## Пайплайн
`Requirement → Generate/Procedural → process_sprites → public/assets → Assets.load → сцена`
