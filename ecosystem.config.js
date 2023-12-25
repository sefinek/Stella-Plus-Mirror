module.exports = {
	apps: [{
		name: 'mirror',
		script: './index.js',

		// Configuration options
		exec_mode: 'fork',
		max_memory_restart: '1G',

		// Monitoring changes in files and restarting the application
		watch: false,
		ignore_watch: ['.git', 'node_modules', 'logs', '.eslintrc.js', 'ecosystem.config.js'],

		// Logging settings
		log_date_format: 'HH:mm:ss.SSS DD.MM.YYYY',
		merge_logs: true,
		log_file: '/home/ubuntu/logs/www/mirror/combined.log',
		out_file: '/home/ubuntu/logs/www/mirror/out.log',
		error_file: '/home/ubuntu/logs/www/mirror/error.log',

		// Application restart policy
		wait_ready: true,
		autorestart: true,
		max_restarts: 5,
		restart_delay: 4000,
		min_uptime: 13000,

		// Environment variables
		env: {
			NODE_ENV: 'production',
		},
	}],
};