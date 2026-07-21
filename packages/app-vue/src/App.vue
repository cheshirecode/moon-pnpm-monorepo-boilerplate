<script setup lang="ts">
import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';

const contract = createRendererDemoContract('Vue');
</script>

<template>
  <div>
    <a href="/" class="back-link" style="color:inherit;text-decoration:none;display:inline-block;margin-bottom:16px;font-size:13px">← Back to showcase</a>
    <main>
      <h1>{{ contract.title }}</h1>
      <p>{{ formatRendererDemo(contract) }}</p>
      <p>{{ contract.url }}</p>
    </main>
  </div>
</template>
