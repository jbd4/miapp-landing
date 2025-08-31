import paypal from "@paypal/checkout-server-sdk";

// Configuración del entorno de PayPal (sandbox o live)
function environment() {
  return new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
  // 👉 Si quieres probar en sandbox, cambia a:
  // return new paypal.core.SandboxEnvironment(
  //   process.env.PAYPAL_CLIENT_ID,
  //   process.env.PAYPAL_CLIENT_SECRET
  // );
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { plan } = req.body;

  // Definimos precios según plan (en euros)
  const priceMap = {
    light: "4.99",
    pro: "9.99",
  };

  if (!priceMap[plan]) {
    return res.status(400).json({ error: "Plan inválido" });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: priceMap[plan],
        },
        description: Plan Premium ${plan},
      },
    ],
    application_context: {
      brand_name: "MiApp",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: https://jbd4.github.io/miapp-landing/success.html?plan=${plan},
      cancel_url: https://jbd4.github.io/miapp-landing/cancel.html?plan=${plan},
    },
  });

  try {
    const order = await client().execute(request);

    // Extraemos el link de aprobación (el que el usuario debe visitar)
    const approvalUrl = order.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.status(200).json({ url: approvalUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando orden de PayPal" });
  }
}
