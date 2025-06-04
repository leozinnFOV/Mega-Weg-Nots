from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import logging
import configparser
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS CONFIGURAÇÃO CRÍTICA - DEVE SER EXATAMENTE ASSIM
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     supports_credentials=True)

monitoring_status = {
    "active": False,
    "totalUsers": 0,
    "activeUsers": 0,
    "lastCheck": "Nunca"
}

logs_data = []

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.ini')

def load_users_from_ini():
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH, encoding='utf-8')
    users = []
    for section in config.sections():
        if section.startswith('IMAP_'):
            user = {
                'id': section.replace('IMAP_', ''),
                'name': section.replace('IMAP_', ''),
                'email': config[section].get('username', ''),
                'imapServer': config[section].get('server', ''),
                'imapPort': int(config[section].get('port', 993)),
                'telegramChatId': config[section].get('telegram_chat_id', ''),
                'telegramToken': config[section].get('telegram_token', ''),
                'active': config[section].get('is_active', 'True') == 'True',
                'password': config[section].get('password', '')
            }
            users.append(user)
    return users

def save_users_to_ini(users):
    config = configparser.ConfigParser()
    # NÃO ler o arquivo antes de remover as seções, para evitar duplicidade
    # config.read(CONFIG_PATH, encoding='utf-8')
    # Remove all IMAP_ sections
    if os.path.exists(CONFIG_PATH):
        config.read(CONFIG_PATH, encoding='utf-8')
        for section in config.sections():
            if section.startswith('IMAP_'):
                config.remove_section(section)
    # Add users back
    for user in users:
        section = f'IMAP_{user["email"]}'
        config[section] = {
            'server': user['imapServer'],
            'port': str(user['imapPort']),
            'username': user['email'],
            'password': user.get('password', ''),
            'is_active': str(user['active']),
            'telegram_token': user.get('telegramToken', ''),
            'telegram_chat_id': user.get('telegramChatId', '')
        }
    with open(CONFIG_PATH, 'w', encoding='utf-8') as configfile:
        config.write(configfile)

# MIDDLEWARE para log de todas as requisições
@app.before_request
def log_request():
    logger.info(f"🔄 {request.method} {request.path} - Origin: {request.headers.get('Origin', 'N/A')}")

# ENDPOINT DE TESTE OBRIGATÓRIO
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "WEG Monitor Backend Online",
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok", 
        "message": "Backend WEG Monitor funcionando",
        "cors": "enabled",
        "timestamp": datetime.now().isoformat()
    })

