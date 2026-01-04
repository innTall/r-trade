<script setup>
import { useTradeStore } from "../stores/store.js";
import { useTradeCalc } from "../composables/useTradeCalc.js";
import { sendTelegramMessage } from "../composables/useTelegram.js";
import TradingViewChart from "@/components/TradingViewChart.vue"; // add component

const store = useTradeStore();
const { S1, S2, S3, S5, S10, S11, S12, S13, S14, shortMessage, shortErrors, a4 } = useTradeCalc();

function clearAllShort() {
	store.S_symbol = "";
	store.S4 = 25; // reset leverage
	store.S6 = "";
	store.S7 = "";
	store.S8 = "";
	store.S9 = "";
	store.S_comment = "";
}

async function sendTelegram() {
	await sendTelegramMessage(shortMessage.value);
}

async function sendBingx() {
	console.log("Send to BingX:", longMessage.value);
	// 🔥 later: real API integration
}

async function sendArchive() {
	console.log("Archive trade:", longMessage.value);
	// 🔥 later: save to local DB / Netlify DB
}
</script>

<template>
	<div class="flex flex-col h-full p-4 text-gray-100">
		<!-- Header -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-red-400">Short Trade</h2>
			<div class="flex gap-6">
				<!-- Telegram -->
				<button @click="sendTelegram" class="w-6 h-6">
					<img src="/logo/telegram.png" alt="Telegram" class="w-6 h-6 object-contain" />
				</button>

				<!-- BingX -->
				<button @click="sendBingx" class="w-6 h-6">
					<img src="/logo/bingx.png" alt="BingX" class="w-6 h-6 object-contain" />
				</button>

				<!-- Archive -->
				<button @click="sendArchive" class="w-6 h-6">
					<img src="/logo/archive.png" alt="Archive" class="w-6 h-6 object-contain" />
				</button>

				<button @click="clearAllShort" class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg">
					All 🧹
				</button>
			</div>
		</div>

		<!-- Input panel -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Left column -->
			<div class="space-y-2">
				<!-- SL -->
				<div class="relative">
					<input v-model.number="store.S7" type="number" placeholder="SL" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-red-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-red-500"
						:class="shortErrors.S7 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.S7" @click="store.S7 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- Sell -->
				<div class="relative">
					<input v-model.number="store.S6" type="number" placeholder="Sell" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-blue-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-blue-500" />
					<button v-if="store.S6" @click="store.S6 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- TP1 -->
				<div class="relative">
					<input v-model.number="store.S8" type="number" placeholder="TP1" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-green-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-green-500"
						:class="shortErrors.S8 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.S8" @click="store.S8 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- TP2 -->
				<div class="relative">
					<input v-model.number="store.S9" type="number" placeholder="TP2" class="w-full rounded-md bg-gray-800 border px-3 py-2 text-green-400 pr-8
                   focus:outline-none focus:ring-2 focus:ring-green-500"
						:class="shortErrors.S9 ? 'border-red-500' : 'border-gray-600'" />
					<button v-if="store.S9" @click="store.S9 = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>
			</div>

			<!-- Right column -->
			<div class="space-y-2">
				<!-- Symbol -->
				<div class="relative">
					<input v-model="store.S_symbol" type="text" placeholder="SYMBOL" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 pr-8
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
						@input="store.S_symbol = store.S_symbol.toUpperCase()" />
					<button v-if="store.S_symbol" @click="store.S_symbol = ''"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
						🧹
					</button>
				</div>

				<!-- Leverage -->
				<input v-model.number="store.S4" type="number" placeholder="Leverage" class="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

				<!-- Calculated values -->
				<div class="text-center space-y-1">
					<p class="text-sm font-bold">Margin - <span class="text-white">{{ S5 }}</span> $</p>
					<p class="text-sm font-bold">Sum - <span class="text-white">{{ S2 }}</span> $</p>
					<p class="text-sm font-bold text-green-400">Profit - {{ S10 }} $</p>
					<p class="text-sm font-bold text-red-400">Loss - {{ a4 }} $</p>
				</div>
			</div>
		</div>

		<!-- Data row -->
		<div class="flex mt-4 text-gray-400 text-sm gap-2">
			<p>*TP1_{{ S12 }}%</p>
			<p>*TP2_{{ S13 }}%</p>
			<p>*SL_{{ S14 }}%</p>
			<p>*xMax_ {{ S3 }}</p>
			<p>*RR_{{ S11 }}</p>
		</div>

		<!-- Comment / Notes -->
		<input v-model="store.S_comment" type="text" placeholder="Entry model..." class="w-full mt-3 p-2 rounded-md bg-gray-800 border border-gray-600 text-gray-200
             focus:outline-none focus:ring-2 focus:ring-yellow-500" />

		<!-- Chart fills remaining space -->
		<div class="flex-1 min-h-0 mb-12 mt-2">
			<TradingViewChart v-if="store.S_symbol" :symbol="`BINGX:${store.S_symbol}USDT.P`" class="w-full h-full" />
		</div><!-- TradingView Chart -->
	</div>
</template>
<style scoped></style>
