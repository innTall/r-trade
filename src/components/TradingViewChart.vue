<script setup>
import { onMounted } from "vue";

const props = defineProps({ symbol: String });

function loadScript(src) {
	return new Promise((resolve, reject) => {
		if (document.querySelector(`script[src="${src}"]`)) return resolve();
		const script = document.createElement("script");
		script.src = src;
		script.onload = resolve;
		script.onerror = reject;
		document.head.appendChild(script);
	});
}

onMounted(async () => {
	await loadScript("https://s3.tradingview.com/tv.js");
	if (window.TradingView) {
		new window.TradingView.widget({
			container_id: "tradingview-chart",
			autosize: true,
			symbol: props.symbol,
			interval: "15",
			timezone: "Etc/UTC",
			theme: "dark",
			style: "1",
			locale: "en",
		});
	}
});
</script>

<template>
	<div id="tradingview-chart" class="w-full h-full"></div>
</template>

<!-- Add script in index.html -->
<!-- <script src="https://s3.tradingview.com/tv.js"></script> -->
