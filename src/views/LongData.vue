<!--src/views/LongData.vue-->
<script setup>
import { ref } from "vue";
import { useTradeStore } from "../stores/store.js";
import { useTradeCalc } from "../composables/useTradeCalc.js";
import { sendTelegramMessage } from "../composables/useTelegram.js";
import { useBingxOrder } from "../composables/useBingxOrder.js";
import TradingViewChart from "@/components/TradingViewChart.vue";

const store = useTradeStore();
const { isLoading: isBingxLoading, sendOrderToBingx } = useBingxOrder();

const confirmedLongSymbol = ref("");
function confirmLongSymbol() {
	confirmedLongSymbol.value = store.L_symbol;
}

const { L1, L2, L3, L5, L10, L11, L12, L13, L14, longMessage, longErrors, a4 } = useTradeCalc();

function parsePositiveNumber(value, label) {
	const text = String(value ?? "").trim();
	if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
		return { error: `${label} must be a valid positive number.` };
	}

	const number = Number(text);
	if (!Number.isFinite(number) || number <= 0) {
		return { error: `${label} must be a valid positive number.` };
	}

	return { value: number };
}

function clearAllLong() {
	store.L_symbol = "";
	store.L4 = 25;
	store.L6 = "";
	store.L7 = "";
	store.L8 = "";
	store.L9 = "";
	store.L_comment = "";
}

async function sendTelegram() {
	await sendTelegramMessage(longMessage.value);
}

async function sendBingx() {
	if (isBingxLoading.value) return;

	const symbol = String(store.L_symbol ?? "").trim();
	if (!symbol) {
		alert("Заполните символ перед отправкой на BingX.");
		return;
	}

	const entryPriceResult = parsePositiveNumber(store.L6, "Цена входа");
	if (entryPriceResult.error) {
		alert(entryPriceResult.error);
		return;
	}
	const entryPrice = entryPriceResult.value;

	const contracts = Number(L1.value) || (Number(store.L2 || 10) * Number(store.L4 || 25)) / entryPrice;
	if (!Number.isFinite(contracts) || contracts <= 0) {
		alert("Не удалось рассчитать корректное количество контрактов. Проверьте цену, риск и плечо.");
		return;
	}
	const quantity = contracts.toFixed(3);
	if (Number(quantity) <= 0) {
		alert("Рассчитанное количество контрактов меньше минимально поддерживаемого значения.");
		return;
	}

	const symbolFormatted = symbol.includes("-")
		? symbol.toUpperCase()
		: `${symbol.toUpperCase()}-USDT`;

	// Базовые параметры ордера
	const orderParams = {
		symbol: symbolFormatted,
		side: "BUY",
		price: entryPrice,
		quantity
	};

	let successParts = ["Лимитный ордер"];

	// Встраиваем Stop Loss (store.L7), если задан
	const hasStopLoss = String(store.L7 ?? "").trim() !== "";
	if (hasStopLoss) {
		const stopPriceResult = parsePositiveNumber(store.L7, "Stop Loss");
		if (stopPriceResult.error) {
			alert(stopPriceResult.error);
			return;
		}
		if (stopPriceResult.value >= entryPrice) {
			alert("Для длинной позиции Stop Loss должен быть ниже цены входа.");
			return;
		}
		orderParams.stopLoss = {
			stopPrice: stopPriceResult.value
		};
		successParts.push("Stop Loss");
	}

	// Встраиваем TP2 / Entire Position (store.L9), если задан
	const hasTP2 = String(store.L9 ?? "").trim() !== "";
	if (hasTP2) {
		const tp2PriceResult = parsePositiveNumber(store.L9, "TP2");
		if (tp2PriceResult.error) {
			alert(tp2PriceResult.error);
			return;
		}
		if (tp2PriceResult.value <= entryPrice) {
			alert("Для длинной позиции TP2 должен быть выше цены входа.");
			return;
		}
		orderParams.takeProfit = {
			stopPrice: tp2PriceResult.value
		};
		successParts.push("TP2");
	}

	// Отправляем всё одним атомарным запросом
	const res = await sendOrderToBingx(orderParams);

	if (res.success) {
		alert(`${successParts.join(" + ")} успешно размещены на BingX за один запрос! 🚀`);
	} else {
		alert(`Ошибка BingX [${res.bingxCode}]: ${res.error}`);
	}
}

