export function loadResource(url, type) {
    return fetch(url)
        .then(res => res[type || 'json']());
}
