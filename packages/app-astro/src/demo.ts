import { createRendererDemoContract, formatRendererDemo } from '@cheshirecode/demo-contract';

export const astroDemoContract = createRendererDemoContract('Astro');
export const astroDemoText = formatRendererDemo(astroDemoContract);
