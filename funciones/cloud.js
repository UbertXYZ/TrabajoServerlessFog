exports.handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  console.log("=== CLOUD NODE ===");
  console.log("Datos recibidos en Cloud:", body);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Procesamiento completo en Serverless Cloud",
      data: body,
      timestamp: new Date().toISOString(),
    }),
  };
};