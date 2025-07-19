// Supported models based on providers

export const supportedModels = {
    openai: [
        'gpt-4',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-1106-preview',
    ],
    anthropic: [
        'claude-1',
        'claude-2',
        'claude-3',
        'claude-3-sonnet',
        'claude-3-haiku',
        'claude-3-opus',
    ],
    google: [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.5-ultra',
        'gemini-1.5-pro-vision',
        'gemini-1.5-flash-vision',
    ],
    azure: [
        'gpt-35-turbo',
        'gpt-4',
        'gpt-4-vision-preview',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-1106-preview',
    ],
    custom: [
        'custom-model-1'
    ],
};