<script setup>
import { createChart } from 'lightweight-charts';
import { ref, onMounted, reactive } from 'vue';

// Chart container ref
const chartContainer = ref(null);

// Reactive inputs (pre-calculated prices)
const priceData = reactive({
	buyPrice: 100, // Default last price
	profitPrice: 110, // buyPrice * 1.1
	lossPrice: 95, // buyPrice * 0.95
	lastPrice: 100, // Current market price
});

// Chart setup
let chart;
let series;
const chartOffset = 10; // Offset for the chart
const indicatorOffset = 8; // Offset for the indicator

onMounted(() => {
	// Initialize the chart
	chart = createChart(chartContainer.value, {
		width: chartContainer.value.offsetWidth,
		height: 300,
		layout: {
			textColor: '#d1d4dc',
			backgroundColor: '#131722',
		},
		grid: {
			vertLines: {
				color: '#0000ff',
			},
			horzLines: {
				color: '#363c4e',
			},
		},
		timeScale: {
			rightOffset: chartOffset, // Chart-specific offset
		},
	});

	// Add candlestick series (dummy data for demonstration)
	series = chart.addCandlestickSeries();
	const data = [
		{ time: '2022-12-15', open: 95, high: 105, low: 90, close: 100 },
		{ time: '2022-12-16', open: 100, high: 110, low: 90, close: 102 },
		{ time: '2022-12-17', open: 102, high: 108, low: 96, close: 106 },
		{ time: '2022-12-18', open: 101, high: 105, low: 95, close: 100 },
		{ time: '2022-12-19', open: 100, high: 110, low: 90, close: 102 },
		{ time: '2022-12-20', open: 102, high: 108, low: 96, close: 106 },
	];
	series.setData(data);

	// Get the last candle's time and calculate the offset
	const lastCandleTime = data[data.length - 1].time; // e.g., '2022-12-20'
	const futureTime = calculateFutureTime(lastCandleTime, indicatorOffset);

	// Draw annotations
	drawAnnotations(futureTime);
});

// Function to calculate future time based on last candle's time
function calculateFutureTime(lastTime, offset) {
	const lastDate = new Date(lastTime); // Parse time as a date object
	lastDate.setDate(lastDate.getDate() + offset); // Add offset days
	return lastDate.toISOString().split('T')[0]; // Return in 'YYYY-MM-DD' format
}

// Function to draw annotations
function drawAnnotations(futureTime) {
	// Add markers for buyPrice, profitPrice, and lossPrice
	const markers = [
		{
			time: futureTime, // Logical position for the future candle
			position: 'belowBar',
			color: 'blue',
			shape: 'circle',
			text: `Buy: ${priceData.buyPrice}`,
		},
		{
			time: futureTime,
			position: 'aboveBar',
			color: 'green',
			shape: 'circle',
			text: `Profit: ${priceData.profitPrice}`,
		},
		{
			time: futureTime,
			position: 'belowBar',
			color: 'red',
			shape: 'circle',
			text: `Loss: ${priceData.lossPrice}`,
		},
	];

	// Overwrite markers by re-adding them
	series.setMarkers(markers);
}
</script>

<template>
	<div ref="chartContainer" class="w-full h-[300px] border border-gray-700"></div>
</template>

<style scoped></style>