export function setupAnalytics(id) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };

    gtag('js', new Date());
    gtag('config', id);
}

export function trackEvent(action, category, label, value) {
    if (window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
}