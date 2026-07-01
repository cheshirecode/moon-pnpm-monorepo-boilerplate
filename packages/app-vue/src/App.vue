<script setup lang="ts">
import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';

const contract = createRendererDemoContract('Vue');
</script>

<template>
  <main>
    <h1>{{ contract.title }}</h1>
    <p>{{ formatRendererDemo(contract) }}</p>
    <p>{{ contract.url }}</p>
  </main>
</template>
