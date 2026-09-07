/**
 * The one seam between `generate-day-text` and whatever actually produces
 * prose. `HttpLlmClient` below talks Gemini's OpenAI-compatible
 * chat-completions endpoint (`docs/specs/tagestext.md`) — a different
 * OpenAI-compatible provider is a `LLM_ENDPOINT`/`LLM_MODEL` change, not a
 * code change.
 */
export interface LlmClient {
  generateText(
    args: { readonly systemPrompt: string; readonly userPrompt: string },
  ): Promise<string>;
}

/** Talks to Gemini's OpenAI-compatible chat-completions endpoint. */
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
