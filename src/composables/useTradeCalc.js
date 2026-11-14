// src/composables/useTradeCalc.js
/**
 * CheatSheet of all computed values for Long and Short trades:
 * a4 = Сумма риска ($)
 * L1 = Общий объем (Long)
 * L_tp1Qty = Объем TP1 (50% от L1)
 * L_remQty = Остаток объема для TP2
 * L2 = Стоимость позиции | L3 = Плечо ликвидации | L5 = Маржа
 * L10 = Общая прибыль | L11 = RR (Риск/Прибыль)
 * L12..L14 = Проценты TP1, TP2, SL | L15..L17 = Деньги TP1, TP2, SL
 */

import {computed} from "vue";
import {useTradeStore} from "../stores/store.js";

/**
 * Вспомогательная функция для точного расчета объемов через целые тики
 */
function calculateSplitVolumes(rawQty, specs) {
  const precision =
    specs?.quantityPrecision != null ? Number(specs.quantityPrecision) : 4;
  const minQty =
    specs?.tradeMinQuantity != null ? Number(specs.tradeMinQuantity) : 0;

  if (!rawQty || rawQty <= 0 || !isFinite(rawQty)) {
    return {totalQty: 0, tp1Qty: 0, remQty: 0, error: null};
  }

  const multiplier = Math.pow(10, precision);
  const totalTicks = Math.floor(rawQty * multiplier);
  const minTicks = Math.round(minQty * multiplier);

  const tp1Ticks = Math.floor(totalTicks / 2);
  const remTicks = totalTicks - tp1Ticks; // Арифметический остаток

  const totalQty = +(totalTicks / multiplier).toFixed(precision);
  const tp1Qty = +(tp1Ticks / multiplier).toFixed(precision);
  const remQty = +(remTicks / multiplier).toFixed(precision);

  let error = null;
  if (minTicks > 0) {
    if (totalTicks < minTicks) {
      error = `Объем (${totalQty}) меньше минимального (${minQty})`;
    } else if (tp1Ticks < minTicks || remTicks < minTicks) {
      error = `Половина объема (${tp1Qty}) меньше мин. лота (${minQty}). Увеличьте риск или сузьте стоп.`;
    }
  }

  return {totalQty, tp1Qty, remQty, error};
}

