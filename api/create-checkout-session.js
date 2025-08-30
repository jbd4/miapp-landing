import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // tu clave secreta en Vercel

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { plan } = req.body;

  // Definimos precios según plan
  const priceMap = {
    light: 499, // en céntimos → 4,99€
    pro: 999    // en céntimos → 9,99€
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: Plan Premium ${plan},
            },
            unit_amount: priceMap[plan],
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: https://jbd4.github.io/miapp-landing/success.html?plan=${plan},
      cancel_url: https://jbd4.github.io/miapp-landing/cancel.html?plan=${plan},
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando sesión de pago" });
  }
}
