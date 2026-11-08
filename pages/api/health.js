// Healthcheck básico: confirma que el servidor responde.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    data: { status: 'ok', timestamp: new Date().toISOString() },
    msg: 'Servicio saludable'
  });
}
