<script lang="ts">
  import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';

  const contract = createRendererDemoContract('Svelte');
</script>

<a href="/" class="back-link" style="color:inherit;text-decoration:none;display:inline-block;margin-bottom:16px;font-size:13px">← Back to showcase</a>

<style>
.back-link {
  position: relative;
  opacity: 0.65;
  transition: opacity 150ms ease-out;
}
.back-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 200ms ease-out;
}
.back-link:hover {
  opacity: 1;
}
.back-link:hover::after {
  transform: scaleX(1);
}
</style>

<main>
  <h1>{contract.title}</h1>
  <p>{formatRendererDemo(contract)}</p>
  <p>{contract.url}</p>
</main>
