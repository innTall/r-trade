<script setup>
import { ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import SettingsModal from "./SettingsModal.vue";
import LogoItem from "./LogoItem.vue";
import { CogIcon } from "@heroicons/vue/24/outline";
import {
	ArrowTrendingUpIcon as ArrowUpOutline,
	ArrowTrendingDownIcon as ArrowDownOutline,
} from "@heroicons/vue/24/outline";
import {
	ArrowTrendingUpIcon as ArrowUpSolid,
	ArrowTrendingDownIcon as ArrowDownSolid,
} from "@heroicons/vue/24/solid";

const route = useRoute();
const showSettings = ref(false);
</script>

<template>
	<nav
		class="fixed bottom-0 left-0 right-0 h-14 bg-gray-800 border-t border-gray-700 shadow-md flex items-center justify-between px-2">
		<LogoItem />

		<!-- Settings -->
		<div class="flex justify-between items-center gap-10 px-2">
			<button @click="showSettings = true">
				<CogIcon class="w-6 h-6 text-gray-400 hover:text-white" />
			</button>

			<!-- Long -->
			<RouterLink :to="{ name: 'Long' }">
				<component :is="route.name === 'Long' ? ArrowUpSolid : ArrowUpOutline"
					class="transition-all duration-200" :class="route.name === 'Long'
						? 'w-8 h-8 text-green-500'
						: 'w-6 h-6 text-gray-400 hover:text-gray-200'" />
			</RouterLink>

			<!-- Short -->
			<RouterLink :to="{ name: 'Short' }">
				<component :is="route.name === 'Short' ? ArrowDownSolid : ArrowDownOutline"
					class="transition-all duration-200" :class="route.name === 'Short'
						? 'w-8 h-8 text-red-500'
						: 'w-6 h-6 text-gray-400 hover:text-gray-200'" />
			</RouterLink>
		</div>

		<!-- Modal -->
		<SettingsModal :open="showSettings" @close="showSettings = false" />
	</nav>
</template>

<!--style scoped>
:global(body) {
	padding-bottom: 4rem;
}
</style-->
