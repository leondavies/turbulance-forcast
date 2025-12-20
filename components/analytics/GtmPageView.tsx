"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
	interface Window {
		dataLayer: Array<Record<string, unknown>>;
	}
}

export default function GtmPageView() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

		// Ensure dataLayer exists
		if (typeof window !== "undefined") {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push({
				event: "page_view",
				page_location: window.location.href,
				page_path: url,
				page_title: document.title,
			});
		}
		// Trigger on route/search changes
	}, [pathname, searchParams]);

	return null;
}


