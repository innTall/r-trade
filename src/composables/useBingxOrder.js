// src/composables/useBingxOrder.js
import {ref} from "vue";

export function useBingxOrder() {
  const isLoading = ref(false);
  const error = ref(null);
  const lastResult = ref(null);

  const sendOrderToBingx = async (orderParams) => {
    isLoading.value = true;
    error.value = null;
    lastResult.value = null;

    try {
      const response = await fetch("/.netlify/functions/placeBingxBuy", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(orderParams)
      });

      let data;
      try {
        data = await response.json();
      } catch {
        const message = `BingX function returned an invalid response (HTTP ${response.status})`;
        error.value = message;
        return {success: false, bingxCode: "INVALID_RESPONSE", error: message};
      }

      if (!data || typeof data !== "object" || !response.ok || data.success !== true) {
        const message =
          data?.error || data?.bingxMsg || `Failed to place order on BingX (HTTP ${response.status})`;
        error.value = message;
        return {
          success: false,
          bingxCode: data?.bingxCode || "UNKNOWN",
          error: message
        };
      }

      lastResult.value = data.data;
      return {success: true, data: data.data};
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error while placing order";
      error.value = message;
      return {success: false, bingxCode: "NET_ERR", error: message};
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    lastResult,
    sendOrderToBingx
  };
}