export function useTradeCalc() {
  const store = useTradeStore();

  // --- Global ---
  const a4 = computed(
    () =>
      Math.round(((store.effectiveCalculationBalance * store.a2) / 100) * 10) /
      10
  );

  // --- Long ---
  const longVolumes = computed(() => {
    if (store.L6 == null || store.L7 == null || store.L6 <= store.L7) {
      return {totalQty: 0, tp1Qty: 0, remQty: 0, error: null};
    }
    const rawQty = a4.value / (store.L6 - store.L7);
    return calculateSplitVolumes(rawQty, store.contractSpecs);
  });

  const L1 = computed(() => longVolumes.value.totalQty);
  const L_tp1Qty = computed(() => longVolumes.value.tp1Qty);
  const L_remQty = computed(() => longVolumes.value.remQty);
  const L_qtyError = computed(() => longVolumes.value.error);

  const L2 = computed(() => +(L1.value * store.L6).toFixed(1));
  const L3 = computed(() =>
    store.L6 != null && store.L7 != null
      ? Math.round((1 / (1 - store.L6 / store.L7)) * -1)
      : 0
  );
  const L5 = computed(() =>
    store.L6 != null && store.L7 != null && store.L4
      ? +((L1.value * store.L6) / store.L4).toFixed(1)
      : 0
  );

  const L12 = computed(() =>
    store.L6 != null && store.L8 != null
      ? +((store.L8 / store.L6 - 1) * 100).toFixed(1)
      : 0
  );

  const L13 = computed(() =>
    store.L6 != null && store.L9 != null
      ? +((store.L9 / store.L6 - 1) * 100).toFixed(1)
      : 0
  );

  const L14 = computed(() =>
    store.L6 != null && store.L7 != null
      ? +((store.L7 / store.L6 - 1) * 100).toFixed(1)
      : 0
  );

  // Прибыль TP1 и TP2 по реальным частям объема
  const L15 = computed(() =>
    store.L6 != null && store.L8 != null
      ? +((store.L8 - store.L6) * L_tp1Qty.value).toFixed(1)
      : 0
  );

  const L16 = computed(() =>
    store.L6 != null && store.L9 != null
      ? +((store.L9 - store.L6) * L_remQty.value).toFixed(1)
      : 0
  );

  const L17 = computed(() =>
    store.L6 != null && store.L7 != null
      ? +((store.L7 - store.L6) * L1.value).toFixed(1)
      : 0
  );

  const longErrors = computed(() => {
    const errors = {};
    if (store.L4 > store.contractSpecs?.maxLeverage) errors.L4 = true;
    if (store.L7 >= store.L6) errors.L7 = true;
    if (store.L8 <= store.L6) errors.L8 = true;
    if (store.L9 <= store.L6) errors.L9 = true;
    if (L_qtyError.value) errors.qty = true;
    return errors;
  });

  // --- Short ---
  const shortVolumes = computed(() => {
    if (store.S6 == null || store.S7 == null || store.S7 <= store.S6) {
      return {totalQty: 0, tp1Qty: 0, remQty: 0, error: null};
    }
    const rawQty = a4.value / (store.S7 - store.S6);
    return calculateSplitVolumes(rawQty, store.contractSpecs);
  });

  const S1 = computed(() => shortVolumes.value.totalQty);
  const S_tp1Qty = computed(() => shortVolumes.value.tp1Qty);
  const S_remQty = computed(() => shortVolumes.value.remQty);
  const S_qtyError = computed(() => shortVolumes.value.error);

  const S2 = computed(() => +(S1.value * store.S6).toFixed(1));
  const S3 = computed(() =>
    store.S6 != null && store.S7 != null
      ? Math.round((1 / (1 - store.S7 / store.S6)) * -1)
      : 0
  );
  const S5 = computed(() =>
    store.S6 != null && store.S7 != null && store.S4
      ? +((S1.value * store.S6) / store.S4).toFixed(1)
      : 0
  );

  const S12 = computed(() =>
    store.S6 != null && store.S8 != null
      ? +((1 - store.S8 / store.S6) * 100).toFixed(1)
      : 0
  );

  const S13 = computed(() =>
    store.S6 != null && store.S9 != null
      ? +((1 - store.S9 / store.S6) * 100).toFixed(1)
      : 0
  );

  const S14 = computed(() =>
    store.S6 != null && store.S7 != null
      ? +((1 - store.S7 / store.S6) * 100).toFixed(1)
      : 0
  );

  const S15 = computed(() =>
    store.S6 != null && store.S8 != null
      ? +((store.S6 - store.S8) * S_tp1Qty.value).toFixed(1)
      : 0
  );

  const S16 = computed(() =>
    store.S6 != null && store.S9 != null
      ? +((store.S6 - store.S9) * S_remQty.value).toFixed(1)
      : 0
  );

  const S17 = computed(() =>
    store.S6 != null && store.S7 != null
      ? +((store.S6 - store.S7) * S1.value).toFixed(1)
      : 0
  );

  const shortErrors = computed(() => {
    comm;
    const errors = {};
    if (store.S4 > store.contractSpecs?.maxLeverage) errors.S4 = true;
    if (store.S7 <= store.S6) errors.S7 = true;
    if (store.S8 >= store.S6) errors.S8 = true;
    if (store.S9 >= store.S6) errors.S9 = true;
    if (S_qtyError.value) errors.qty = true;
    return errors;
  });

  // --- Profit calculations ---
  const L10 = computed(() =>
    store.L6 && store.L8 && store.L9 && L1.value
      ? +(L15.value + L16.value).toFixed(1)
      : 0
  );

  const S10 = computed(() =>
    store.S6 && store.S8 && store.S9 && S1.value
      ? +(S15.value + S16.value).toFixed(1)
      : 0
  );

  // --- Profit/Risk Ratios ---
  const L11 = computed(() =>
    a4.value ? +(L10.value / a4.value).toFixed(2) : 0
  );

  const S11 = computed(() =>
    a4.value ? +(S10.value / a4.value).toFixed(2) : 0
  );

  // --- Fixation suggestions ---
  const longFixation = computed(() => ({
    suggestTP1: store.fixTp1,
    suggestTP2: 100 - store.fixTp1
  }));

  const shortFixation = computed(() => ({
    suggestTP1: store.fixTp1,
    suggestTP2: 100 - store.fixTp1
  }));

  // --- Telegram messages ---
  const longMessage = computed(() => {
    const commentText = store.L_comment?.trim();
    return `
  🟢 ${store.L_symbol} => x${store.L4} * ${L5.value} $ = ${L2.value} $
  ✅ TP2: ${store.L9} => ${L13.value} % => ${L16.value} $
  ✅ TP1: ${store.L8} => ${L12.value} % => ${L15.value} $
  ENTRY: ${store.L6} => RR ${L11.value}
  ❌ SL: ${store.L7} => ${L14.value} % => ${L17.value} $
  ------------------------------------
📝 ${commentText ? commentText : ""}`.trim();
  });

  const shortMessage = computed(() => {
    const commentText = store.S_comment?.trim();
    return `
  🔴 ${store.S_symbol} => x${store.S4} * ${S5.value} $ = ${S2.value} $
  ❌ SL: ${store.S7} => ${S14.value} % => ${S17.value} $
  ENTRY: ${store.S6} => RR ${S11.value}
  ✅ TP1: ${store.S8} => ${S12.value} % => ${S15.value} $
  ✅ TP2: ${store.S9} => ${S13.value} % => ${S16.value} $
  ------------------------------------
📝 ${commentText ? commentText : ""}`.trim();
  });

  return {
    a4,
    L1,
    L_tp1Qty,
    L_remQty,
    L_qtyError,
    L2,
    L3,
    L5,
    L10,
    L11,
    L12,
    L13,
    L14,
    L15,
    L16,
    L17,
    longMessage,
    longErrors,
    longFixation,
    S1,
    S_tp1Qty,
    S_remQty,
    S_qtyError,
    S2,
    S3,
    S5,
    S10,
    S11,
    S12,
    S13,
    S14,
    S15,
    S16,
    S17,
    shortMessage,
    shortErrors,
    shortFixation
  };
}
