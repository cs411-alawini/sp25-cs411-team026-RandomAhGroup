// Simple MySQL connection test
// Use default Node modules to avoid potential issues

console.log('Starting connectivity test...');

// Hardcoded configuration
const config = {
  // VM IP where you SSH into
  SSH_HOST: '35.224.231.158',
  // Actual MySQL server IP
  DB_HOST: '34.66.46.81',
  DB_USER: 'root',
  DB_PASSWORD: 'password',
  DB_NAME: 'main',
  DB_PORT: 3306, // MySQL port
  SSH_PORT: 22 // SSH port for testing connectivity
};

// First test if we can reach MySQL directly
console.log(`Testing direct connectivity to MySQL at ${config.DB_HOST}:${config.DB_PORT}...`);
const net = require('net');
const mysqlClient = net.createConnection({
  host: config.DB_HOST,
  port: config.DB_PORT,
  timeout: 5000
}, () => {
  console.log('MySQL port is directly reachable! Proceeding with connection.');
  mysqlClient.end();
  testMySQLConnection();
});

mysqlClient.on('error', (err) => {
  console.error(`Error directly connecting to MySQL: ${err.message}`);
  console.error('You might need to connect through the SSH server first.');
  process.exit(1);
});

mysqlClient.on('timeout', () => {
  console.error('Direct MySQL connection test timed out');
  mysqlClient.end();
  console.error('You might need to connect through the SSH server first.');
  process.exit(1);
});

function testMySQLConnection() {
  console.log(`Now attempting to connect to MySQL at ${config.DB_HOST}:${config.DB_PORT}...`);
  console.log(`Using user: ${config.DB_USER}`);
  
  let mysql;
  try {
    console.log('Importing mysql2 module...');
    mysql = require('mysql2');
    console.log('mysql2 module imported successfully');
  } catch (importErr) {
    console.error('Error importing mysql2:', importErr);
    process.exit(1);
  }
  
  try {
    console.log('Creating connection...');
    // Try a connection without specifying database first
    const connection = mysql.createConnection({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      // Skip database name for initial connection test
      connectTimeout: 30000, // Increase timeout to 30 seconds
      debug: true // Enable debug output
    });
    
    console.log('Attempting to connect...');
    connection.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        
        if (err.code === 'ETIMEDOUT') {
          console.error('Connection timed out. Check firewall and network settings.');
          console.error('Make sure port 3306 is open on the MySQL server and GCP firewall rules.');
          console.error('Also check that MySQL is configured to accept remote connections (bind-address = 0.0.0.0)');
          console.error('You might need to connect through SSH tunnel. Try using mysql-ssh or similar package.');
        } else if (err.code === 'ECONNREFUSED') {
          console.error('Connection refused. MySQL might not be running or not accepting remote connections.');
          console.error('Check if bind-address in MySQL config is set to 0.0.0.0 instead of 127.0.0.1');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_ACCESS_DENIED_NO_PASSWORD_ERROR') {
          console.error('Access denied. Check username and password.');
          console.error('Make sure the user has proper remote access permissions.');
          console.error('Run these commands on the MySQL server:');
          console.error(`CREATE USER '${config.DB_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${config.DB_PASSWORD}';`);
          console.error(`GRANT ALL PRIVILEGES ON *.* TO '${config.DB_USER}'@'%' WITH GRANT OPTION;`);
          console.error('FLUSH PRIVILEGES;');
        } else if (err.code === 'ER_HOST_NOT_PRIVILEGED') {
          console.error('Your host is not allowed to connect. On the MySQL server, run:');
          console.error(`CREATE USER '${config.DB_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${config.DB_PASSWORD}';`);
          console.error(`GRANT ALL PRIVILEGES ON *.* TO '${config.DB_USER}'@'%' WITH GRANT OPTION;`);
          console.error('FLUSH PRIVILEGES;');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
          console.error('Database does not exist.');
          console.error('On the MySQL server, run: CREATE DATABASE main;');
        }
        process.exit(1);
      }
    
      console.log('Connected to MySQL successfully!');
      
      // Run a simple query
      connection.query('SHOW DATABASES', (err, results) => {
        if (err) {
          console.error('Error executing query:', err.message);
        } else {
          console.log('Available databases:');
          console.log(results);
          
          // Now try to use the specific database
          connection.query(`USE \`${config.DB_NAME}\``, (err) => {
            if (err) {
              console.error(`Error selecting database ${config.DB_NAME}:`, err.message);
              console.error('On the MySQL server, run: CREATE DATABASE main;');
              connection.end();
              process.exit(1);
            } else {
              console.log(`Successfully connected to database: ${config.DB_NAME}`);
              connection.query('SHOW TABLES', (err, results) => {
                if (err) {
                  console.error('Error executing query:', err.message);
                } else {
                  console.log('Tables in database:');
                  console.log(results);
                }
                
                // Close the connection
                connection.end((err) => {
                  if (err) {
                    console.error('Error closing connection:', err.message);
                  } else {
                    console.log('Connection closed.');
                  }
                  process.exit(0);
                });
              });
            }
          });
        }
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
} 