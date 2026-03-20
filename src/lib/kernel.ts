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
    // The session object may use different field names
    const sessionObj = session as unknown as Record<string, unknown>;
    sessionId = (sessionObj.id ?? sessionObj.session_id ?? sessionObj.browser_id) as string;
    console.log("[kernel] Browser session created:", JSON.stringify(sessionObj).slice(0, 300));

    if (!sessionId) {
      throw new Error(`No session ID in response: ${JSON.stringify(sessionObj).slice(0, 200)}`);
    }

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