async function sendArchive() {
	// Archive logic
}
</script>

<template>
	<div class="flex flex-col h-full p-4 text-gray-100">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-green-400">Long Trade</h2>
			<div class="flex gap-6">
				<!-- Telegram -->
				<button @click="sendTelegram" class="w-6 h-6 disabled:cursor-not-allowed disabled:opacity-40">
					<img src="/logo/telegram.png" alt="Telegram" class="w-6 h-6 object-contain" />
				</button>

				<!-- BingX -->
				<button @click="sendBingx" :disabled="isBingxLoading"
					class="w-6 h-6 disabled:cursor-not-allowed disabled:opacity-40">
					<img src="/logo/bingx.png" alt="BingX" class="w-6 h-6 object-contain" />
				</button>

				<!-- Archive -->
				<button @click="sendArchive" class="w-6 h-6 disabled:cursor-not-allowed disabled:opacity-40">
					<img src="/logo/archive.png" alt="Archive" class="w-6 h-6 object-contain" />
				</button>

				<button @click="clearAllLong" class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg">
					All 🧹
				</button>
			</div>
		</div>

		<!-- Input panel -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Left column -->
			<div class="space-y-2">
				<!-- TP2 (Защищено от мобильных запятых) -->
				<div class="relative">
					<input v-model.number="store.L9" type="number" placeholder="TP2" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-green-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-green-500"
						:class="longErrors.L9 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.L9" @click="store.L9 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- TP1 -->
				<div class="relative">
					<input v-model.number="store.L8" type="number" placeholder="TP1" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-green-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-green-500"
						:class="longErrors.L8 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.L8" @click="store.L8 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- Buy -->
				<div class="relative">
					<input v-model.number="store.L6" type="number" placeholder="Buy" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-blue-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-blue-500" />
					<button v-if="store.L6" @click="store.L6 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- SL (Защищено от мобильных запятых) -->
				<div class="relative">
					<input v-model.number="store.L7" type="number" placeholder="SL" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-red-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-red-500"
						:class="longErrors.L7 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.L7" @click="store.L7 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>
			</div>

			<!-- Right column -->
			<div class="space-y-2">
				<!-- Symbol -->
				<div class="relative">
					<input v-model="store.L_symbol" type="text" placeholder="SYMBOL" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 pr-8
           focus:outline-none focus:ring-2 focus:ring-indigo-500"
						@input="store.L_symbol = store.L_symbol.toUpperCase()" @blur="confirmLongSymbol" />
					<button v-if="store.L_symbol" @click="store.L_symbol = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- Leverage -->
				<input v-model.number="store.L4" type="number" placeholder="Leverage" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

				<!-- Calculated values -->
				<div class="text-center space-y-1">
					<p class="text-sm font-bold">Margin - <span class="text-white">{{ L5 }}</span> $</p>
					<p class="text-sm font-bold">Sum - <span class="text-white">{{ L2 }}</span> $</p>
					<p class="text-sm font-bold text-green-400">Profit - {{ L10 }} $</p>
					<p class="text-sm font-bold text-red-400">Loss - {{ a4 }} $</p>
				</div>
			</div>
		</div>

		<!-- Data row -->
		<div class="flex mt-4 text-gray-400 text-sm gap-2">
			<p>*TP1_{{ L12 }}%</p>
			<p>*TP2_{{ L13 }}%</p>
			<p>*SL_{{ L14 }}%</p>
			<p>*xMax_{{ L3 }}</p>
			<p>*RR_{{ L11 }}</p>
		</div>

		<!-- Comment / Notes -->
		<input v-model="store.L_comment" type="text" placeholder="Entry model..." class="w-full mt-3 p-2 rounded-md bg-gray-800 border border-gray-600 text-gray-200
             focus:outline-none focus:ring-2 focus:ring-yellow-500" />

		<!-- Chart fills remaining space -->
		<div class="flex-1 min-h-0 mb-12 mt-2">
			<TradingViewChart v-if="confirmedLongSymbol" :key="confirmedLongSymbol"
				:symbol="`BINGX:${confirmedLongSymbol}USDT.P`" class="w-full h-full" />
		</div>
	</div>
</template>
<style scoped></style>