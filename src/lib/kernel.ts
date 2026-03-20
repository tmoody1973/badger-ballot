import Kernel from "@onkernel/sdk";

let kernelInstance: InstanceType<typeof Kernel> | null = null;

function getKernel(): InstanceType<typeof Kernel> {
  if (!kernelInstance) {
    const apiKey = process.env.KERNEL_API_KEY;
    if (!apiKey) {
      throw new Error("KERNEL_API_KEY is not set");
    }
    kernelInstance = new Kernel({ apiKey });
  }
  return kernelInstance;
}

/**
 * Create a headless browser session, run Playwright code, return results.
 * kernel.sh handles the browser lifecycle — we just send Playwright code.
 */
export async function runBrowserAutomation(
  playwrightCode: string,
  timeoutSec: number = 60,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const kernel = getKernel();

  let sessionId: string | null = null;

  try {
    // Create a headless browser session
    const session = await kernel.browsers.create();
    sessionId = (session as unknown as { id: string }).id;

    // Execute Playwright code directly in the browser VM
    const response = await kernel.browsers.playwright.execute(
      sessionId,
      { code: playwrightCode, timeout_sec: timeoutSec },
    );

    return {
      success: true,
      result: response.result ?? response,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("kernel.sh browser automation error:", message);
    return { success: false, error: message };
  } finally {
    // Always clean up the browser session
    if (sessionId) {
      try {
        await kernel.browsers.delete({ persistent_id: sessionId }).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
