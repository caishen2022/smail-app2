import { layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	layout("routes/layout.tsx", [
		route(":lang?", "routes/home.tsx", { id: "home" }),
	]),
	route("/api/email/:id", "routes/api.email.ts"),
] satisfies RouteConfig;
