# @talespin/ai

AI utilities package for Talespin, providing LangChain runnables for image generation and editing operations.

## Installation

This is an internal package within the Talespin monorepo. It's automatically linked via pnpm workspaces.

```bash
# Install dependencies from root
pnpm install
```

## Building

```bash
# Build the package
pnpm --filter @talespin/ai build
```

## Usage

### OpenAIImageEditRunnable

A LangChain Runnable that uses OpenAI's DALL-E 2 model to edit images based on a prompt and mask.

```typescript
import { OpenAIImageEditRunnable } from '@talespin/ai';
import fs from 'fs';

const runnable = new OpenAIImageEditRunnable({
  apiKey: process.env.OPENAI_API_KEY, // Optional, defaults to env var
  model: 'dall-e-2', // Optional, defaults to 'dall-e-2'
});

const imageBuffer = fs.readFileSync('path/to/image.png');
const maskBuffer = fs.readFileSync('path/to/mask.png');

const result = await runnable.invoke({
  prompt: 'A sunlit indoor lounge area with a pool containing a flamingo',
  image: imageBuffer,
  mask: maskBuffer,
  size: '1024x1024', // '256x256' | '512x512' | '1024x1024'
});

// result.editedImageBuffer contains the edited image
fs.writeFileSync('edited-image.png', result.editedImageBuffer);

// result.providerMeta contains metadata about the generation
console.log(result.providerMeta);
// { provider: 'openai', model: 'dall-e-2', size: '1024x1024' }
```

### Input Types

```typescript
type InArgs = {
  prompt: string; // Description of the desired edit
  negativePrompt?: string; // Currently unused, reserved for future use
  image: Buffer; // Original image as Buffer
  mask: Buffer; // Mask defining edit area (transparent = edit, opaque = preserve)
  size: '256x256' | '512x512' | '1024x1024'; // Output image dimensions
};
```

### Output Types

```typescript
type OutArgs = {
  editedImageBuffer: Buffer; // Edited image as Buffer
  providerMeta: {
    provider: 'openai';
    model: string; // Model used for generation
    size: string; // Size of generated image
    requestId?: string; // Optional request ID for tracking
  };
};
```

## API Requirements

- **OpenAI API Key**: Set `OPENAI_API_KEY` environment variable or pass via constructor
- **Model**: Currently supports DALL-E 2 (`dall-e-2`) for image editing
- **Image Format**: Supports PNG format with transparency for masks

## Development

```bash
# Run in watch mode
pnpm --filter @talespin/ai dev
```

## Architecture

This package uses:

- **LangChain Core**: Provides the `Runnable` base class for composable operations
- **OpenAI SDK**: Handles communication with OpenAI's image APIs
- **Vite**: Bundles the package as an ES module with TypeScript declarations

## Notes

- Image editing uses OpenAI's `images.edit` endpoint
- Masks should be PNG images with transparency indicating areas to edit
- The `negativePrompt` parameter is reserved for future use when supported by the API
- All responses use base64 encoding for efficient data transfer
