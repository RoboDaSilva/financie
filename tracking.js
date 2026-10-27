/**
 * ==============================================================================
 * tracking.js • financiesuaobra.com.br
 * Módulo Centralizado de Rastreamento Performático (GTM, GA4, Microsoft Clarity)
 * Carregamento não-bloqueante via requestIdleCallback e escuta de primeira interação
 * Zero impacto no First Input Delay (FID), Total Blocking Time (TBT) e LCP.
 * ==============================================================================
 */

(function () {
    'use strict';

    // Configuração dos IDs de Rastreamento (Substitua pelos IDs reais da sua conta)
    const TRACKING_CONFIG = {
        // Ex: 'GTM-XXXXXXX' (deixe vazio se for usar apenas GA4 direto)
        gtmId: window.FSO_GTM_ID || '', 
        // Ex: 'G-XXXXXXXXXX'
        ga4MeasurementId: window.FSO_GA4_ID || '', 
        // Ex: 'xxxxxxxxx' (Clarity project ID)
        clarityId: window.FSO_CLARITY_ID || '' 
    };

    let scriptsInjected = false;

    function injectGTM(gtmId) {
        if (!gtmId || window.dataLayerGtmLoaded) return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
        document.head.appendChild(script);
        window.dataLayerGtmLoaded = true;
    }

    function injectGA4(ga4Id) {
        if (!ga4Id || window.ga4Loaded) return;
        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', ga4Id, {
            send_page_view: true,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
        document.head.appendChild(script);
        window.ga4Loaded = true;
    }

    function injectClarity(clarityId) {
        if (!clarityId || window.clarityLoaded) return;
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", clarityId);
        window.clarityLoaded = true;
    }

    function initAnalytics() {
        if (scriptsInjected) return;
        scriptsInjected = true;

        if (TRACKING_CONFIG.gtmId) {
            injectGTM(TRACKING_CONFIG.gtmId);
        }
        if (TRACKING_CONFIG.ga4MeasurementId) {
            injectGA4(TRACKING_CONFIG.ga4MeasurementId);
        }
        if (TRACKING_CONFIG.clarityId) {
            injectClarity(TRACKING_CONFIG.clarityId);
        }
    }

    // Carregamento diferido: dispara na primeira interação do usuário ou quando a thread estiver ociosa
    function scheduleAnalyticsLoad() {
        const triggers = ['click', 'touchstart', 'scroll', 'keydown'];
        const triggerHandler = function () {
            triggers.forEach(evt => window.removeEventListener(evt, triggerHandler, { passive: true }));
            initAnalytics();
        };

        triggers.forEach(evt => window.addEventListener(evt, triggerHandler, { passive: true, once: true }));

        // Fallback: se o usuário não interagir, carrega após 4 segundos em idle
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                setTimeout(initAnalytics, 4000);
            }, { timeout: 6000 });
        } else {
            setTimeout(initAnalytics, 4000);
        }
    }

    // Helper global para envio de eventos de conversão e leads
    window.trackFSOEvent = function (eventName, eventParams) {
        eventParams = eventParams || {};
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: eventName,
            ...eventParams,
            timestamp: new Date().toISOString()
        });

        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        }
    };

    // Helper específico para cliques no WhatsApp
    window.trackWhatsAppLead = function (source, details) {
        window.trackFSOEvent('conversion_whatsapp_click', {
            source_page: window.location.pathname,
            lead_channel: 'WhatsApp',
            source_element: source || 'button',
            details: details || {}
        });
    };

    // Iniciar agendamento
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleAnalyticsLoad);
    } else {
        scheduleAnalyticsLoad();
    }
})();
