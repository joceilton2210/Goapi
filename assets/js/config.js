// Configuração Global da Aplicação GO API
(function() {
    'use strict';
    
    // Detectar automaticamente a URL base da API
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    window.GO_API_CONFIG = {
        // URL base da API
        baseUrl: isLocal 
            ? 'http://localhost:4000/api'
            : `${window.location.protocol}//${window.location.host}/api`,
        
        // API Key padrão (deve ser alterada em produção)
        apiKey: 'change-this-key',
        
        // Configurações de ambiente
        environment: isLocal ? 'development' : 'production',
        
        // Timeout para requisições (ms)
        timeout: 30000,
        
        // Intervalo de auto-refresh (ms)
        refreshInterval: 10000,
        
        // Versão da aplicação
        version: '1.0.0'
    };
    
    // Log da configuração (apenas em desenvolvimento)
    if (window.GO_API_CONFIG.environment === 'development') {
        console.log('🚀 GO API Config:', window.GO_API_CONFIG);
    }
    
    // Função auxiliar para fazer requisições à API
    window.apiRequest = async function(endpoint, options = {}) {
        const config = window.GO_API_CONFIG;
        const url = `${config.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };
        
        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    };
    
})();
