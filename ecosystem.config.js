module.exports = {
  apps : [{
    name: 'retellai-shim',
    script: 'app.js',
    instance_var: 'INSTANCE_ID',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      LOGLEVEL: 'info',
      HTTP_PORT: 3000,
      JAMBONZ_ACCOUNT_SID: 'your_account_sid',
      JAMBONZ_API_KEY: 'your_api_key',
      JAMBONZ_REST_API_BASE_URL: 'https://jambonz.cloud/api/v1', // or replace with your own self-hosted jambonz URL
      MILLISAI_AGENT_ID: 'your_millis_agent_id',
      MILLISAI_PUBLIC_KEY: 'your_millis_public_key',
      WS_URL: 'wss://your_ngrok_or_other_domain_where_this_app_is_running',
    }
  }]
};