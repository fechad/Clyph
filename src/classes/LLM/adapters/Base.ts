// Base adapter for LLMs api callable to be extended by specific LLM adapters

export abstract class BaseAdapter {
    baseUrl: string = '';
    apiKey: string = '';
    model: string = '';
    
    constructor(url: string, model: string, apiKey: string) {
        this.baseUrl = url;
        this.model = model;
        this.apiKey = apiKey;
    }

    abstract ask(query: string): Promise<string>;
    abstract stream(query: string): AsyncGenerator<string>;
    abstract setApiKey(apiKey: string): void;
}