import type { ProjectDocument, MasonryResult } from '../domain/types';
import { deriveWalls, area } from '../domain/geometry';

export function billRows(project: ProjectDocument, result: MasonryResult) {
  const walls = new Map(deriveWalls(project).map(w => [w.id, w]));
  return project.profiles.flatMap(material => material.stock.flatMap(sku =>
    ['Наружные', 'Внутренние'].map(kind => {
      const pieces = result.pieces.filter(piece => piece.profileId === material.id
        && piece.stockId === sku.id
        && (walls.get(piece.wallId)!.roomIds.length === 1 ? 'Наружные' : 'Внутренние') === kind);
      const ids = new Set(pieces.map(piece => piece.stockIndex));
      const stock = result.stock.filter(item => ids.has(item.id));
      const volume = stock.reduce((sum, item) => sum + item.length * material.width * material.height, 0);
      const placedVolume = pieces.reduce((sum, piece) => sum + area(piece.footprint) * piece.height, 0);
      const remainingLength = stock.reduce((sum, item) => sum + item.remaining, 0);
      const reusableLength = stock.reduce((sum, item) => sum + (item.remaining >= material.length / 2 - 1e-6 ? item.remaining : 0), 0);
      const reusableVolume = reusableLength * material.width * material.height;
      // Includes sawdust, short ends, cuts in height and material removed at angled corners.
      const wasteVolume = Math.max(0, volume - placedVolume - reusableVolume);
      return { kind, material: material.name, sku: sku.name, stockCount: stock.length,
        pieces: pieces.length, cuts: pieces.filter(piece => piece.cut).length,
        volume, placedVolume, remainingLength, reusableLength, reusableVolume, wasteVolume,
        kerf: stock.reduce((sum, item) => sum + item.kerf, 0) };
    })
  )).filter(row => row.stockCount);
}

export function billCsv(project: ProjectDocument, result: MasonryResult) {
  const lines = [
    [result.complete ? 'Раскладка завершена' : 'НЕПОЛНАЯ РАСКЛАДКА — не использовать как полный заказ'],
    ['Стены', 'Материал', 'Изделие', 'Исходных изделий', 'Деталей', 'Деталей с резом',
      'Закупочный объём м³', 'Установленный объём м³', 'Отходы м³', 'Пригодные остатки м³', 'Остатки м', 'Пропил м'],
    ...billRows(project, result).map(row => [row.kind, row.material, row.sku, row.stockCount,
      row.pieces, row.cuts, row.volume.toFixed(4), row.placedVolume.toFixed(4),
      row.wasteVolume.toFixed(4), row.reusableVolume.toFixed(4), row.remainingLength.toFixed(3), row.kerf.toFixed(3)])
  ];
  return '\ufeff' + lines.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(';')).join('\r\n');
}
