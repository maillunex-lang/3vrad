# Производство графики — журнал

**Стиль:** Paradise Premium Stylized 2D (GDD-15).  
**Каталог runtime:** `apps/client/public/assets/catalog/assets_v1.json`  
**Инструменты:** Cursor GenerateImage + Pillow process; procedural UI/terrain/B02–B20.

## Сводка (факт)

| Группа | Нужно (ориентир) | Есть в игре | Статус |
|--------|------------------|-------------|---------|
| B01 эталон (5 спрайтов) | 5 | 5 webp | integrated, needs visual QA vs design A |
| B02–B20 состояния | ~80 | procedural webp | **WIP** — не финальный Premium art |
| Match-3 фишки | 5 | 5 | integrated |
| Match-3 усилители | 4 | 4 | integrated |
| UI кнопки/иконки/nav | 15+ | 15 | integrated (procedural original) |
| Зоны ландшафта | 7+sil | 8 | integrated (procedural WIP) |
| Препятствия Match-3 | 6+ | 0 dedicated | missing (graphics fallback in engine) |
| Персонажи | TBD | 0 | blocked on name canon |
| VFX атласы | 3+ | code particles | partial |

## Лицензии
- Все текущие файлы в `public/assets` — оригинальные ресурсы проекта (генерация/процедурная графика), без чужих паков.
- Сторонние библиотеки не подключались в этом проходе (Kenney и др. — кандидаты на следующий поиск CC0 для props).

## Ограничения
- GenerateImage отдаёт JPG без альфы → `tools/art/process_sprites.py` flood-fill + WebP.
- B01 не объявляется полностью соответствующим референсу A без визуальной приёмки владельцем.
- B02–B20 помечены WIP; объекты раздельные и заменяемые.

## Пайплайн
`Requirement → Generate/Procedural → process_sprites → public/assets → Assets.load → сцена`
