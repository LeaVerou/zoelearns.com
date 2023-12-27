// https://unsplash.com/documentation#search-photos
export default async function getPhoto(query, options = {}) {
	let url = new URL("https://api.unsplash.com/search/photos/");
	url.searchParams.set("query", query);

	for (let option in options) {
		url.searchParams.set(option, options[option]);
	}

	let response = await fetch(url, {
		headers: {
			Authorization: "Client-ID Sxsv-UZ99YLiDi84bRufynBYxDxGVCPb4Os1nI6uZ-c"
		}
	});

	return response.json();
}