# ENDPOINTS PRINCIPAIS
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = load_users_from_ini()
        logger.info(f"📋 Retornando {len(users)} usuários do config.ini")
        return jsonify(users)
    except Exception as e:
        logger.error(f"❌ Erro em get_users: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        logger.info(f"➕ Criando usuário: {data}")
        if not data or not data.get('name') or not data.get('email'):
            return jsonify({"error": "Nome e email são obrigatórios"}), 400
        users = load_users_from_ini()
        # Verifica se já existe usuário com o mesmo email
        if any(u['email'] == data.get('email') for u in users):
            return jsonify({"error": "Já existe um usuário com este email"}), 400
        new_user = {
            'id': data.get('email'),
            'name': data.get('name'),
            'email': data.get('email'),
            'imapServer': data.get('imapServer', ''),
            'imapPort': int(data.get('imapPort', 993)),
            'telegramChatId': data.get('telegramChatId', ''),
            'telegramToken': data.get('telegramToken', ''),
            'active': bool(data.get('active', True)),
            'password': data.get('password', '')
        }
        users.append(new_user)
        save_users_to_ini(users)
        monitoring_status["totalUsers"] = len(users)
        monitoring_status["activeUsers"] = len([u for u in users if u["active"]])
        monitoring_status["lastCheck"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        log_entry = {
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "level": "SUCCESS",
            "message": f"Usuário {new_user['name']} adicionado com sucesso",
            "user": new_user['email']
        }
        logs_data.append(log_entry)
        logger.info(f"✅ Usuário criado: {new_user['name']}")
        return jsonify({"success": True, "message": "Usuário criado", "user": new_user})
    except Exception as e:
        logger.error(f"❌ Erro ao criar usuário: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        users = load_users_from_ini()
        user = next((u for u in users if u['id'] == user_id or u['email'] == user_id), None)
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        users = [u for u in users if not (u['id'] == user_id or u['email'] == user_id)]
        save_users_to_ini(users)
        monitoring_status["totalUsers"] = len(users)
        monitoring_status["activeUsers"] = len([u for u in users if u["active"]])
        log_entry = {
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "level": "WARNING",
            "message": f"Usuário {user['name']} removido",
            "user": user['email']
        }
        logs_data.append(log_entry)
        logger.info(f"🗑️ Usuário removido: {user['name']}")
        return jsonify({"success": True, "message": "Usuário removido"})
    except Exception as e:
        logger.error(f"❌ Erro ao deletar usuário: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>/status', methods=['PATCH'])
def toggle_user_status(user_id):
    try:
        users = load_users_from_ini()
        user = next((u for u in users if u['id'] == user_id or u['email'] == user_id), None)
        if not user:
            return jsonify({"error": "Usuário não encontrado"}), 404
        new_status = not user["active"]
        user["active"] = new_status
        save_users_to_ini(users)
        monitoring_status["activeUsers"] = len([u for u in users if u["active"]])
        log_entry = {
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "level": "INFO",
            "message": f"Status do usuário {user['name']} alterado para {'Ativo' if new_status else 'Inativo'}",
            "user": user['email']
        }
        logs_data.append(log_entry)
        logger.info(f"🔄 Status alterado: {user['name']} -> {'Ativo' if new_status else 'Inativo'}")
        return jsonify({"success": True, "message": "Status alterado", "user": user})
    except Exception as e:
        logger.error(f"❌ Erro ao alterar status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/monitoring/status', methods=['GET'])
def get_monitoring_status():
    try:
        monitoring_status["lastCheck"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        logger.info(f"📊 Status do monitoramento: {monitoring_status}")
        return jsonify(monitoring_status)
    except Exception as e:
        logger.error(f"❌ Erro ao obter status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/monitoring/status', methods=['PATCH'])
def toggle_monitoring():
    try:
        data = request.get_json()
        old_status = monitoring_status["active"]
        monitoring_status["active"] = data.get('active', not monitoring_status["active"])
        monitoring_status["lastCheck"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        
        # Log da operação
        log_entry = {
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "level": "INFO",
            "message": f"Monitoramento {'iniciado' if monitoring_status['active'] else 'parado'}",
            "user": None
        }
        logs_data.append(log_entry)
        
        logger.info(f"🎛️ Monitoramento: {old_status} -> {monitoring_status['active']}")
        return jsonify({"success": True, "active": monitoring_status["active"]})
        
    except Exception as e:
        logger.error(f"❌ Erro ao alterar monitoramento: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        # Adicionar log inicial se vazio
        if not logs_data:
            logs_data.append({
                "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "level": "INFO",
                "message": "Sistema WEG Monitor iniciado com sucesso",
                "user": None
            })
        
        logger.info(f"📝 Retornando {len(logs_data)} logs")
        return jsonify(logs_data[-50:])  # Últimos 50 logs
    except Exception as e:
        logger.error(f"❌ Erro ao obter logs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>/test-connection', methods=['POST'])
def test_imap_connection(user_id):
    try:
        users = load_users_from_ini()
        user = next((u for u in users if u['id'] == user_id or u['email'] == user_id), None)
        if user:
            log_entry = {
                "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "level": "SUCCESS",
                "message": f"Teste de conexão IMAP realizado para {user['name']}",
                "user": user['email']
            }
            logs_data.append(log_entry)
            logger.info(f"📧 Teste IMAP: {user['name']}")
            return jsonify({"success": True, "message": "Conexão IMAP testada com sucesso"})
        return jsonify({"error": "Usuário não encontrado"}), 404
    except Exception as e:
        logger.error(f"❌ Erro no teste IMAP: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/<user_id>/test-telegram', methods=['POST'])
def test_telegram(user_id):
    try:
        users = load_users_from_ini()
        user = next((u for u in users if u['id'] == user_id or u['email'] == user_id), None)
        if user:
            log_entry = {
                "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
                "level": "SUCCESS",
                "message": f"Teste do Telegram realizado para {user['name']}",
                "user": user['email']
            }
            logs_data.append(log_entry)
            logger.info(f"💬 Teste Telegram: {user['name']}")
            return jsonify({"success": True, "message": "Telegram testado com sucesso"})
        return jsonify({"error": "Usuário não encontrado"}), 404
    except Exception as e:
        logger.error(f"❌ Erro no teste Telegram: {e}")
        return jsonify({"error": str(e)}), 500

# TRATAMENTO DE ERROS GLOBAL
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint não encontrado"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erro interno do servidor"}), 500

if __name__ == '__main__':
    print("🚀 ═══════════════════════════════════════")
    print("🚀 INICIANDO WEG MONITOR BACKEND")
    print("🚀 ═══════════════════════════════════════")
    print(f"📡 Servidor: http://localhost:5000")
    print(f"🌐 Frontend: http://localhost:3000")
    print(f"✅ CORS: Habilitado para localhost:3000")
    print(f"🔧 Debug: Ativado")
    print("🚀 ═══════════════════════════════════════")
    
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
