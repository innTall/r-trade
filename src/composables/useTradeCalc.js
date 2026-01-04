import {computed} from "vue";
import {useTradeStore} from "../stores/store.js";

export function useTradeCalc() {
  const store = useTradeStore();

  // --- Global ---
  const a4 = computed(
    () => Math.round(((store.a1 * store.a2) / 100) * 10) / 10
  );

  // --- Long ---
  const L1 = computed(() =>
    store.L6 != null && store.L7 != null
      ? +(a4.value / (store.L6 - store.L7)).toFixed(4)
      : 0
  );
  const L2 = computed(() => +(L1.value * store.L6).toFixed(1));
  const L3 = computed(() =>
    store.L6 != null && store.L7 != null
      ? Math.round((1 / (1 - store.L6 / store.L7)) * -1)
      : 0
  );
  const L5 = computed(() =>
    store.L6 != null && store.L7 != null
      ? +(((a4.value / (store.L6 - store.L7)) * store.L6) / store.L4).toFixed(1)
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

  // Validation rules (Long)
  const longErrors = computed(() => {
    const errors = {};
    if (store.L7 >= store.L6) errors.L7 = true;
    if (store.L8 <= store.L6) errors.L8 = true;
    if (store.L9 <= store.L6) errors.L9 = true;
    return errors;
  });

  // --- Short ---
  const S1 = computed(() =>
    store.S7 != null && store.S6 != null
      ? +(a4.value / (store.S7 - store.S6)).toFixed(4)
      : 0
  );
  const S2 = computed(() => +(S1.value * store.S6).toFixed(1));
  const S3 = computed(() =>
    store.S6 != null && store.S7 != null
      ? Math.round((1 / (1 - store.S7 / store.S6)) * -1)
      : 0
  );
  const S5 = computed(() =>
    store.S6 != null && store.S7 != null
      ? +(((a4.value / (store.S7 - store.S6)) * store.S6) / store.S4).toFixed(1)
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

  // Validation rules (Short)
  const shortErrors = computed(() => {
    const errors = {};
    if (store.S7 <= store.S6) errors.S7 = true;
    if (store.S8 >= store.S6) errors.S8 = true;
    if (store.S9 >= store.S6) errors.S9 = true;
    return errors;
  });

  // --- Profit calculations ---
  const L10 = computed(() =>
    store.L6 && store.L8 && store.L9 && L1.value
      ? +(((store.L8 + store.L9 - store.L6 * 2) * L1.value) / 2).toFixed(1)
      : 0
  );

  const S10 = computed(() =>
    store.S6 && store.S8 && store.S9 && S1.value
      ? +(((store.S6 * 2 - store.S8 - store.S9) * S1.value) / 2).toFixed(1)
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
  🟢 ${store.L_symbol} LONG => x${store.L4} * ${L5.value} $ = ${L2.value} $
  ✅ TP1: ${store.L8} | ✅ TP2: ${store.L9}
  💰 Buy: ${store.L6}
  ❌ SL: ${store.L7}
📌${commentText ? commentText : ""}`.trim();
  });

  const shortMessage = computed(() => {
    const commentText = store.S_comment?.trim();
    return `
  🔴 ${store.S_symbol} SHORT => x${store.S4} * ${S5.value} $ = ${S2.value} $
  ❌ SL: ${store.S7}
  💰 Sell: ${store.S6}
  ✅ TP1: ${store.S8} | ✅ TP2: ${store.S9}
📌${commentText ? commentText : ""}`.trim();
  });

  return {
    // global
    a4,
    // long
    L1,
    L2,
    L3,
    L5,
    L10,
    L11,
    L12,
    L13,
    L14,
    longMessage,
    longErrors,
    longFixation,
    // short
    S1,
    S2,
    S3,
    S5,
    S10,
    S11,
    S12,
    S13,
    S14,
    shortMessage,
    shortErrors,
    shortFixation
  };
}
