// netlify/functions/getContractSpecs.js
export async function handler(event) {
  const symbol = event.queryStringParameters?.symbol;

  if (!symbol) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "Symbol parameter is required"})
    };
  }

  try {
    const response = await fetch(
      "https://open-api.bingx.com/openApi/swap/v2/quote/contracts",
      {
        method: "GET",
        headers: {"Content-Type": "application/json"}
      }
    );

    const result = await response.json();

    if (result.code !== 0 || !result.data) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to fetch contracts from BingX",
          details: result
        })
      };
    }

    const contracts = Array.isArray(result.data) ? result.data : [result.data];
    const contract = contracts.find((c) => c.symbol === symbol);

    if (!contract) {
      return {
        statusCode: 404,
        body: JSON.stringify({error: `Contract ${symbol} not found`})
      };
    }

		// Временный лог для проверки всех доступных полей контракта (включая плечо)
    console.log(`[getContractSpecs] Raw contract data for ${symbol}:`, contract);

    const spec = {
      symbol: contract.symbol,
      quantityPrecision: Number(contract.quantityPrecision) || 0,
      pricePrecision: Number(contract.pricePrecision) || 2,
			tradeMinQuantity: Number(contract.tradeMinQuantity) || 0.001,
			// Проверяем возможные поля лимита плеча в публичном ответе
      maxLeverage: Number(contract.maxLeverage || contract.maxLongLeverage) || 125
    };

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(spec)
    };
	} catch (error) {
		console.error("[getContractSpecs] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({error: error.message})
    };
  }
}
