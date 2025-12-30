// Sistema de Alertas Personalizados - GO API
class CustomAlert {
    constructor() {
        this.createAlertContainer();
    }

    createAlertContainer() {
        if (document.getElementById('custom-alert-container')) return;

        const container = document.createElement('div');
        container.id = 'custom-alert-container';
        container.className = 'fixed inset-0 z-[9999] hidden';
        container.innerHTML = `
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" id="alert-overlay"></div>
            <div class="absolute inset-0 flex items-center justify-center p-4">
                <div id="alert-box" class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all scale-95 opacity-0">
                    <div class="p-6">
                        <div class="flex items-start gap-4">
                            <div id="alert-icon" class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                                <span class="material-symbols-outlined text-2xl"></span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 id="alert-title" class="text-lg font-bold text-gray-900 dark:text-white mb-2"></h3>
                                <p id="alert-message" class="text-sm text-gray-600 dark:text-gray-300"></p>
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3 justify-end">
                        <button id="alert-cancel" class="hidden px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button id="alert-confirm" class="px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Event listeners
        document.getElementById('alert-overlay').addEventListener('click', () => this.close());
        document.getElementById('alert-confirm').addEventListener('click', () => this.handleConfirm());
        document.getElementById('alert-cancel').addEventListener('click', () => this.handleCancel());
    }

    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            confirmText = 'OK',
            cancelText = 'Cancelar',
            onConfirm = null,
            onCancel = null,
            showCancel = false
        } = options;

        this.onConfirm = onConfirm;
        this.onCancel = onCancel;

        const container = document.getElementById('custom-alert-container');
        const box = document.getElementById('alert-box');
        const icon = document.getElementById('alert-icon');
        const iconSpan = icon.querySelector('.material-symbols-outlined');
        const titleEl = document.getElementById('alert-title');
        const messageEl = document.getElementById('alert-message');
        const confirmBtn = document.getElementById('alert-confirm');
        const cancelBtn = document.getElementById('alert-cancel');

        // Configurar tipo
        const types = {
            success: {
                icon: 'check_circle',
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                iconColor: 'text-green-600 dark:text-green-400',
                btnBg: 'bg-green-600 hover:bg-green-700'
            },
            error: {
                icon: 'error',
                iconBg: 'bg-red-100 dark:bg-red-900/30',
                iconColor: 'text-red-600 dark:text-red-400',
                btnBg: 'bg-red-600 hover:bg-red-700'
            },
            warning: {
                icon: 'warning',
                iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
                iconColor: 'text-yellow-600 dark:text-yellow-400',
                btnBg: 'bg-yellow-600 hover:bg-yellow-700'
            },
            info: {
                icon: 'info',
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                iconColor: 'text-blue-600 dark:text-blue-400',
                btnBg: 'bg-blue-600 hover:bg-blue-700'
            },
            confirm: {
                icon: 'help',
                iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                iconColor: 'text-purple-600 dark:text-purple-400',
                btnBg: 'bg-purple-600 hover:bg-purple-700'
            }
        };

        const config = types[type] || types.info;

        // Aplicar estilos
        icon.className = `flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg}`;
        iconSpan.className = `material-symbols-outlined text-2xl ${config.iconColor}`;
        iconSpan.textContent = config.icon;
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        confirmBtn.className = `px-6 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg ${config.btnBg}`;
        cancelBtn.textContent = cancelText;

        if (showCancel) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }

        // Mostrar
        container.classList.remove('hidden');
        setTimeout(() => {
            box.classList.remove('scale-95', 'opacity-0');
            box.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    close() {
        const container = document.getElementById('custom-alert-container');
        const box = document.getElementById('alert-box');
        
        box.classList.remove('scale-100', 'opacity-100');
        box.classList.add('scale-95', 'opacity-0');
        
        setTimeout(() => {
            container.classList.add('hidden');
        }, 200);
    }

    handleConfirm() {
        if (this.onConfirm) {
            this.onConfirm();
        }
        this.close();
    }

    handleCancel() {
        if (this.onCancel) {
            this.onCancel();
        }
        this.close();
    }
}

// Instância global
const customAlert = new CustomAlert();

// Funções auxiliares
window.showAlert = (message, type = 'info', title = '') => {
    const titles = {
        success: 'Sucesso!',
        error: 'Erro!',
        warning: 'Atenção!',
        info: 'Informação',
        confirm: 'Confirmação'
    };
    
    customAlert.show({
        type,
        title: title || titles[type],
        message
    });
};

window.showSuccess = (message, title = 'Sucesso!') => {
    showAlert(message, 'success', title);
};

window.showError = (message, title = 'Erro!') => {
    showAlert(message, 'error', title);
};

window.showWarning = (message, title = 'Atenção!') => {
    showAlert(message, 'warning', title);
};

window.showInfo = (message, title = 'Informação') => {
    showAlert(message, 'info', title);
};

window.showConfirm = (message, onConfirm, onCancel = null, title = 'Confirmação') => {
    customAlert.show({
        type: 'confirm',
        title,
        message,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        showCancel: true,
        onConfirm,
        onCancel
    });
};

window.showPrompt = (message, onConfirm, placeholder = '', title = 'Digite') => {
    const value = prompt(message, placeholder);
    if (value !== null && value.trim() !== '') {
        onConfirm(value.trim());
    }
};
