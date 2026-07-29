export function registerRoutes(app, routes, logger = console) {
  for (const route of routes) {
    try {
      logger.log(
        `Registering route: ${route.label} at path: "${route.path}"`
      );
      app.use(route.path, route.router);
      logger.log(`Mounted ${route.label}`);
    } catch (err) {
      logger.error(`Error in ${route.label}:`, err.message);
    }
  }
}
