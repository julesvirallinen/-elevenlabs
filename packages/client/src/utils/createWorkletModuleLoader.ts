const URLCache = new Map<string, string>();

const getSha256Hash = async (content: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const calculatedHash = btoa(String.fromCharCode(...hashArray));
  return `sha256-${calculatedHash}`;
};

async function fetchAndValidateWorklet(
  url: string,
  expectedHash: string
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch worklet from ${url}: ${response.status}`);
  }

  const content = await response.text();

  const calculatedHash = await getSha256Hash(content);

  if (calculatedHash !== expectedHash) {
    throw new Error(
      `Worklet hash mismatch at ${url}. Expected: ${expectedHash}, Got: ${calculatedHash}. ` +
        `Please update the self hosted worlet files in your public directory.`
    );
  }

  return content;
}

export function createWorkletModuleLoader(
  name: string,
  staticUrl: string,
  expectedHash: string,
  fallbackSourceCode: string
) {
  return async (worklet: AudioWorklet) => {
    const cachedUrl = URLCache.get(name);
    if (cachedUrl) {
      return worklet.addModule(cachedUrl);
    }

    // Try blob URL first (maximum compatibility)
    const blob = new Blob([fallbackSourceCode], {
      type: "application/javascript",
    });
    const blobURL = URL.createObjectURL(blob);
    try {
      await worklet.addModule(blobURL);
      URLCache.set(name, blobURL);
      return;
    } catch (blobError) {
      URL.revokeObjectURL(blobURL);
    }

    try {
      // Try data URL (for Safari iframe compatibility)
      const base64 = btoa(fallbackSourceCode);
      const moduleURL = `data:application/javascript;base64,${base64}`;
      await worklet.addModule(moduleURL);
      URLCache.set(name, moduleURL);
      return;
    } catch (dataError) {
      // Continue to static file fallback
    }

    // Final fallback: static file with hash validation (CSP-safe)
    try {
      await fetchAndValidateWorklet(staticUrl, expectedHash);
      await worklet.addModule(staticUrl);
      URLCache.set(name, staticUrl);
    } catch (staticError) {
      const errorMessage =
        staticError instanceof Error
          ? staticError.message
          : String(staticError);

      // Throw on hash mismatch so devs can update the files
      if (errorMessage.includes("hash mismatch")) {
        throw staticError;
      }

      // All methods failed - provide comprehensive error message
      throw new Error(
        `Failed to load the ${name} worklet module. Possible causes:
1. Browser doesn't support AudioWorklets (requires Chrome 64+, Firefox 76+, Safari 14.1+)
2. Content Security Policy blocks 'blob:' and 'data:' URLs (copy worklet files to public directory)

To fix CSP issues, copy worklet files: cp node_modules/@elevenlabs/client/dist/worklets/*.js public/worklets/`
      );
    }
  };
}
