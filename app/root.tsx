import {
	Navigate,
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useLocation,
} from "react-router";

import {
	DEFAULT_LOCALE,
	getLocaleDirection,
	getLocaleFromPathname,
	normalizePathname,
	SUPPORTED_LOCALES,
	stripLocalePrefix,
	toLocalePath,
} from "~/i18n/config";
import { BASE_URL } from "~/seo.config";
import { DEFAULT_THEME, parseThemeFromCookieHeader } from "~/utils/theme";
import type { Route } from "./+types/root";
import "./app.css";

const SITE_OG_TITLE = "smail.pw · 1-Hour Temporary Email";
const SITE_OG_DESCRIPTION =
	"Free disposable email inbox with 1-hour auto-expiry. Use a temporary address for sign-ups and verification.";

export async function loader({ request }: Route.LoaderArgs) {
	const theme = parseThemeFromCookieHeader(request.headers.get("Cookie"));
	return { theme };
}

export function meta({ location }: Route.MetaArgs) {
	const pathname = normalizePathname(location.pathname);
	const locale = getLocaleFromPathname(pathname);
	const basePath = stripLocalePrefix(pathname);
	const canonicalUrl = `${BASE_URL}${toLocalePath(basePath, locale)}`;
	const alternateLinks = SUPPORTED_LOCALES.map((supportedLocale) => ({
		tagName: "link" as const,
		rel: "alternate",
		hrefLang: supportedLocale,
		href: `${BASE_URL}${toLocalePath(basePath, supportedLocale)}`,
	}));

	return [
		{
			tagName: "link",
			rel: "canonical",
			href: canonicalUrl,
		},
		...alternateLinks,
		{
			tagName: "link",
			rel: "alternate",
			hrefLang: "x-default",
			href: `${BASE_URL}${toLocalePath(basePath, DEFAULT_LOCALE)}`,
		},
		{
			property: "og:type",
			content: "website",
		},
		{
			property: "og:site_name",
			content: "smail.pw",
		},
		{
			property: "og:url",
			content: canonicalUrl,
		},
		{
			property: "og:title",
			content: SITE_OG_TITLE,
		},
		{
			property: "og:description",
			content: SITE_OG_DESCRIPTION,
		},
		{
			name: "twitter:card",
			content: "summary",
		},
		{
			name: "twitter:title",
			content: SITE_OG_TITLE,
		},
		{
			name: "twitter:description",
			content: SITE_OG_DESCRIPTION,
		},
	];
}

export function Layout({ children }: { children: React.ReactNode }) {
	const location = useLocation();
	const { theme } = useLoaderData<typeof loader>();
	const locale = getLocaleFromPathname(location.pathname);
	const resolvedTheme = theme ?? DEFAULT_THEME;

	return (
		<html
			lang={locale}
			dir={getLocaleDirection(locale)}
			data-theme={resolvedTheme === "light" ? "light" : undefined}
		>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	const location = useLocation();
	const locale = getLocaleFromPathname(location.pathname);
	const homePath = toLocalePath("/", locale);
	const isNotFound = isRouteErrorResponse(error) && error.status === 404;

	if (isNotFound) {
		return <Navigate to={homePath} replace />;
	}

	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
