<script setup>
</script>

<template>
	<div class="flex gap-2">
		<RouterLink :to="{ name: 'Long' }">
			<img src="/icon.png" alt="Logo" class="h-10 w-10" />
		</RouterLink>
		<div class="text-white">
			<p class="text-sm text-right">
				<strong>
					<span>R-Trade</span>
				</strong>
				<br>
				<small>Trade is easy!</small>
			</p>
		</div>
	</div>
</template>
<style scoped></style>