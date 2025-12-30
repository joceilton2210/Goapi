const API_CONFIG = {
    baseUrl: 'http://localhost:4000/api',
    // Em produção, isso deve vir de uma variável de ambiente ou configuração segura
    // Para simplificar neste momento, vamos usar a chave definida no .env da API
    apiKey: 'change-this-key' 
};

// Funções auxiliares para chamadas de API
const api = {
    async request(endpoint, method = 'GET', data = null) {
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': API_CONFIG.apiKey
        };

        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Erro na requisição');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
