<template><teleport to="#frame"><div class="mask" v-if="modelValue" @click="$emit('update:modelValue', false)"></div>
<div class="sheet" :class="{ on: modelValue }"><div class="hd"></div><slot /></div></teleport></template>
<script setup lang="ts">defineProps<{ modelValue: boolean }>(); defineEmits(['update:modelValue'])</script>
