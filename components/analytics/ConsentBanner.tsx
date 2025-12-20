"use client";

import { useEffect, useState } from "react";

declare global {
	interface Window {
		dataLayer: Record<string, unknown>[];
		gtag?: (...args: unknown[]) => void;
	}
}

const CONSENT_KEY = "turbcast-consent";

function pushConsent(update: Record<string, "granted" | "denied">) {
	if (typeof window === "undefined") return;
	window.dataLayer = window.dataLayer || [];
	const gtag =
		window.gtag ||
		(function (..._args: unknown[]) {
			// Fallback: store a lightweight marker until GTM defines gtag; actual consent will be updated once gtag is available.
			window.dataLayer.push({ event: "consent_deferred_update", payload: update });
		} as (...args: unknown[]) => void);
	gtag("consent", "update", update);
}

export default function ConsentBanner() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem(CONSENT_KEY);
		setIsOpen(!stored);
	}, []);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200">
			<div className="mx-auto max-w-5xl px-4 py-3 flex flex-col md:flex-row items-start md:items-center gap-3">
				<p className="text-sm text-gray-800">
					We use cookies for analytics to improve TurbCast. Consent helps us
					measure page views. You can change your choice later in your browser.
				</p>
				<div className="ml-auto flex gap-2">
					<button
						onClick={() => {
							pushConsent({
								analytics_storage: "granted",
								ad_storage: "denied",
								ad_user_data: "denied",
								ad_personalization: "denied",
							});
							window.localStorage.setItem(CONSENT_KEY, "accepted");
							setIsOpen(false);
						}}
						className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm"
					>
						Allow analytics
					</button>
					<button
						onClick={() => {
							pushConsent({
								analytics_storage: "denied",
								ad_storage: "denied",
								ad_user_data: "denied",
								ad_personalization: "denied",
							});
							window.localStorage.setItem(CONSENT_KEY, "rejected");
							setIsOpen(false);
						}}
						className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm"
					>
						Decline
					</button>
				</div>
			</div>
		</div>
	);
}


