import { assertEquals } from './dev_deps.ts';
import { FakeLlmClient } from './client.ts';

Deno.test('FakeLlmClient returns its programmed response regardless of the prompt', async () => {
  const client = new FakeLlmClient('Heute ist nichts geplant.');
  const text = await client.generateText({ systemPrompt: 'irrelevant', userPrompt: 'irrelevant' });
  assertEquals(text, 'Heute ist nichts geplant.');
});
