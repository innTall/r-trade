// src/stores/store.js
import {defineStore} from "pinia";
import {computed, ref} from "vue";

export const DEFAULT_CALCULATION_BALANCE = 1000;

export const useTradeStore = defineStore(
  "trade",
  () => {
    // --- Global inputs ---
    const balance = ref(null); // Confirmed BingX USDT balance
    const effectiveCalculationBalance = computed(() =>
      Number.isFinite(balance.value)
        ? balance.value
        : DEFAULT_CALCULATION_BALANCE
    );
    const a2 = ref(1); // Risk %
    const beDiff = ref(0.2); // BE Diff %
    const fixTp1 = ref(50); // fix for TP1

    // --- Contract Specs (loaded from BingX) ---
    const contractSpecs = ref({
      quantityPrecision: 3, // дефолтные значения на случай сбоя сети
      pricePrecision: 2,
      tradeMinQuantity: 0.001,
      maxLeverage: 125
    });

    // Экшен для получения спецификаций контракта
    async function fetchContractSpecs(symbol) {
      try {
        console.log(`[Store] Fetching contract specs for symbol: ${symbol}`);
        const response = `/.netlify/functions/getContractSpecs?symbol=${encodeURIComponent(symbol)}`;
        const res = await fetch(response);
        const data = await res.json();

        if (res.ok) {
          contractSpecs.value = data;
          console.log(`[Store] Contract specs loaded successfully:`, data);
        } else {
          console.warn(`[Store] Failed to load specs, using defaults:`, data);
        }
      } catch (error) {
        console.error(`[Store] Error fetching contract specs:`, error);
      }
    }

    // --- Long trade inputs ---
    const L_symbol = ref("BTC");
    const L4 = ref(25); // Leverage
    const L6 = ref(115500); // Buy
    const L7 = ref(112500); // SL
    const L8 = ref(119500); // TP1
    const L9 = ref(123500); // TP2
    const L_comment = ref(""); // custom comment for Long

    // --- Short trade inputs ---
    const S_symbol = ref("BTC");
    const S4 = ref(25); // Leverage
    const S6 = ref(112500); // Sell
    const S7 = ref(115500); // SL
    const S8 = ref(110500); // TP1
    const S9 = ref(107500); // TP2
    const S_comment = ref(""); // custom comment for Short

    // ✅ Must return a single object
    return {
      balance,
      effectiveCalculationBalance,
      a2,
      beDiff,
      fixTp1,
      contractSpecs,
      fetchContractSpecs,
      L_symbol,
      L4,
      L6,
      L7,
      L8,
      L9,
      L_comment,
      S_symbol,
      S4,
      S6,
      S7,
      S8,
      S9,
      S_comment,
    };
  },
  {
    // ✅ persist config must be in defineStore options, not inside return
    persist: {
      omit: ["a1", "balance"]
    }
  }
);
