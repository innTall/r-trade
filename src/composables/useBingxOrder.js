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
      const response = await fetch("/.netlify/functions/placeBingxOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderParams)
      });

      const data = await response.json();

      // Если сервер ответил успешно, но сама биржа вернула ошибку (success: false)
      if (!response.ok || data.success === false) {
        return {
          success: false,
          bingxCode: data.bingxCode || "UNKNOWN",
          error: data.error || data.bingxMsg || "Failed to place order on BingX"
        };
      }

      lastResult.value = data.data;
      return {success: true, data: data.data};
    } catch (err) {
      console.error("BingX Order Network Error:", err);
      return {success: false, bingxCode: "NET_ERR", error: err.message};
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
