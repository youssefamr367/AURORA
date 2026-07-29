export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  const present = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  return res.status(200).send(JSON.stringify({ databaseUrlPresent: present }));
}
