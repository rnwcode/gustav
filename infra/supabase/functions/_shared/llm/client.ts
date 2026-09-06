/**
 * The one seam between `generate-day-text` and whatever actually produces
 * prose. `HttpLlmClient` below talks to an OpenAI-compatible HTTP endpoint
 * (Ollama serves one natively, `/v1/chat/completions`) — swapping the local
 * Ollama container for a later externally hosted service is a `LLM_BASE_URL`
 * change, not a code change (`docs/specs/tagestext.md`).
 */
export interface LlmClient {
  generateText(
    args: { readonly systemPrompt: string; readonly userPrompt: string },
  ): Promise<string>;
}

/**
 * Talks to an OpenAI-compatible chat-completions endpoint. Used for both
 * the local Ollama container and, later, an externally hosted service —
 * neither is baked into this class, only `baseUrl`/`apiKey`/`model` are.
 */
export class HttpLlmClient implements LlmClient {
  constructor(
    private readonly config: {
      readonly baseUrl: string;
      readonly apiKey: string | null;
      readonly model: string;
    },
  ) {}

  async generateText(
    args: { readonly systemPrompt: string; readonly userPrompt: string },
  ): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.config.apiKey === null ? {} : { authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: args.systemPrompt },
          { role: 'user', content: args.userPrompt },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status} ${await response.text()}`);
    }
    const body = await response.json();
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('LLM response missing choices[0].message.content');
    }
    return content;
  }
}

/** Fixed, programmed answers for `deno test`/the simulator — no network access. */
export class FakeLlmClient implements LlmClient {
  constructor(private readonly response: string) {}

  generateText(
    _args: { readonly systemPrompt: string; readonly userPrompt: string },
  ): Promise<string> {
    return Promise.resolve(this.response);
  }
}
