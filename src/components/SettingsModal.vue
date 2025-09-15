<script setup>
import { useTradeStore } from "../stores/store.js";
import { useTradeCalc } from "../composables/useTradeCalc.js";

const store = useTradeStore();
const { a4 } = useTradeCalc();

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close"]);
</script>

<template>
	<div v-if="open" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-gray-800 rounded-lg p-6 w-72 relative shadow-lg">
			<!-- Close button -->
			<button @click="emit('close')" class="absolute top-3 right-3 text-gray-400 hover:text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Header -->
			<h2 class="text-lg font-bold text-blue-400 mb-4">⚙️ Input Data</h2>

			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<label class="w-24 text-sm text-gray-300">Depo, $</label>
					<input v-model.number="store.a1" type="number" placeholder="Deposit"
						class="w-24 bg-gray-800 input-cell flex-1" />
				</div>
				<div class="flex items-center gap-2">
					<label class="w-24 text-sm text-gray-300">Risk, %</label>
					<input v-model.number="store.a2" type="number" placeholder="Risk %"
						class="w-24 bg-gray-800 input-cell flex-1" />
				</div>
				<div class="flex items-center gap-2">
					<label class="w-24 text-sm text-gray-300">Fix TP1, %</label>
					<input v-model.number="store.fixTp1" type="number" placeholder="Fix %"
						class="w-24 bg-gray-800 input-cell flex-1" />
				</div>

				<div class="flex text-sm pt-2 gap-2 border-t border-gray-700">
					<span class="text-red-400">SL, $:</span>
					<span class="font-semibold text-red-400">{{ a4 }}</span>
				</div>
			</div>
		</div>
	</div>
</template>