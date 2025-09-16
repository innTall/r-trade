<script setup>
import { RouterView } from "vue-router";
import NavBar from "@/components/NavBar.vue";
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-900 text-gray-100">
    <!-- Page content fills everything except navbar -->
    <div class="flex-1">
      <RouterView />
    </div>
    <!-- Persistent navbar -->
    <NavBar class="h-14" />
  </div>
</template>

<style scoped></style>
