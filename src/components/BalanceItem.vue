<!--src/components/BalanceItem.vue-->
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useTradeStore } from "../stores/store.js";

const balanceState = reactive({
  receivedAt: null,
  error: null,
  loading: true
});
let balanceRequest;

const store = useTradeStore();
const showDetails = ref(false);

// Округление до 1 знака и знак $ вместо USDT (никак не влияет на store.balance в расчетах)
const formattedBalance = computed(() =>
  store.balance === null
    ? "—"
    : `$${new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(store.balance)}`
);

const lastUpdated = computed(() => {
  if (!balanceState.receivedAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(balanceState.receivedAt));
});

const status = computed(() => {
  if (balanceState.loading) return "loading";
  return balanceState.error ? "error" : "success";
});

function getErrorMessage(error) {
  return error instanceof Error && error.message
    ? error.message
    : "Не удалось получить баланс BingX.";
}

// Функция загрузки с возможностью принудительного рефреша
async function loadBalance(force = false) {
  if (balanceRequest && !force) return balanceRequest;

  balanceState.loading = true;
  balanceRequest = (async () => {
    try {
      const response = await fetch("/.netlify/functions/getBingxBalance");
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Сервис BingX вернул некорректный JSON.");
      }

      if (!response.ok) {
        const message =
          result &&
            typeof result.error === "string" &&
            result.error.trim()
            ? result.error
            : `Не удалось получить баланс (HTTP ${response.status}).`;
        throw new Error(message);
      }

      if (
        !result ||
        typeof result !== "object" ||
        result.asset !== "USDT" ||
        typeof result.balance !== "number" ||
        !Number.isFinite(result.balance) ||
        result.balance < 0 ||
        typeof result.receivedAt !== "string" ||
        !Number.isFinite(Date.parse(result.receivedAt))
      ) {
        throw new Error("Сервис BingX вернул некорректные данные баланса.");
      }

      balanceState.receivedAt = result.receivedAt;
      balanceState.error = null;
      store.balance = result.balance;
    } catch (error) {
      balanceState.error = getErrorMessage(error);
    } finally {
      balanceState.loading = false;
      balanceRequest = null;
    }
  })();

  return balanceRequest;
}

onMounted(() => loadBalance());
</script>

<template>
  <div class="relative flex min-w-0 items-center gap-1">
    <!-- Клик по блоку баланса принудительно обновляет его с биржи -->
    <div class="min-w-0 leading-tight cursor-pointer hover:opacity-80 transition-opacity"
      title="Нажмите, чтобы обновить баланс" @click="loadBalance(true)">
      <div class="whitespace-nowrap text-xs font-semibold text-white">
        {{ formattedBalance }}
      </div>
      <div class="text-[10px] text-gray-400">BingX 🔄</div>
    </div>

    <button type="button"
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
      :aria-label="`Состояние баланса BingX: ${status === 'loading'
          ? 'загрузка'
          : status === 'error'
            ? 'ошибка'
            : 'актуален'
        }`" :aria-expanded="showDetails" @click="showDetails = !showDetails">
      <span class="h-2 w-2 rounded-full" :class="{
        'bg-yellow-400': status === 'loading',
        'bg-red-500': status === 'error',
        'bg-green-500': status === 'success'
      }" />
    </button>

    <div v-if="showDetails"
      class="absolute bottom-full right-0 z-20 mb-2 w-64 rounded bg-gray-700 p-2 text-xs text-gray-100 shadow-lg"
      role="status">
      <p v-if="status === 'loading'">Загрузка баланса BingX…</p>
      <template v-else>
        <p v-if="balanceState.error" class="text-red-300">
          Ошибка: {{ balanceState.error }}
        </p>
        <p v-if="lastUpdated" class="mt-1 text-gray-300">
          Последнее успешное обновление: {{ lastUpdated }}
        </p>
        <p v-else-if="!balanceState.error" class="text-gray-300">
          Время обновления недоступно.
        </p>
        <button @click="loadBalance(true)"
          class="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded px-2 py-1 text-center">
          Обновить сейчас
        </button>
      </template>
    </div>
  </div>
</template>