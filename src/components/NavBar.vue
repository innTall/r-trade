<script setup>
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import SettingsModal from "./SettingsModal.vue";
import LogoItem from "./LogoItem.vue";
import { CogIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
const showSettings = ref(false);
</script>

<template>
	<nav
		class="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-700 shadow-md flex items-center justify-around px-4">
		<LogoItem />

		<!-- Settings -->
		<button @click="showSettings = true">
			<CogIcon class="w-6 h-6 text-gray-400 hover:text-white" />
		</button>

		<!-- Long -->
		<RouterLink :to="{ name: 'Long' }">
			<ArrowTrendingUpIcon class="transition-transform duration-200"
				:class="route.name === 'LongData' ? 'w-8 h-8 text-green-400' : 'w-6 h-6 text-gray-400 hover:text-gray-200'" />
		</RouterLink>

		<!-- Short -->
		<RouterLink :to="{ name: 'Short' }">
			<ArrowTrendingDownIcon class="transition-transform duration-200"
				:class="route.name === 'ShortData' ? 'w-8 h-8 text-red-400' : 'w-6 h-6 text-gray-400 hover:text-gray-200'" />
		</RouterLink>

		<!-- Modal -->
		<SettingsModal :open="showSettings" @close="showSettings = false" />
	</nav>
</template>

<style scoped>
:global(body) {
	padding-bottom: 4rem;
}
</style>
