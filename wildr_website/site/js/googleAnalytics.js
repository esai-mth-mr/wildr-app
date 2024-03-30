const GA_MEASUREMENT_ID = 'G-FE9S0ZQDVV';

// Inject the gtag.js script into the document
(function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
})();

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', GA_MEASUREMENT_ID);
