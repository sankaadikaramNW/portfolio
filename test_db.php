<?php
/**
 * test_db.php - Database Connection Diagnostic Tool
 * Open this in your browser via http://localhost/... to verify database connectivity.
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/html; charset=UTF-8");

echo "<h2>🔧 MySQL Connection Diagnostics</h2>";

// Load secure, Git-ignored database credentials
require_once 'db_config.php';

$db_host = DB_HOST;
$db_user = DB_USER;
$db_pass = DB_PASS;
$db_name = DB_NAME;

echo "Attempting to connect to host: <b>$db_host</b> using user: <b>$db_user</b>...<br>";

try {
    // 1. Establish connection
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "<span style='color: green;'>✅ Successfully connected to the database <b>$db_name</b>!</span><br><br>";
    
    // 2. Check if table exists
    echo "Checking if <b>portfolio_leads</b> table exists...<br>";
    $result = $pdo->query("SHOW TABLES LIKE 'portfolio_leads'");
    if ($result->rowCount() > 0) {
        echo "<span style='color: green;'>✅ Table <b>portfolio_leads</b> exists!</span><br><br>";
        
        // 3. Print row count
        $countResult = $pdo->query("SELECT COUNT(*) as total FROM portfolio_leads");
        $row = $countResult->fetch(PDO::FETCH_ASSOC);
        echo "Total rows in table: <b>" . $row['total'] . "</b><br><br>";
        
        // 4. Print last 3 entries
        echo "<b>Last 3 entries in database:</b><br>";
        $entries = $pdo->query("SELECT * FROM portfolio_leads ORDER BY id DESC LIMIT 3");
        echo "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Message</th><th>Created At</th></tr>";
        while($entry = $entries->fetch(PDO::FETCH_ASSOC)) {
            echo "<tr>";
            echo "<td>" . $entry['id'] . "</td>";
            echo "<td>" . htmlspecialchars($entry['name']) . "</td>";
            echo "<td>" . htmlspecialchars($entry['email']) . "</td>";
            echo "<td>" . htmlspecialchars($entry['message']) . "</td>";
            echo "<td>" . $entry['created_at'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<span style='color: red;'>❌ Table <b>portfolio_leads</b> does not exist!</span><br>";
    }
    
} catch (PDOException $e) {
    echo "<span style='color: red; font-weight: bold;'>❌ Connection Failed:</span> " . htmlspecialchars($e->getMessage()) . "<br><br>";
    echo "<b>Troubleshooting Steps:</b><br>";
    echo "1. Verify that the MySQL module is started and green in your XAMPP Control Panel.<br>";
    echo "2. Make sure the database name is correct in your <code>save_lead.php</code> (currently <code>portfolio_db</code>).<br>";
    echo "3. Verify your username and password are correct.<br>";
}
?>
