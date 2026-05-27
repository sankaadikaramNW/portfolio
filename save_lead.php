<?php
/**
 * save_lead.php - Secure Server-Side PHP Connector to Save Leads to a MySQL Database
 * Place this file on your web server hosting the portfolio.
 */

// Allow cross-origin requests (CORS) in case frontend and backend are on different domains
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit;
}

// Load secure, Git-ignored database credentials
require_once 'db_config.php';

// 1. MySQL Database Configuration
$db_host = DB_HOST;
$db_user = DB_USER;
$db_pass = DB_PASS;
$db_name = DB_NAME;// Replace with your database name

// 2. Parse Incoming Data (Handles both Standard Form Data $_POST and JSON payload fallback)
if (empty($_POST['name']) || empty($_POST['email']) || empty($_POST['message'])) {
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);
    if ($data) {
        $_POST['name'] = $data['name'] ?? null;
        $_POST['email'] = $data['email'] ?? null;
        $_POST['message'] = $data['message'] ?? null;
    }
}

if (empty($_POST['name']) || empty($_POST['email']) || empty($_POST['message'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "All fields (name, email, message) are required.",
        "debug_received" => [
            "POST" => $_POST,
            "php_input" => json_decode(file_get_contents('php://input'), true)
        ]
    ]);
    exit;
}

$name = strip_tags(trim($_POST['name']));
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$message = strip_tags(trim($_POST['message']));

// Validate email address
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid email address format."]);
    exit;
}

try {
    // 3. Connect securely to MySQL using PDO
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    // 4. Create the portfolio_leads table automatically if it doesn't exist
    $createTableSQL = "CREATE TABLE IF NOT EXISTS portfolio_leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($createTableSQL);
    
    // 5. Insert submission securely using SQL Prepared Statements (protects against SQL Injection)
    $stmt = $pdo->prepare("INSERT INTO portfolio_leads (name, email, message) VALUES (:name, :email, :message)");
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':message' => $message
    ]);
    
    // 6. Forward submission securely to FormSubmit email notification in the background
    // (This hides your email address completely from browser source code/inspectors!)
    try {
        $email_payload = [
            'Name' => $name,
            'Email' => $email,
            'Message' => $message,
            '_subject' => "New Lead: $name ($email)",
            '_replyto' => $email
        ];
        
        $ch = curl_init('https://formsubmit.co/ajax/research.itw@gmail.com');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($email_payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_exec($ch);
        curl_close($ch);
    } catch (Exception $emailError) {
        // Log error but do not disrupt success response since data was saved to database
        error_log("Email sending failed: " . $emailError->getMessage());
    }
    
    // Success response
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Message sent and database updated successfully."]);
    
} catch (PDOException $e) {
    // Server-side error logging (prevents revealing system paths to frontend)
    error_log("Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Database operation failed: " . $e->getMessage()
    ]);
}
?>
