<script setup>
import { RouterView } from "vue-router";
import NavBar from "@/components/NavBar.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100">
    <!-- Main content -->
    <RouterView />
    <!-- Persistent navbar -->
    <NavBar />
  </div>
</template>

<style scoped></style>
